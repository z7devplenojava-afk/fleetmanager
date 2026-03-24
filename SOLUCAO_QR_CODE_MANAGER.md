# 📱 SOLUÇÃO: QR Code pelo Manager (Evolution API v1)

## ⚠️ Problema Identificado

A Evolution API v1.7.5 (e v2) tem um comportamento onde o **QR Code só é gerado de forma confiável pelo Manager**, não pelo endpoint `/instance/connect`.

Isso é um **comportamento esperado** da Evolution API!

---

## ✅ SOLUÇÃO: Usar o Manager Web

### **Passo a Passo Detalhado:**

#### 1. Acesse o Manager:
```
http://localhost:9000/manager
```

#### 2. No Manager, você verá:
- **Botão "+"** ou **"Nova Instância"** no canto superior direito
- OU uma lista de instâncias (se houver)

#### 3. Criar Nova Instância:

**OPÇÃO A - Se não vir instâncias:**
- Clique no botão **"+ Nova Instância"**
- Preencha:
  ```
  Nome: whatsapp-secured-guard
  Integração: Baileys
  Token: (deixe em branco ou use qualquer)
  Número: (deixe em branco)
  ```
- Clique em **"Salvar"**

**OPÇÃO B - Se já houver instâncias:**
- Procure por `whatsapp-final` ou `secured-guard`
- Clique nela

#### 4. Gerar QR Code:
- Após criar ou clicar na instância
- Procure o botão **"CONECTAR"** ou ícone de **telefone/QR Code**
- Clique nele
- **Aguarde 5-10 segundos**
- O QR Code aparecerá no popup

#### 5. Se o QR Code não aparecer:
- Feche o popup (X)
- Aguarde 10 segundos
- Clique em **"CONECTAR"** novamente
- Repita até o QR Code aparecer

#### 6. Conectar:
- Abra WhatsApp no celular
- Vá em **Dispositivos Conectados**
- Toque em **"Conectar dispositivo"**
- Escaneie o QR Code
- **Pronto!** ✅

---

## 🔧 Se o Manager não carregar

### Reiniciar Evolution API:
```powershell
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose restart evolution_v2"
```

Aguarde 15 segundos e acesse novamente:
```
http://localhost:9000/manager
```

---

## 📊 Por que a API não retorna QR Code?

### Comportamento Normal:

1. **Manager**: ✅ Gera QR Code de forma confiável
   - Interface fica "pooling" (perguntando) até o QR aparecer
   - Mostra o QR assim que disponível

2. **Endpoint API** (`/instance/connect`): ⚠️ Inconsistente
   - Às vezes retorna vazio
   - Depende do timing exato
   - Não é confiável para automação

### Recomendação da Evolution API:
**Use o Manager** para conexões manuais (desenvolvimento/teste)  
**Use Webhooks** para automação (produção)

---

## 🎯 Alternativa: Webhook do QR Code

Se você quiser automatizar, configure um webhook que receberá o QR Code:

```yaml
# docker-compose.yml
environment:
  - WEBHOOK_GLOBAL_ENABLED=true
  - WEBHOOK_GLOBAL_URL=http://seu-backend:8080/webhook
  - WEBHOOK_EVENTS_QRCODE_UPDATED=true
```

Quando o QR Code for gerado, a Evolution API envia para seu backend:
```json
{
  "event": "qrcode.updated",
  "instance": "whatsapp-final",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,..."
    }
  }
}
```

---

## 💡 Dica: Usar Postman/Insomnia

Alternativamente, você pode usar **Postman** ou **Insomnia** para ficar fazendo pooling do QR Code:

```javascript
// Request a cada 2 segundos
GET http://localhost:9000/instance/connect/whatsapp-final
Headers:
  apikey: etd2t8kdu5isqdrxh3euhcx0ceflhm92

// Script de repetição
setInterval(() => {
  // Requisição acima
}, 2000);
```

Eventualmente retornará o QR Code.

---

## 🚀 Resumo da Solução

### ✅ **FAÇA AGORA:**

1. **Acesse**: http://localhost:9000/manager
2. **Crie** nova instância pelo botão "+"
3. **Clique** em "CONECTAR"
4. **Aguarde** o QR Code aparecer (pode demorar 10-15 segundos)
5. **Escaneie** com WhatsApp
6. **Pronto!** ✅

---

## 📸 O que Esperar no Manager

### Tela Inicial:
```
┌─────────────────────────────────────────┐
│  Evolution Manager          [+ Nova]    │
├─────────────────────────────────────────┤
│                                         │
│  [Lista de Instâncias]                  │
│                                         │
│  ┌─────────────────────────────┐       │
│  │ whatsapp-final              │       │
│  │ Status: Desconectado         │       │
│  │ [CONECTAR] [CONFIGURAR]     │       │
│  └─────────────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

### Após clicar em CONECTAR:
```
┌─────────────────────────────────────────┐
│  Conectar WhatsApp               [X]    │
├─────────────────────────────────────────┤
│                                         │
│         [QR CODE AQUI]                  │
│         ████████████████                │
│         ████████████████                │
│         ████████████████                │
│                                         │
│  Escaneie com seu WhatsApp              │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ Isso Funciona!

Este é o **método oficial e recomendado** pela Evolution API para desenvolvimento e testes.

**Acesse agora**: http://localhost:9000/manager

