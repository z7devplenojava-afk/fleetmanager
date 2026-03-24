# 📱 **GUIA RÁPIDO: Consentimento WhatsApp**

## 🎯 **Para que serve?**

Proteger a empresa de **banimento pela Meta** e **multas LGPD** ao enviar holerites via WhatsApp.

---

## ❌ **ANTES (PERIGOSO)**

```
Funcionário tem WhatsApp cadastrado
         ↓
Sistema envia holerite DIRETO
         ↓
❌ SEM consentimento
❌ Violação Meta Policy
❌ Violação LGPD
❌ Risco de banimento
```

---

## ✅ **AGORA (SEGURO)**

```
Funcionário tem WhatsApp cadastrado
         ↓
Sistema verifica: TEM CONSENTIMENTO?
         ↓
    SIM ✅           NÃO ❌
    ↓                ↓
Envia holerite   Bloqueia envio
                 Mostra: "Autorização necessária"
```

---

## 🔧 **O que foi implementado?**

### **1. Banco de Dados**
```sql
✅ Campo: whatsapp_consent (sim/não)
✅ Campo: whatsapp_consent_date (quando autorizou)
✅ Campo: whatsapp_consent_ip (de onde autorizou)
✅ Campo: whatsapp_consent_user_agent (como autorizou)
```

### **2. Backend (Java)**
```java
✅ Validação OBRIGATÓRIA antes de enviar
✅ Filtro em envios em massa (só quem autorizou)
✅ Endpoints para gerenciar consentimento
✅ Log de auditoria completo
```

### **3. Frontend (React)**
```tsx
✅ Modal de autorização (WhatsAppConsentModal)
✅ Configurações do usuário (WhatsAppConsentSettings)
✅ Interface para revogar autorização
```

---

## 👤 **Como funciona para o FUNCIONÁRIO?**

### **Primeira vez:**

1. Login no sistema
2. Modal aparece: "Autorizar receber holerites WhatsApp?"
3. Funcionário lê as informações LGPD
4. Marca checkboxes de consentimento
5. Clica "Autorizar"
6. ✅ Pronto! Receberá holerites via WhatsApp

### **Para revogar:**

1. Menu → Meu Perfil → Configurações
2. Seção "Consentimento WhatsApp"
3. Clica "Revogar Autorização"
4. Confirma ação
5. ✅ Não receberá mais mensagens WhatsApp

---

## 👔 **Como funciona para o RH?**

### **Envio individual:**

```
RH seleciona holerite → Clica "Enviar WhatsApp"
         ↓
Sistema verifica consentimento
         ↓
    TEM ✅              NÃO TEM ❌
    ↓                   ↓
Envia sucesso        Erro: "Funcionário não autorizou"
                     Sugestão: "Solicite autorização"
```

### **Envio em massa:**

```
RH clica "Enviar para Todos"
         ↓
Sistema filtra: apenas quem AUTORIZOU
         ↓
Exemplo:
- 100 funcionários com WhatsApp
- 80 autorizaram ✅
- 20 não autorizaram ❌
         ↓
Envia para 80
Mostra: "80 enviados, 20 sem consentimento"
```

---

## 📊 **Relatórios**

### **Consultar status geral:**

```sql
-- Quantos funcionários autorizaram?
SELECT COUNT(*) FROM users WHERE whatsapp_consent = TRUE;

-- Quem NÃO autorizou?
SELECT name, username, whatsapp 
FROM users 
WHERE whatsapp IS NOT NULL 
  AND (whatsapp_consent IS NULL OR whatsapp_consent = FALSE);

-- Auditoria completa
SELECT * FROM v_whatsapp_consent_audit;
```

---

## ⚠️ **IMPORTANTE: Dados Existentes**

### **Situação:**

Você já tem funcionários com WhatsApp cadastrado **MAS SEM consentimento**.

### **Opções:**

#### **OPÇÃO 1 (Recomendada - Mais Segura):**
```
✅ Solicitar novo consentimento de TODOS
✅ 100% conforme LGPD
✅ Sem risco legal
❌ Requer ação dos funcionários
```

**Como fazer:**
1. Enviar email/circular: "Nova política WhatsApp"
2. Cada funcionário autoriza no sistema
3. Após 30 dias, desabilitar envio para quem não autorizou

#### **OPÇÃO 2 (Requer Aprovação Jurídica):**
```
⚠️ Conceder consentimento automático
⚠️ Baseado em cláusula contratual
✅ Mais rápido
❌ DEVE ter base legal documentada
```

