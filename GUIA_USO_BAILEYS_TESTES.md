# 🧪 **GUIA: Usar Baileys para Testes (Temporário)**

## ⚠️ **ATENÇÃO CRÍTICA**

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  BAILEYS É NÃO OFICIAL E VIOLA POLÍTICAS META      │
│                                                         │
│  ✅ OK para: Testes locais (1-2 semanas)               │
│  ❌ NÃO OK para: Produção, dados reais, longo prazo   │
│                                                         │
│  📅 PRAZO MÁXIMO: 30 dias                              │
│  📊 LIMITE: 20 mensagens/dia                           │
│                                                         │
│  🚀 OBRIGATÓRIO: Migrar para Cloud API antes produção │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **O QUE PODE FAZER**

### **PERMITIDO (com Baileys):**

```yaml
✅ Desenvolvimento local (localhost)
✅ Testes de funcionalidades
✅ Validação de fluxos
✅ Treinamento de RH
✅ Demonstrações internas
✅ POCs (Provas de Conceito)
✅ QA/Testes internos
✅ Máximo 30 dias de uso
✅ Máximo 20 envios/dia
```

---

## ❌ **O QUE NÃO PODE FAZER**

### **PROIBIDO (com Baileys):**

```yaml
❌ Ambiente de produção
❌ Envios para funcionários reais
❌ Servidor público/domínio oficial
❌ Uso prolongado (>30 dias)
❌ Volume alto (>20 msg/dia)
❌ Número principal da empresa
❌ Dados sensíveis reais
❌ Processos críticos de negócio
```

---

## 🚀 **PASSO A PASSO - TESTES COM BAILEYS**

### **1. Preparação (10 min)**

#### **1.1. Obter número de teste**

```bash
# ⚠️ NÃO use:
# - Seu número pessoal
# - Número da empresa
# - Número que não pode perder

# ✅ USE:
# - Chip pré-pago novo
# - Número temporário/descartável
# - Linha que pode ser bloqueada sem problemas
```

**Recomendação:** Tim/Vivo pré-pago (R$ 10-20)

#### **1.2. Configurar application-test.properties**

```properties
# Copie backend/src/main/resources/application-test.properties
# Configure seus números de teste:

whatsapp.test.mode=true
whatsapp.max.messages.per.day=20
whatsapp.test.numbers=5531999887766,5531988776655  # ← Seus números de teste
baileys.enabled=true
```

---

### **2. Iniciar Sistema (5 min)**

#### **2.1. Iniciar Baileys (WhatsApp Service)**

```powershell
# Terminal 1: Subir serviço WhatsApp (Baileys)
cd whatsapp-service
npm install  # Se primeira vez
npm start

# Aguarde aparecer QR Code
# Saída esperada:
# ✅ Server running on port 3333
# 📱 QR Code disponível em /instance/qr
```

#### **2.2. Escanear QR Code**

```powershell
# Terminal 2: Obter QR Code
curl http://localhost:3333/instance/qr

# Ou abra no navegador:
# http://localhost:3333/instance/qr

# 📱 Use WhatsApp do seu TESTE para escanear
```

#### **2.3. Iniciar Backend**

```powershell
# Terminal 3: Backend com perfil TEST
cd backend
mvnw spring-boot:run -Dspring.profiles.active=test

# Logs esperados:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚠️  MODO DE TESTE ATIVADO - USANDO BAILEYS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚨 Baileys NÃO é aprovado pela Meta
# 🔒 Limite: 20 mensagens/dia
# 📋 Números permitidos: [...]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **3. Testar Funcionalidades (30 min)**

#### **3.1. Conceder Consentimento de Teste**

```bash
# 1. Obter ID de usuário de teste
# 2. Conceder consentimento

curl -X POST http://localhost:8080/api/whatsapp-consent/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "userId": "uuid-usuario-teste",
    "whatsappNumber": "5531999887766"
  }'

# Resposta esperada:
# ✅ hasConsent: true
```

#### **3.2. Testar Envio Individual**

```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "tipo": "whatsapp",
    "cpf": "CPF_USUARIO_TESTE"
  }'

# Verificar logs:
# ✅ Arquivo enviado com sucesso via Baileys
# 📊 Mensagens enviadas hoje: 1/20
```

#### **3.3. Verificar Limite**

```bash
# Tentar enviar 21+ mensagens no mesmo dia

# Resposta esperada na 21ª:
# 🚫 LIMITE DIÁRIO ATINGIDO: 20/20 mensagens
# ⚠️  Aguarde até amanhã OU migre para WhatsApp Cloud API
```

---

### **4. Monitoramento (durante testes)**

#### **4.1. Verificar Mensagens Restantes**

```bash
# Logs mostram automaticamente:
# 📊 Mensagens enviadas hoje: 15/20

# Ao atingir 16 (80%):
# ⚠️  Você está próximo do limite diário! (16/20)

# Ao atingir 18:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 LEMBRE-SE: Migre para WhatsApp Cloud API!
# 📄 Guia: MIGRACAO_WHATSAPP_BUSINESS_API_OFICIAL.md
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### **4.2. Verificar Saúde do WhatsApp**

```bash
# Verificar se ainda conectado
curl http://localhost:3333/health

# Resposta esperada:
# { "status": "ok", "ready": true }

# Se ready: false, precisa re-escanear QR Code
```

