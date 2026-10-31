const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const activeSockets = new Map();

app.post('/pair', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number. Country code ke saath, + ke bina daalein.' });
    }

    try {
        const sessionDir = `./sessions/${phoneNumber}`;
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['Pairing Site', 'Chrome', '1.0.0']
        });

        sock.ev.on('creds.update', saveCreds);
        activeSockets.set(phoneNumber, sock);

        sock.ev.on('connection.update', (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log(`✅ ${phoneNumber} connected`);
            } else if (connection === 'close') {
                console.log(`❌ ${phoneNumber} disconnected`);
                activeSockets.delete(phoneNumber);
            }
        });

        if (!sock.authState.creds.registered) {
            await new Promise(r => setTimeout(r, 1500));
            const code = await sock.requestPairingCode(phoneNumber);
            return res.json({
                success: true,
                pairingCode: code,
                message: 'WhatsApp > Linked Devices > Link with Phone Number, phir yeh code daalein.'
            });
        } else {
            return res.json({ success: true, message: 'Yeh number already registered hai.' });
        }

    } catch (error) {
        console.error('Pair error:', error);
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
