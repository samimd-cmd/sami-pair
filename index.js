import express from 'express';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, delay, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SAMI-MD PAIR</title><style>body{background:#0a0a0f;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:15px}.card{width:100%;max-width:420px;background:#151525;border:1px solid #2a2a4a;border-radius:24px;padding:24px;box-shadow:0 0 30px #7c4dff33}h1{color:#9c88ff;text-align:center;margin:0;font-size:30px;letter-spacing:1px}.sub{color:#888;text-align:center;margin-top:5px;font-size:14px}.serverBox{background:#1e1e32;border:1px solid #333355;border-radius:14px;padding:14px;margin-top:18px;display:flex;justify-content:space-between;align-items:center}.quick{background:#1a2a3a;border-radius:14px;padding:14px;margin-top:14px;border:1px solid #2a4a5a}input{width:100%;padding:15px;margin-top:16px;border-radius:14px;border:1px solid #333;background:#0f0f1a;color:#fff;box-sizing:border-box;font-size:16px}.btn{width:100%;padding:16px;background:linear-gradient(90deg,#ff9a00,#ff6a00);border:none;border-radius:14px;font-weight:bold;margin-top:16px;color:#fff;font-size:17px;cursor:pointer}#codeBox{display:none;margin-top:18px;background:#0f0f1a;border:1px dashed #ff9a00;padding:14px;border-radius:14px;text-align:center}#pairCode{font-size:32px;font-weight:bold;color:#ff9a00;letter-spacing:3px}</style></head><body><div class="card"><div style="text-align:center"><div style="width:70px;height:70px;background:linear-gradient(135deg,#7c4dff,#4d88ff);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:35px">⚡</div><h1>SAMI-MD</h1><div class="sub">Generate Your Pairing Code</div></div><div class="serverBox"><div><div style="font-weight:bold">Server 48</div><div style="font-size:12px;color:#888">● Active: 4 &nbsp; Limit: 4/50</div></div><div style="background:#2a2a4a;padding:6px 14px;border-radius:20px;font-size:13px">▼ Select</div></div><div class="quick"><div style="font-weight:bold">ⓘ Quick Setup</div><div style="font-size:13px;color:#aaa;margin-top:4px">Select a server, enter your WhatsApp number to instantly generate a pairing code. No deploy needed!</div></div><input id="num" placeholder="923261154942" value="923261154942" /><div style="font-size:12px;color:#777;margin-top:6px">Include country code (e.g., 92 for Pakistan)</div><button class="btn" onclick="getCode()">🔑 Generate Pair Code</button><div id="codeBox"><div id="pairCode"></div><div style="font-size:11px;color:#aaa;margin-top:6px">30 sec ke andar WhatsApp me dalo</div></div><div style="text-align:center;color:#555;font-size:12px;margin-top:18px">© 2026 SAMI-MD | Powered By SAMI-MD</div></div><script>async function getCode(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(n.length<10){alert('Number sahi likho');return;}let b=document.querySelector('.btn');b.innerText='Generating...';try{let r=await fetch('/code?number='+n);let d=await r.json();if(d.code){document.getElementById('pairCode').innerText=d.code;document.getElementById('codeBox').style.display='block';}else alert(d.error||'Failed')}catch(e){alert('Server Error, try again')}b.innerText='🔑 Generate Pair Code';}</script></body></html>`)
});

app.get('/code', async (req,res)=>{
let num = (req.query.number||'').replace(/[^0-9]/g,'');
if(!num){return res.json({error:"Number do"})}
let dir = path.join(os.tmpdir(), 'sami-'+Date.now());
fs.mkdirSync(dir,{recursive:true});
try{
const {state, saveCreds} = await useMultiFileAuthState(dir);
const sock = makeWASocket({
auth: state,
logger: pino({level:"silent"}),
printQRInTerminal: false,
browser: Browsers.macOS("Desktop")
});
sock.ev.on('creds.update', saveCreds);
await delay(2500);
let code = await sock.requestPairingCode(num);
console.log(`PAIR CODE ${code} FOR ${num}`);
res.json({code:code});
// socket ko 60 sec tak alive rakho taake link ho sake
setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}, 60000);
}catch(e){
console.log(e);
if(!res.headersSent) res.json({error:e.message})
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SAMI-MD RUNNING"));
export default app;
