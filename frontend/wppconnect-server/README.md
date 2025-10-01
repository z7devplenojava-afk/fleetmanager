# WPPConnect Server - Secure Guard

Servidor WPPConnect para integração com WhatsApp no sistema Secure Guard.

## 📁 Estrutura

```
frontend/
├── wppconnect-server/     # Servidor WPPConnect
│   ├── server.js         # Servidor principal
│   ├── package.json      # Dependências
│   └── start.bat         # Script de inicialização
└── start_wppconnect.bat  # Script de inicialização (raiz)
```

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
# Opção 1: Script da raiz do frontend
cd frontend
start_wppconnect.bat

# Opção 2: Direto na pasta
cd frontend/wppconnect-server
npm start
```

### 2. Conectar WhatsApp

1. O servidor iniciará na porta **8080**
2. Escaneie o QR Code que aparecerá no terminal
3. Aguarde a conexão ser estabelecida

### 3. Verificar Status

```bash
curl http://localhost:8080/api/status
```

## 📋 Endpoints

- `GET /api/status` - Status da conexão
- `POST /api/send-message` - Enviar mensagem de texto
- `POST /api/send-file` - Enviar arquivo (PDF)

## ⚙️ Configuração

O backend está configurado para usar:
- **URL:** `http://localhost:8080`
- **Session:** `securedguard`
- **Porta:** `8080`

## 🔧 Dependências

- `@wppconnect-team/wppconnect` - Biblioteca principal
- `express` - Servidor web
- `cors` - Cross-origin requests

## 📱 Integração

O sistema Secure Guard usa este servidor para:
- ✅ Enviar holerites via WhatsApp
- ✅ Enviar mensagens de texto
- ✅ Enviar arquivos PDF
- ✅ Verificar status da conexão

## 🎯 Próximos Passos

1. Inicie o servidor: `start_wppconnect.bat`
2. Conecte o WhatsApp escaneando o QR Code
3. Teste o envio de holerites na interface web
4. Verifique os logs no terminal

**🎉 Sistema pronto para enviar holerites via WhatsApp!** 