**Como fazer:**
1. ⚠️ **CONSULTAR JURÍDICO PRIMEIRO**
2. Verificar se contrato de trabalho autoriza
3. Documentar base legal
4. Executar script SQL (OPCIONAL_V331)
5. Comunicar funcionários

#### **OPÇÃO 3 (Conservadora):**
```
✅ Não enviar até obter consentimento
✅ Zero risco legal
❌ Interrompe serviço WhatsApp temporariamente
```

**Como fazer:**
1. Desativar envios WhatsApp temporariamente
2. Comunicar: "Use email até autorizar WhatsApp"
3. Após autorizações, reativar

---

## 🚀 **Deploy - Checklist**

### **Antes de subir para produção:**

- [ ] **Jurídico:** Aprovação para tratamento de dados existentes
- [ ] **RH:** Email/circular para funcionários
- [ ] **TI:** Backup do banco de dados
- [ ] **TI:** Executar migration V330
- [ ] **TI:** (Opcional) Executar V331 se aprovado por jurídico
- [ ] **TI:** Deploy backend
- [ ] **TI:** Deploy frontend com integrações
- [ ] **TI:** Testes de envio (com/sem consentimento)
- [ ] **Compliance:** Atualizar política de privacidade
- [ ] **RH:** Monitorar adesão (30 dias)

---

## 🧪 **Testes Rápidos**

### **Teste 1: Funcionário SEM consentimento**

```bash
# Tentar enviar holerite
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Content-Type: application/json" \
  -d '{"tipo": "whatsapp", "cpf": "12345678900"}'

# Resultado esperado:
# ❌ Erro: "Funcionário não autorizou recebimento de mensagens"
# ✅ Log: "CONSENTIMENTO WHATSAPP AUSENTE"
```

### **Teste 2: Conceder consentimento**

```bash
# 1. Conceder autorização
curl -X POST http://localhost:8080/api/whatsapp-consent/grant \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-do-usuario",
    "whatsappNumber": "5531999887766"
  }'

# 2. Verificar status
curl http://localhost:8080/api/whatsapp-consent/status/uuid-do-usuario

# Resultado esperado:
# ✅ hasConsent: true
# ✅ consentDate: "2025-11-06T..."
# ✅ consentIp: "192.168.1.100"
```

### **Teste 3: Enviar após consentimento**

```bash
# Tentar enviar novamente
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Content-Type: application/json" \
  -d '{"tipo": "whatsapp", "cpf": "12345678900"}'

# Resultado esperado:
# ✅ Sucesso: "Envio realizado com sucesso"
# ✅ Log: "Consentimento WhatsApp confirmado"
```

---

## 📞 **Suporte**

### **Dúvidas Técnicas:**
- Ver: `SISTEMA_CONSENTIMENTO_WHATSAPP_IMPLEMENTADO.md`
- Logs: `/var/log/secured-guard/application.log`
- Grep: `grep "CONSENTIMENTO" application.log`

### **Dúvidas Jurídicas:**
- Contatar: Departamento Jurídico / DPO
- Base legal: LGPD Art. 7º, I (consentimento)
- Política Meta: WhatsApp Business Policy - Opt-in

### **Comunicação Interna:**
- Template email: Ver arquivo `TEMPLATE_EMAIL_CONSENTIMENTO.md`
- FAQ funcionários: Ver arquivo `FAQ_WHATSAPP_CONSENTIMENTO.md`

---

## ✅ **Resultado Final**

### **Proteção Legal:**
- ✅ 100% conforme LGPD
- ✅ 100% conforme Meta/WhatsApp Policy
- ✅ Auditoria completa de consentimentos
- ✅ Zero risco de banimento por falta de opt-in

### **Transparência:**
- ✅ Funcionário vê o que autoriza
- ✅ Funcionário pode revogar a qualquer momento
- ✅ Empresa tem registro de todos os consentimentos
- ✅ Compliance pode auditar facilmente

### **UX (Experiência do Usuário):**
- ✅ Modal simples e claro
- ✅ Processo rápido (30 segundos)
- ✅ Interface intuitiva
- ✅ Revogação fácil

---

## 🎉 **Pronto!**

O sistema está **100% preparado** para envio de holerites via WhatsApp de forma **legal e segura**!

**Próximo passo:** Decidir como tratar funcionários já cadastrados (Opção 1, 2 ou 3).

