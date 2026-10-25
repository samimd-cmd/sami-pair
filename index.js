import express from 'express';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, delay } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
app.use(cors());

app.get('/', (req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SAMI-MD PAIR</title><style>body{background:#000;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{width:92%;max-width:400px;background:#0f0f0f;border:1px solid #00ff88;border-radius:22px;padding:28px;text-align:center}h1{color:#00ff88;margin:0}input{width:100%;padding:14px;margin-top:15px;border-radius:12px;border:1px solid #333;background:#000;color:#fff;box-sizing:border-box}.btn{width:100%;padding:14px;background:#00ff88;border:none;border-radius:12px;font-weight:bold;margin-top:15px;color:#000;font-size:16px}#codeBox{display:none;margin-top:18px;background:#000;border:1px dashed #00ff88;padding:14px;border-radius:12px}#pairCode{font-size:32px;font-weight:bold;color:#00ff88;letter-spacing:3px}</style></head><body><div class="card"><h1>SAMI-MD PAIR</h1><p style="color:#00ff88;font-weight:bold">Created By SAMI</p><input id="num" placeholder="923xxxxxxxxxx" /><button class="btn" onclick="getCode()">GET PAIR CODE</button><div id="codeBox"><div id="pairCode"></div><div style="font-size:11px;color:#aaa;margin-top:6px">20 سیکنڈ کے اندر واٹس ایپ میں ڈالو</div></div></div><script>async function getCode(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(n.length<10){alert('نمبر صحیح لکھو');return;}let b=document.querySelector('.btn');b.innerText='Generating...';try{let r=await fetch('/code?number='+n);let d=await r.json();if(d.code){document.getElementById('pairCode').innerText=d.code;document.getElementById('codeBox').style.display='block';}else alert(d.error)}catch(e){alert('Server Error')}b.innerText='GET PAIR CODE';}</script></body></html>`)
});

app.get('/code', async (req,res)=>{
let num=req.query.number;
let dir=path.join(os.tmpdir(), 'sami-'+Date.now());
try{
const {state, saveCreds}=await useMultiFileAuthState(dir);
const sock=makeWASocket({auth:state,logger:pino({level:"silent"}),printQRInTerminal:false,browser:["SAMI-MD","Chrome","1.0"]});
sock.ev.on('creds.update',saveCreds);
await delay(3500);
let code=await sock.requestPairingCode(num);
res.json({code:code});
setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}, 80000);
}catch(e){console.log(e);res.json({error:e.message})}
});

export default app;
