import express from 'express';
import cors from 'cors';
import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, delay } = pkg;
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAMI-MD Pair</title>
<style>
body{background:#000;color:#fff;font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.box{background:#111;border:1px solid #00ff88;padding:25px;border-radius:20px;width:90%;max-width:350px;text-align:center}
h1{color:#00ff88}
input{width:90%;padding:12px;border-radius:10px;border:none;text-align:center;margin:15px 0;font-size:16px}
button{width:95%;padding:12px;background:#00ff88;border:none;border-radius:10px;font-weight:bold;cursor:pointer}
#code{margin-top:20px;font-size:28px;color:#00ff88;letter-spacing:2px;font-weight:bold}
</style>
</head>
<body>
<div class="box">
<h1>SAMI-MD</h1>
<p>Enter Number with Country Code</p>
<input id="num" placeholder="9230xxxxxxxx" />
<button onclick="getCode()">GET 8-DIGIT CODE</button>
<div id="code"></div>
<p id="msg" style="font-size:12px;margin-top:15px"></p>
</div>
<script>
async function getCode(){
let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
if(n.length<11){alert('Number sahi likho');return;}
document.getElementById('code').innerText='Generating...';
let res=await fetch('/code?number='+n);
let data=await res.json();
if(data.code){document.getElementById('code').innerText=data.code;document.getElementById('msg').innerText='WhatsApp > Linked Devices > Link with phone number';}
else{document.getElementById('code').innerText='Error';document.getElementById('msg').innerText=data.error;}
}
</script>
</body>
</html>
`);
});

app.get('/code', async (req,res)=>{
let num = req.query.number;
if(!num) return res.json({error:'No number'});
let authPath = path.join(os.tmpdir(), 'auth-'+Date.now());
try{
const { state, saveCreds } = await useMultiFileAuthState(authPath);
const sock = makeWASocket({ auth: state, printQRInTerminal:false, browser:["SAMI-MD","Chrome","1.0"] });
sock.ev.on('creds.update', saveCreds);
await delay(2000);
let code = await sock.requestPairingCode(num);
res.json({code:code});
}catch(e){
res.json({error: e.message || 'Failed'});
} finally {
setTimeout(()=>{ try{fs.rmSync(authPath,{recursive:true,force:true})}catch{} }, 5000);
}
});

export default app;
