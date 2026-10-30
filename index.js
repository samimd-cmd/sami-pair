const express = require('express');
const P = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(express.json());

// Vercel me /tmp me hi likh sakte hain
const AUTH_DIR = path.join('/tmp', 'auth_info');
fs.ensureDirSync(AUTH_DIR);

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>SAMI MD PAIR</title>
<style>body{background:#0f0f0f;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0} .box{background:#1e1e1e;padding:25px;border-radius:15px;width:90%;max-width:320px;text-align:center;box-shadow:0 0 20px #25D36633} input,button{width:100%;padding:12px;margin:8px 0;border-radius:8px;border:none;box-sizing:border-box} input{background:#2a2a2a;color:#fff} button{background:#25D366;color:#fff;font-weight:bold;cursor:pointer} #code{font-size:28px;margin:15px 0;font-weight:bold;letter-spacing:4px;color:#25D366;word-break:break-all} h2{margin:0 0 10px}</style>
</head><body><div class="box"><h2>SAMI MD PAIR</h2><p>Number with country code</p><input id="num" placeholder="923XXXXXXXXX"><button onclick="pair()">GET PAIRING CODE</button><div id="code"></div><p id="status" style="font-size:12px;color:#aaa"></p></div>
<script>
async function pair(){
  const num=document.getElementById('num').value.trim();
  if(!num){ alert('Number dalo'); return; }
  document.getElementById('code').innerText='Generating...';
  document.getElementById('status').innerText='Please wait 5-10 sec';
  try{
    const res=await fetch('/pair?number='+num);
    const data=await res.json();
    if(data.code){ document.getElementById('code').innerText=data.code; document.getElementById('status').innerText='Code ko WhatsApp me jao > Linked Devices > Link with phone number pe dalo'; }
    else{ document.getElementById('code').innerText='Error'; document.getElementById('status').innerText=data.error||'Failed'; }
  }catch(e){ document.getElementById('status').innerText=e.message; }
}
</script></body></html>`);
});

app.get('/pair', async (req, res) => {
  let number = req.query.number;
  if(!number) return res.json({ error: 'Number required' });
  number = number.replace(/[^0-9]/g,'');
  try{
    const { version } = await fetchLatestBaileysVersion();
    const sessionId = Math.random().toString(36).substring(7);
    const authPath = path.join(AUTH_DIR, sessionId);
    fs.ensureDirSync(authPath);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const sock = makeWASocket({ version, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })) }, printQRInTerminal: false, logger: P({ level: 'fatal' }), browser: Browsers.ubuntu('Chrome') });
    sock.ev.on('creds.update', saveCreds);
    await delay(3000);
    let code = await sock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    res.json({ code: code });
    // Cleanup after 60 sec
    setTimeout(()=>{ try{ fs.removeSync(authPath); }catch(e){} }, 60000);
  }catch(err){
    console.error(err);
    res.json({ error: err.message });
  }
});

// Vercel ke liye export, listen nahi
module.exports = app;
