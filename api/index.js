const express = require('express');
const P = require('pino');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(express.json());
const AUTH_DIR = path.join('/tmp', 'auth_info');
fs.ensureDirSync(AUTH_DIR);

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><title>SAMI MD PAIR</title><style>body{background:#111;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif}.box{background:#222;padding:20px;border-radius:10px;width:300px;text-align:center}input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:none}button{background:#25D366;color:#fff;font-weight:bold}#code{font-size:24px;margin:10px;font-weight:bold;letter-spacing:3px;color:#25D366}</style></head><body><div class="box"><h2>SAMI MD PAIR</h2><input id="num" placeholder="92300XXXXXXX"><button onclick="pair()">GET CODE</button><div id="code"></div><p id="st" style="font-size:11px;color:#aaa"></p></div><script>async function pair(){const n=document.getElementById('num').value.trim();if(!n)return alert('Number dalo');document.getElementById('code').innerText='Wait...';document.getElementById('st').innerText='10 sec lagega';try{const r=await fetch('/api/pair?number='+n);const d=await r.json();if(d.code){document.getElementById('code').innerText=d.code;document.getElementById('st').innerText='WhatsApp > Linked Devices > Link with phone number'}else{document.getElementById('st').innerText=d.error||'Failed'}}catch(e){document.getElementById('st').innerText=e.message}}</script></body></html>`);
});

app.get('/api/pair', async (req, res) => {
  let number = (req.query.number||'').replace(/[^0-9]/g,'');
  if(!number) return res.json({error:'Number required'});
  try{
    const { version } = await fetchLatestBaileysVersion();
    const id = Date.now().toString();
    const authPath = path.join(AUTH_DIR, id);
    fs.ensureDirSync(authPath);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const sock = makeWASocket({version, auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys, P({level:'fatal'}))}, printQRInTerminal:false, logger:P({level:'fatal'}), browser:Browsers.ubuntu('Chrome')});
    sock.ev.on('creds.update', saveCreds);
    await delay(3000);
    let code = await sock.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join("-")||code;
    res.json({code});
    setTimeout(()=>{ try{fs.removeSync(authPath)}catch(e){} }, 30000);
  }catch(err){ res.json({error:err.message}); }
});

module.exports = app;
