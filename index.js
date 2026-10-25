import express from 'express';
import cors from 'cors';
import baileys from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import os from 'os';

const makeWASocket = baileys.default;
const useMultiFileAuthState = baileys.useMultiFileAuthState;
const delay = baileys.delay;

const app = express();
app.use(cors());
app.use(express.json());

const services = ["SAMI-MD","JAWAD-MD","JAWAD-AI","ALPHA-MD","GURU-BOT","SUHAIL-MD","ASIT-MD","KING-MD","QUEEN-MD","LUFFY-MD","ANU-MD","STAR-MD","XLICON-MD","SPARK-MD","ZAWAD-MD","DAW-MD","SUBZERO-MD","LORD-MD","HACKER-MD","BLACK-MD","DARK-MD","ALONE-MD","SILENT-MD","CRISS-MD","JERRY-MD","MIYA-MD","RAFI-MD","ANU-MD-V2","ELINA-MD","ROSE-MD","PRABATH-MD","CASEY-MD","SULA-MD","FRED-MD","JAWAD-MD-V3","GIFTED-MD","KNIGHT-MD","PEACE-MD","POWER-MD","LORD-MD-V2","OP-MD","DEVIL-MD","GHOST-MD","NOVA-MD","LEGEND-MD","FIRE-MD","ICE-MD","THUNDER-MD","JAWAD-TECH"];

app.get('/', (req,res)=>{
let options = services.map(s=>`<option value="${s}">${s}</option>`).join('');
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JAWAD-TECH X SAMI-MD PAIR</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:radial-gradient(circle at top,#0f2419,#000);color:#fff;font-family:'Segoe UI',Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:15px}
.main{width:100%;max-width:420px}
.card{background:rgba(15,15,15,0.9);border:1px solid #00ff88;box-shadow:0 0 25px rgba(0,255,136,0.3);border-radius:22px;padding:28px;text-align:center;backdrop-filter:blur(10px)}
.logo{width:85px;height:85px;border-radius:50%;border:3px solid #00ff88;margin:0 auto 12px;background:#000;display:flex;align-items:center;justify-content:center;font-size:38px;box-shadow:0 0 20px #00ff88}
h1{color:#00ff88;font-size:26px;letter-spacing:1px}
.sub{color:#aaa;font-size:13px;margin:8px 0 18px}
label{color:#00ff88;font-size:13px;text-align:left;display:block;margin:12px 0 6px 5px}
select,input{width:100%;padding:14px 15px;border-radius:12px;border:1px solid #222;background:#0a0a0a;color:#fff;font-size:15px;outline:none}
select:focus,input:focus{border-color:#00ff88}
.btn{width:100%;padding:14px;background:linear-gradient(90deg,#00ff88,#00cc6a);border:none;border-radius:12px;font-weight:bold;font-size:16px;cursor:pointer;margin-top:18px;color:#000;transition:0.3s}
.btn:hover{transform:scale(1.02);box-shadow:0 0 15px #00ff88}
#codeBox{margin-top:22px;display:none;background:#000;border:1px dashed #00ff88;padding:16px;border-radius:14px}
#pairCode{font-size:32px;font-weight:bold;color:#00ff88;letter-spacing:3px}
.how{margin-top:18px;background:#0a0a0a;border-radius:12px;padding:12px;text-align:left;font-size:12px;line-height:1.6;color:#bbb}
.how b{color:#00ff88}
footer{margin-top:15px;font-size:11px;color:#555}
</style>
</head>
<body>
<div class="main">
<div class="card">
<div class="logo"><i class="fas fa-bolt"></i></div>
<h1>JAWAD-TECH X SAMI</h1>
<div class="sub">Create Your WhatsApp Pair Code</div>
<label><i class="fas fa-list"></i> Select Service / Bot</label>
<select id="service">${options}</select>
<label><i class="fab fa-whatsapp"></i> Enter WhatsApp Number</label>
<input id="num" placeholder="9230xxxxxxxx" value="923261154942" />
<button class="btn" onclick="getCode()"><i class="fas fa-key"></i> GET PAIR CODE</button>
<div id="codeBox">
<div style="font-size:13px;color:#aaa">YOUR PAIR CODE IS</div>
<div id="pairCode"></div>
<div style="font-size:11px;color:#00ff88;margin-top:8px" id="copyMsg">Tap to Copy</div>
</div>
<div class="how">
<b>How to Pair:</b><br>
1. Open WhatsApp > Linked Devices<br>
2. Click Link a Device<br>
3. Click "Link with phone number"<br>
4. Paste the code above
</div>
<footer>© 2026 SAMI-MD X JAWAD-TECH | All Rights Reserved</footer>
</div>
</div>
<script>
async function getCode(){
let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
let s=document.getElementById('service').value;
if(n.length<11){alert('Enter valid number with country code e.g 9230xxxxxxx');return;}
let btn=document.querySelector('.btn');
btn.innerHTML='Generating... Please wait';
btn.disabled=true;
document.getElementById('codeBox').style.display='none';
try{
let res=await fetch('/code?number='+n+'&service='+s);
let data=await res.json();
if(data.code){
document.getElementById('pairCode').innerText=data.code;
document.getElementById('codeBox').style.display='block';
document.getElementById('pairCode').onclick=()=>{
navigator.clipboard.writeText(data.code);
document.getElementById('copyMsg').innerText='Copied!';
}
window.scrollTo(0,document.body.scrollHeight);
}else{
alert(data.error||'Failed to generate code');
}
}catch(e){alert('Server error, try again')}
btn.innerHTML='<i class="fas fa-key"></i> GET PAIR CODE';
btn.disabled=false;
}
</script>
</body>
</html>
`);
});

app.get('/code', async (req,res)=>{
let num = req.query.number;
if(!num) return res.json({error:'Number missing'});
let authPath = path.join(os.tmpdir(), 'auth-'+Date.now()+'-'+Math.random());
try{
const { state, saveCreds } = await useMultiFileAuthState(authPath);
const sock = makeWASocket({ 
auth: state, 
printQRInTerminal:false, 
browser:["Chrome","Windows","10"],
syncFullHistory:false,
markOnlineOnConnect:false
});
sock.ev.on('creds.update', saveCreds);
await delay(2500);
let code = await sock.requestPairingCode(num);
res.json({code:code});
}catch(e){
res.json({error: e.message || 'Failed, try again after 1 min'});
} finally {
setTimeout(()=>{ try{fs.rmSync(authPath,{recursive:true,force:true})}catch{} }, 3000);
}
});

export default app;
