import express from 'express';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, delay } from '@whiskeysockets/baileys';
import fs from 'fs';

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
.box{background:#111;border:1px solid #00ff88;padding:25px;border-radius:20px;width:90%;max-width:350px;text-align:center;box-shadow:0 0 25px #00ff8866}
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
if(n.length<11){alert('Number sahi likho 9230...');return;}
document.getElementById('code').innerText='Generating...';
document.getElementById('msg').innerText='Wait 10 sec...';
let res=await fetch('/code?number='+n);
let data=await res.json();
if(data.code){document.getElementById('code').innerText=data.code;document.getElementById('msg').innerText='Go to WhatsApp > Linked Devices > Link with phone number > Enter this code';}
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
try{
if(fs.existsSync('./auth')) fs.rmSync('./auth',{