---

## 📊 **PROTEÇÕES IMPLEMENTADAS**

### **1. Limite Diário**

```java
// WhatsAppTestConfig.java
✅ Máximo 20 mensagens/dia (padrão)
✅ Contador reseta à meia-noite
✅ Bloqueia automaticamente após limite
```

### **2. Números Permitidos (Opcional)**

```properties
# application-test.properties
whatsapp.test.numbers=5531999887766,5531988776655

# Se configurado:
✅ Apenas estes números podem receber
❌ Outros números são bloqueados automaticamente
```

### **3. Avisos de Migração**

```
Quando atingir 16+ mensagens/dia:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 LEMBRE-SE: Migre para WhatsApp Cloud API!
📄 Guia: MIGRACAO_WHATSAPP_BUSINESS_API_OFICIAL.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⏰ **CRONOGRAMA RECOMENDADO**

### **Semana 1-2: Testes com Baileys**

```
Dia 1-3:   Setup + Testes básicos
Dia 4-7:   Validação de fluxos
Dia 8-10:  Treinamento RH
Dia 11-14: Ajustes e refinamentos
```

### **Semana 3: Migração para Cloud API**

```
Dia 15:    Setup Meta Business Manager
Dia 16-17: Criar e aprovar templates
Dia 18-19: Implementar WhatsAppCloudService
Dia 20-21: Testes com Cloud API
```

### **Semana 4: Deploy Produção**

```
Dia 22-23: Testes finais
Dia 24:    Deploy produção
Dia 25-28: Monitoramento
```

---

## 🔍 **TROUBLESHOOTING**

### **Problema: QR Code não aparece**

```bash
# Verificar logs do whatsapp-service
# Se erro: "versão antiga"

# Solução:
cd whatsapp-service
npm update @whiskeysockets/baileys
npm start
```

### **Problema: Limite atingido antes de 20**

```bash
# Verificar configuração
grep "max.messages" application-test.properties

# Aumentar temporariamente (cuidado!)
whatsapp.max.messages.per.day=30  # Não exagere!
```

### **Problema: "Número não autorizado"**

```bash
# Verificar lista de números permitidos
# Adicionar seu número:

whatsapp.test.numbers=5531999887766,5531988776655,SEU_NOVO_NUMERO
```

### **Problema: WhatsApp desconectou**

```bash
# Re-escanear QR Code
curl http://localhost:3333/instance/qr

# Ou restart do serviço
cd whatsapp-service
npm start
```

---

## 🚨 **SINAIS DE ALERTA**

### **Parar IMEDIATAMENTE se:**

```
⚠️  Mensagens param de entregar (>50% falha)
⚠️  "Este número pode estar sendo usado de forma não autorizada"
⚠️  Precisa re-escanear QR Code a cada hora
⚠️  Número bloqueado temporariamente (24-72h)
🚫 "Número banido permanentemente"
```

**Ação:** PARAR uso imediato, migrar para Cloud API

---

## ✅ **CHECKLIST DIÁRIO**

Antes de cada sessão de testes:

- [ ] WhatsApp Service rodando? (`curl http://localhost:3333/health`)
- [ ] Backend em modo teste? (ver logs "MODO DE TESTE ATIVADO")
- [ ] Contador resetado? (novo dia = 0/20)
- [ ] Número de teste conectado?
- [ ] Limite não atingido? (<20 mensagens hoje)

---

## 📝 **REGISTRO DE TESTES**

Mantenha log manual:

```
Data: 06/11/2025
Mensagens enviadas: 15/20
Funcionalidades testadas:
  ✅ Envio individual
  ✅ Consentimento
  ⚠️  Envio em massa (testar amanhã)
Problemas encontrados: Nenhum
Próximo passo: Testar revogação
```

---

## 🚀 **QUANDO MIGRAR**

### **Migre quando:**

```
✅ Funcionalidades validadas (todas OK)
✅ RH treinado
✅ Fluxos testados
✅ Bugs corrigidos
✅ Pronto para produção
```

### **Não espere:**

```
❌ Primeiro aviso Meta
❌ Bloqueio temporário
❌ Problemas em produção
❌ Após banimento (tarde demais!)
```

---

## 📞 **SUPORTE**

**Problemas técnicos:**
- Logs: `tail -f logs/application.log | grep "WhatsApp"`
- Baileys: https://github.com/WhiskeySockets/Baileys

**Migração:**
- Guia: `MIGRACAO_WHATSAPP_BUSINESS_API_OFICIAL.md`
- Docs Meta: https://developers.facebook.com/docs/whatsapp

---

## 🎯 **RESUMO**

| Item | Permitido | Limite |
|------|-----------|--------|
| **Ambiente** | ✅ DEV/QA local | ❌ Produção |
| **Duração** | ✅ Até 30 dias | ❌ Permanente |
| **Volume** | ✅ 20 msg/dia | ❌ >20/dia |
| **Número** | ✅ Teste/descartável | ❌ Oficial |
| **Dados** | ✅ Fictícios | ❌ Reais |

**LEMBRE-SE:**
- 🧪 Baileys = APENAS testes temporários
- 🚀 Cloud API = Produção (obrigatório)
- ⏰ Prazo máximo = 30 dias
- 📊 Limite = 20 msg/dia

**🚀 BOA SORTE NOS TESTES!**

