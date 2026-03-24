const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const upload = multer({ storage: multer.memoryStorage() });

// Config
const PORT = process.env.PORT || 3333;
const INSTANCE_KEY = process.env.INSTANCE_KEY || 'securedguard';
const SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, '..', 'sessions');
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

const logger = P({ level: 'silent' });

let qrString = null;
let sock = null;
let ready = false;
const inbox = [];
const INBOX_LIMIT = 50;

async function connectToWhatsApp() {
  const authPath = path.join(SESSION_DIR, INSTANCE_KEY);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });
  
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  
  // Buscar versão mais recente do Baileys
  let version;
  try {
    const { version: latestVersion } = await fetchLatestBaileysVersion();
    version = latestVersion;
    console.log('✅ Usando versão mais recente do Baileys:', version);
  } catch (err) {
    version = [2, 3000, 1023204200]; // Versão atualizada
    console.log('⚠️ Usando versão fallback do Baileys:', version);
  }

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: state,
    browser: ['Secured Guard', 'Chrome', '120.0.0.0'], // Nome personalizado
    syncFullHistory: false,
    markOnlineOnConnect: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    console.log('Connection update:', JSON.stringify({ connection, qr: qr ? 'QR_AVAILABLE' : null, error: lastDisconnect?.error?.message }));
    
    if (qr) {
      qrString = qr;
      ready = false;
      console.log('QR code updated');
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Status:', statusCode, 'Reconnect?', shouldReconnect);
      console.log('Error details:', lastDisconnect?.error);
      ready = false;
      qrString = null;
      if (shouldReconnect) {
        setTimeout(() => connectToWhatsApp(), 5000);
      }
    } else if (connection === 'open') {
      ready = true;
      qrString = null;
      console.log('✅ WhatsApp connected and ready!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    try {
      if (!m || !m.messages || m.messages.length === 0) return;
      const msg = m.messages[0];
      const from = msg.key?.remoteJid || '';
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const fromMe = !!msg.key?.fromMe;
      const timestamp = msg.messageTimestamp || Date.now();
      const item = { from, text, fromMe, timestamp, type: m.type };
      inbox.unshift(item);
      if (inbox.length > INBOX_LIMIT) inbox.pop();
      console.log('[INCOMING]', item);

      if (WEBHOOK_URL) {
        try {
          const payload = JSON.stringify({ instance: INSTANCE_KEY, event: 'message', data: item });
          await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
        } catch (e) {
          console.log('Webhook error:', e.message);
        }
      }
    } catch (e) {
      console.log('messages.upsert error:', e.message);
    }
  });
}

// Initialize connection
connectToWhatsApp().catch(err => {
  console.error('Failed to connect:', err);
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ready });
});

// Init instance
app.get('/instance/init', (req, res) => {
  res.json({ key: INSTANCE_KEY, status: 'initialized' });
});

// Connection state
app.get('/instance/connectionState', (req, res) => {
  res.json({ state: ready ? 'open' : 'closed' });
});

// QR code
app.get('/instance/qr', async (req, res) => {
  if (!qrString) return res.status(404).json({ message: 'QR not available' });
  try {
    const format = req.query.format || 'svg';
    
    if (format === 'base64') {
      // Retorna base64 PNG para o backend
      const base64 = await QRCode.toDataURL(qrString);
      res.json({ base64 });
    } else {
      // Retorna SVG (padrão)
      const svg = await QRCode.toString(qrString, { type: 'svg' });
      res.type('image/svg+xml').send(svg);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post('/instance/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
    ready = false;
    qrString = null;
    const authPath = path.join(SESSION_DIR, INSTANCE_KEY);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
    
    // Forçar reconexão após logout para gerar novo QR Code
    console.log('🔄 Forçando reconexão após logout...');
    setTimeout(() => {
      connectToWhatsApp().catch(err => {
        console.error('Failed to reconnect after logout:', err);
      });
    }, 1000);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Send text message
app.post('/message/text', async (req, res) => {
  try {
    // Suportar tanto JSON quanto form-urlencoded
    let id, message;
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      // Parse form-urlencoded
      const querystring = require('querystring');
      const body = querystring.parse(req.body);
      id = (body.id || '').trim();
      message = (body.message || '').trim();
    } else {
      // JSON
      id = (req.body.id || '').trim();
      message = (req.body.message || '').trim();
    }
    
    console.log('[SEND TEXT] Recebido - id:', id, 'message:', message?.substring(0, 50));
    
    if (!ready || !sock) {
      console.log('[SEND TEXT] Erro: Client not ready');
      return res.status(503).json({ success: false, error: 'Client not ready' });
    }
    
    if (!id || !message) {
      console.log('[SEND TEXT] Erro: id or message missing');
      return res.status(400).json({ success: false, error: 'id and message required' });
    }
    
    const jid = id.includes('@s.whatsapp.net') ? id : `${id.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    console.log('[SEND TEXT] Enviando - id:', id, '-> jid:', jid, 'message length:', message.length);
    
    await sock.sendMessage(jid, { text: message });
    
    console.log('[SEND TEXT] ✅ Mensagem enviada com sucesso para:', jid);
    res.json({ success: true, jid });
  } catch (e) {
    console.error('[SEND TEXT] ❌ Erro:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Send document/file
app.post('/message/document', upload.single('file'), async (req, res) => {
  try {
    const id = (req.body.id || '').trim();
    const message = (req.body.message || '').trim();
    const filepath = (req.body.filepath || '').trim();
    const uploadedFile = req.file;
    
    if (!ready || !sock) {
      return res.status(503).json({ success: false, error: 'Client not ready' });
    }
    
    if (!id || (!filepath && !uploadedFile)) {
      return res.status(400).json({ success: false, error: 'id and filepath or file required' });
    }
    
      const jid = id.includes('@s.whatsapp.net') ? id : `${id.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      console.log('[SEND DOC] id:', id, '-> jid:', jid, 'file:', filepath || (uploadedFile ? uploadedFile.originalname : ''));
    
    if (uploadedFile) {
      const fileBuffer = uploadedFile.buffer;
      const fileName = uploadedFile.originalname || 'document.pdf';
      const mimeType = uploadedFile.mimetype || 'application/pdf';

      await sock.sendMessage(jid, {
        document: fileBuffer,
        fileName: fileName,
        mimetype: mimeType,
        caption: message || undefined
      });

      return res.json({ success: true, jid });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'file not found' });
    }
    
    const fileBuffer = fs.readFileSync(filepath);
    const fileName = path.basename(filepath);
    
    await sock.sendMessage(jid, {
      document: fileBuffer,
      fileName: fileName,
      mimetype: 'application/pdf',
      caption: message || undefined
    });
    
      res.json({ success: true, jid });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Debug endpoint to preview JID format
app.get('/debug/jid', (req, res) => {
  const id = (req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'id required' });
  const jid = id.includes('@s.whatsapp.net') ? id : `${id.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  res.json({ id, jid });
});

// Fetch last incoming messages
app.get('/debug/inbox', (req, res) => {
  res.json({ count: inbox.length, messages: inbox });
});

app.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT}`);
});
