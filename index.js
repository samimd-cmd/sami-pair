const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const P = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay } = require('@whiskeysockets/baileys');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());

// Simple Pairing Page - HTML inside JS
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><title>SAMI MD PAIR</title>
<style>body{background:#111;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh} .box{background:#222;padding:20px;border-radius:10px;width:300px;text-align:center} input,button{width:100%;padding:10px;margin:5px 0;border-radius:5px;border:none} button{background:#25D366;color:#fff;font-weight:bold} #code{font-size:24px;margin:10px;font-weight:bold;letter-spacing:3px}</style>
</head><body><div class="box"><h2>SAMI MD PAIR</h2><input id="num" placeholder="923XXXXXXXXX"><button onclick="pair()">GET CODE</button><div id="code"></div></div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io(); const id=Math.random().toString(36).substring(7);
socket.emit('set-user', id);
function pair(){ const n=document.getElementById('num').value; socket.emit('pair-request',{userId:id, number:n}); document.getElementById('code').innerText='Wait...';}
socket.on('pairing-code', c=>{ document.getElementById('code').innerText=c; });
socket.on('console', d=>{ console.log(d); });
</script></body></html>`);
});

const AUTH_DIR = './auth_info'; fs.ensureDirSync(AUTH_DIR);
const sessions = {}; const userSockets = {};

class BotSession {
  constructor(userId){ this.userId=userId; this.authPath=path.join(AUTH_DIR,userId); this.isInitializing=false; }
  async initialize(num){
    if(this.isInitializing) return; this.isInitializing=true;
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
    const sock = makeWASocket({ version, auth:{ creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys, P({level:'fatal'})) }, printQRInTerminal:false, logger:P({level:'fatal'}), browser:Browsers.ubuntu('Chrome') });
    if(num && !state.creds.registered){
      await delay(3000);
      try{ let code=await sock.requestPairingCode(num); code=code?.match(/.{1,4}/g)?.join("-")||code; const sid=userSockets[this.userId]; if(sid) io.to(sid).emit('pairing-code', code); }catch(e){ const sid=userSockets[this.userId]; if(sid) io.to(sid).emit('console',{message:'Error: '+e.message}); }
    }
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (u)=>{
      if(u.connection==='open'){ const sid=userSockets[this.userId]; if(sid) io.to(sid).emit('console',{message:'CONNECTED!'}); }
    });
  }
}
io.on('connection', (socket)=>{
  socket.on('set-user', (uid)=>{ userSockets[uid]=socket.id; if(!sessions[uid]) sessions[uid]=new BotSession(uid); });
  socket.on('pair-request', async ({userId, number})=>{ if(!sessions[userId]) sessions[userId]=new BotSession(userId); await sessions[userId].initialize(number); });
});
const PORT = process.env.PORT || 3000; server.listen(PORT, ()=>console.log('SAMI MD Running'));
