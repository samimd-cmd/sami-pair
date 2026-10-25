import express from 'express';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, delay } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAMI PAIR</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:15px}
.card{width:100%;max-width:400px;background:#111;border:1px solid #00ff88;border-radius:20px;padding:25px;text-align:center}
.logo{width:80px;height:80px;border-radius:50%;border:2px solid #00ff88;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:35px;color:#00ff88}
h1{color:#00ff88;font-size:26px;letter-spacing:1px}
.sub{color:#888;font-size:13px;margin:10px 0 20px}
label{color:#00ff88;font-size:12px;text-align:left;display:block;margin:12px 0 5px 5px}
select,input{width:100%;padding:13px;border-radius:10px;border:1px solid #333;background:#000;color:#fff;outline:none}
.btn{width:100%;padding:14px;background:#00ff88;border:none;border-radius:10px;font-weight:bold;margin-top:18px;cursor:pointer;font-size:15px;color:#000}
#codeBox{margin-top:20px;display:none;background:#000;border:1px dashed #00ff88;padding:15px;border-radius:10px}
#pairCode{font-size:30px;font-weight:bold;color:#00ff88;letter-spacing:2px}
.how{margin-top:15px;background:#0a0a0a;padding:10px;border-radius:10px;text-align:left;font-size:11px;color:#aaa;line-height:1.6}
</style>
</head>
<body>
<div class="card">
<div class="logo"><i class="fas fa-bolt"></i></div>
<h1>SAMI-MD PAIR</h1>
<div class="sub">Create Your WhatsApp Pair Code</div>
<label>Select Server</label>
<select id="server">${Array.from({length:50},(_,i)=>`<option value="Server-${i+1}">Server-${i+1}</option>`).join('')}</select>
<label>Enter WhatsApp Number</label>
<input id="num" placeholder="9230xxxxxxxx" />
<button class="btn" onclick="getCode()"><i class="fas fa-key"></i> GET PAIR CODE</button>
<div id="codeBox"><div style="font-size:12px;color:#aaa">YOUR CODE</div><div id="pairCode"></div><div style="font-size:11px;color:#00ff88;margin-top:5px">Tap to Copy</div></div>
<div class="how"><b style="color:#00ff88">How to Pair:</b><br>1. Open WhatsApp > Linked Devices<br>2. Click Link a Device<br>3. Click "Link with phone number"<br>4. Paste code</div>
<div style="margin-top:12px;font-size:10px;color:#555">© 2026 SAMI-MD | All Rights Reserved</div>
</div>
<script>
async function getCode(){
let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
if(n.length<11){alert('Valid number likho 9230...');return;}
let btn=document.querySelector('.btn');btn.innerText='Generating...';btn.disabled=true;
try{
let r=await fetch('/code?number='+n);let d=await r.json();
if(d.code){document.getElementById('pairCode').innerText=d.code;document.getElementById('codeBox').style.display='block';document.getElementById('pairCode').onclick=()=>{navigator.clipboard.writeText(d.code);alert('Copied: '+d.code)}}
else alert(d.error);
}catch(e){alert('Error, try again')}
btn.innerText='GET PAIR CODE';btn.disabled=false;
}
</script>
</body>
</html>
`);
});

app.get('/code', async (req,res)=>{
let num = req.query.number;
let p = path.join(os.tmpdir(), 'auth-'+Date.now());
try{
const { state, saveCreds } = await useMultiFileAuthState(p);
const sock = makeWASocket({ auth: state, printQRInTerminal:false, browser:["Chrome","Windows",""] });
sock.ev.on('creds.update', saveCreds);
await delay(2000);
let code = await sock.requestPairingCode(num);
res.json({code:code});
}catch(e){res.json({error:e.message})}
finally{setTimeout(()=>{try{fs.rmSync(p,{recursive:true,force:true})}catch{}},2000)}
});

export default app;
