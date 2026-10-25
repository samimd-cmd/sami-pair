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
res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SAMI-MD PAIR</title><style>body{background:#000;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{width:92%;max-width:400px;background:#0f0f0f;border:1px solid #00ff88;border-radius:22px;padding:28px;text-align:center}h1{color:#00ff88;margin:0}input{width:100%;padding:14px;margin-top:15px;border-radius:12px;border:1px solid #333;background:#000;color:#fff;box-sizing:border-box}.btn{width:100%;padding:14px;background:#00ff88;border:none;border-radius:12px;font-weight:bold;margin-top:15px;color:#000;font-size:16px}#codeBox{display:none;margin-top:18px;background:#000;border:1px dashed #00ff88;padding:14px;border-radius:12px}#pairCode{font-size:28px;font-weight:bold;color:#00ff88;letter-spacing:2px}</style></head><body><div class="card"><h1>SAMI-MD PAIR</h1><p style="color:#00ff88;font-weight:bold">Created By SAMI</p><input id="num" placeholder="923xxxxxxxxxx - Jo number bot banana hai" /><button class="btn" onclick="getCode()">GET PAIR CODE</button><div id="codeBox"><div id="pairCode"></div><div style="font-size:11px;color:#ff4444;margin-top:6px">CODE SIRF 30 SEC KE LIYE VALID HAI, FORAN DALO!</div></div></div><script>async function getCode(){let n=document.getElementById('num').value.replace(/[^0-9]/g,'');if(n.length<10){alert('Number sahi likho');return;}let b=document.querySelector('.btn');b.innerText='Generating... Please wait 10 sec';try{let r=await fetch('/code?number='+n);let d=await r.json();if(d.code){document.getElementById('pairCode').innerText=d.code;document.getElementById('codeBox').style.display='block';}else alert(d.error)}catch(e){alert('Server Error')}b.innerText='GET PAIR CODE';}</script></body></html>`)
});

app.get('/code', async (req,res)=>{
let num=req.query.number;
let dir=path.join(os.tmpdir(), 'sami-'+Date.now());
fs.mkdirSync(dir,{recursive:true});
try{
const {state, saveCreds}=await useMultiFileAuthState(dir);
const sock=makeWASocket({auth:state,logger:pino({level:"silent"}),printQRInTerminal:false,browser:["SAMI-MD","Chrome","1.0"]});
sock.ev.on('creds.update',saveCreds);

// Code generate hone tak socket ko open rakho
await delay(4000);
let code=await sock.requestPairingCode(num);
console.log("CODE:",code,"FOR:",num);
res.json({code:code});

// IMPORTANT: Socket ko 90 sec tak band mat karo warna link nahi hoga
sock.ev.on('connection.update', async (update)=>{
  const {connection} = update;
  if(connection === 'open'){
    console.log("Connected!");
    // Yahan session save ho jayega
    await delay(5000);
    try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
  }
});

// 90 sec ke baad auto delete
setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}, 90000);

}catch(e){
console.log(e);
if(!res.headersSent) res.json({error:e.message})
}
});

export default app;
