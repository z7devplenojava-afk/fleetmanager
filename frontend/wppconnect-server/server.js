const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simular status do WhatsApp
let whatsappStatus = {
    connected: false,
    session: 'securedguard'
};

// Simular QR Code
const generateQRCode = () => {
    return `
    ╔══════════════════════════════════════════╗
    ║           WHATSAPP QR CODE               ║
    ║                                          ║
    ║  ██████████████████████████████████████  ║
    ║  █ ▄▄▄▄▄ █▀█ █▄█▄█ ▄▄▄▄▄ █▄▀▄▀▄▀▄▀▄  ║
    ║  █ █   █ █▀▀▀█ ▀▄▀▀▀█ █   █▀▄▄▀▄▀▄▀  ║
    ║  █ █▄▄▄█ █▀ █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ║
    ║  █▄▄▄▄▄▄▄█▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄  ║
    ║  █ ▄▄▄▄▄ █▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄  ║
    ║  █ █   █ █▀▀▀█ ▀▄▀▀▀█ █   █▀▄▄▀▄▀▄▀  ║
    ║  █ █▄▄▄█ █▀ █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ║
    ║  █▄▄▄▄▄▄▄█▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄  ║
    ║  █ ▄▄▄▄▄ █▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄  ║
    ║  █ █   █ █▀▀▀█ ▀▄▀▀▀█ █   █▀▄▄▀▄▀▄▀  ║
    ║  █ █▄▄▄█ █▀ █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ║
    ║  █▄▄▄▄▄▄▄█▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄  ║
    ║                                          ║
    ║  SIMULADOR WHATSAPP - SECURE GUARD      ║
    ║  Escaneie este QR Code para conectar    ║
    ╚══════════════════════════════════════════╝
    `;
};

// Iniciar servidor
const PORT = 8080;

app.listen(PORT, () => {
    console.log('🚀 Servidor WhatsApp Simulator iniciado!');
    console.log(`📱 Porta: ${PORT}`);
    console.log(`🔗 Status: http://localhost:${PORT}/api/status`);
    console.log('\n' + generateQRCode());
    console.log('\n📋 Para conectar, escaneie o QR Code acima');
    console.log('⏳ Aguardando conexão...');
});

// Endpoints da API
app.get('/api/status', (req, res) => {
    res.json({
        connected: whatsappStatus.connected,
        session: whatsappStatus.session,
        timestamp: Date.now()
    });
});

app.post('/api/connect', (req, res) => {
    whatsappStatus.connected = true;
    console.log('✅ WhatsApp conectado!');
    res.json({
        success: true,
        message: 'WhatsApp conectado com sucesso',
        connected: true
    });
});

app.post('/api/disconnect', (req, res) => {
    whatsappStatus.connected = false;
    console.log('❌ WhatsApp desconectado!');
    res.json({
        success: true,
        message: 'WhatsApp desconectado',
        connected: false
    });
});

app.post('/api/send-message', async (req, res) => {
    try {
        const { number, text } = req.body;
        
        if (!whatsappStatus.connected) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp não está conectado'
            });
        }

        console.log(`📱 Enviando mensagem para ${number}: ${text}`);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso (simulado)',
            to: number,
            text: text
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem: ' + error.message
        });
    }
});

app.post('/api/send-file', async (req, res) => {
    try {
        const { number, path, caption } = req.body;
        
        if (!whatsappStatus.connected) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp não está conectado'
            });
        }

        console.log(`📁 Enviando arquivo para ${number}: ${path}`);
        console.log(`📝 Legenda: ${caption}`);
        
        res.json({
            success: true,
            message: 'Arquivo enviado com sucesso (simulado)',
            to: number,
            path: path,
            caption: caption
        });
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar arquivo: ' + error.message
        });
    }
});

// Endpoint para conectar manualmente
app.get('/api/connect-manual', (req, res) => {
    whatsappStatus.connected = true;
    console.log('✅ WhatsApp conectado manualmente!');
    res.json({
        success: true,
        message: 'WhatsApp conectado manualmente',
        connected: true
    });
});

console.log('🔧 Servidor WhatsApp Simulator configurado');
console.log('📋 Endpoints disponíveis:');
console.log('  GET  /api/status - Status da conexão');
console.log('  POST /api/connect - Conectar WhatsApp');
console.log('  POST /api/disconnect - Desconectar WhatsApp');
console.log('  POST /api/send-message - Enviar mensagem');
console.log('  POST /api/send-file - Enviar arquivo');
console.log('  GET  /api/connect-manual - Conectar manualmente'); 