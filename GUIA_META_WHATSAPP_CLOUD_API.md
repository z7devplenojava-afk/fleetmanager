# 🚀 GUIA COMPLETO: META WHATSAPP CLOUD API

## 📋 PASSO 1: CRIAR APP NA META

### 1.1 Acesse o Meta for Developers
```
https://developers.facebook.com/
```

### 1.2 Faça login com sua conta Facebook

### 1.3 Clique em "Meus Aplicativos" → "Criar Aplicativo"

### 1.4 Escolha o tipo:
- Selecione: **"Business"**
- Clique em **"Avançar"**

### 1.5 Preencha os dados:
- **Nome do aplicativo:** SecuredGuard WhatsApp
- **Email de contato:** seu-email@empresa.com
- **Conta de negócios:** Selecione ou crie uma

### 1.6 Clique em **"Criar aplicativo"**

---

## 📱 PASSO 2: ADICIONAR WHATSAPP PRODUCT

### 2.1 No painel do aplicativo:
- Role até encontrar **"WhatsApp"**
- Clique em **"Configurar"**

### 2.2 Aceite os termos e condições

### 2.3 Na seção "WhatsApp" → "Primeiros passos":
- Você verá um **número de teste** já configurado
- Use este número para testes iniciais

---

## 🔑 PASSO 3: OBTER CREDENCIAIS

### 3.1 No menu lateral, clique em:
**"WhatsApp" → "Primeiros passos"**

### 3.2 Você verá 3 informações importantes:

#### ✅ **Phone Number ID** (ID do número de telefone)
```
Exemplo: 123456789012345
```
👉 **COPIE E GUARDE ESTE VALOR!**

#### ✅ **WhatsApp Business Account ID**
```
Exemplo: 987654321098765
```
👉 **COPIE E GUARDE ESTE VALOR!**

#### ✅ **Temporary Access Token** (Token temporário)
```
Exemplo: EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
👉 **COPIE E GUARDE ESTE VALOR!**

⚠️ **IMPORTANTE:** Este token é temporário (24h). Vamos criar um permanente depois.

---

## 🔐 PASSO 4: CRIAR TOKEN PERMANENTE

### 4.1 No menu lateral, clique em:
**"Configurações" → "Básico"**

### 4.2 Role até **"Tokens de acesso do aplicativo"**

### 4.3 Clique em **"Gerar token"**

### 4.4 Selecione as permissões:
- ✅ `whatsapp_business_messaging`
- ✅ `whatsapp_business_management`

### 4.5 Copie o token gerado
```
Exemplo: EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
👉 **GUARDE ESTE TOKEN COM SEGURANÇA!**

---

## 📞 PASSO 5: ADICIONAR NÚMERO DE TESTE

### 5.1 Na seção "Primeiros passos":
- Clique em **"Adicionar destinatário"**

### 5.2 Digite o número de teste (COM CÓDIGO DO PAÍS):
```
Exemplo: +5531971731747
```

### 5.3 Você receberá um código no WhatsApp
- Digite o código para verificar

### 5.4 Agora você pode enviar mensagens de teste para este número!

---

## 🧪 PASSO 6: TESTE RÁPIDO (POSTMAN/CURL)

### 6.1 Use este comando para testar:

```bash
curl -X POST \
  'https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5531971731747",
    "type": "text",
    "text": {
      "body": "Teste da Meta Cloud API!"
    }
  }'
```

### 6.2 Substitua:
- `SEU_PHONE_NUMBER_ID` pelo Phone Number ID
- `SEU_TOKEN` pelo Access Token
- `5531971731747` pelo número que você verificou

### 6.3 Se funcionar, você verá:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [...],
  "messages": [...]
}
```

✅ **SUCESSO! A API está funcionando!**

---

## 📝 PASSO 7: ANOTAR CREDENCIAIS

Preencha abaixo com suas credenciais:

```
WHATSAPP_PHONE_NUMBER_ID=___________________________
WHATSAPP_BUSINESS_ACCOUNT_ID=_____________________
WHATSAPP_ACCESS_TOKEN=____________________________
```

---

## 🔄 PASSO 8: ADICIONAR NÚMERO REAL (PRODUÇÃO)

⚠️ **Só faça isso depois de testar com o número de teste!**

### 8.1 No menu lateral:
**"WhatsApp" → "Números de telefone"**

### 8.2 Clique em **"Adicionar número de telefone"**

### 8.3 Escolha uma opção:
- **Opção A:** Usar um número novo (recomendado)
- **Opção B:** Migrar um número existente

### 8.4 Siga o processo de verificação:
- Você receberá um código via SMS
- Digite o código
- Aguarde aprovação (geralmente imediato)

### 8.5 Após aprovação:
- O novo número aparecerá na lista
- **COPIE O NOVO PHONE_NUMBER_ID**
- Atualize as configurações no backend

---

## 💰 PASSO 9: LIMITES E CUSTOS

### Limites GRATUITOS (sem custo):
- ✅ **1.000 conversas gratuitas por mês**
- ✅ Mensagens ilimitadas dentro dessas conversas
- ✅ Sem prazo de expiração

### Após 1.000 conversas:
- 💵 Custo varia por país
- 💵 Brasil: ~R$ 0,15 por conversa
- 💵 Uma "conversa" = janela de 24h com um contato

### Como acompanhar:
- Dashboard → "WhatsApp" → "Insights"
- Veja conversas consumidas em tempo real

---

## 🔧 PRÓXIMA ETAPA

Após obter as credenciais, volte para o chat e me informe:

```
PHONE_NUMBER_ID: ___________________________
ACCESS_TOKEN: ________________________________
```

Vou configurar o backend automaticamente! 🚀

---

## 📚 DOCUMENTAÇÃO OFICIAL

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Get Started Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Send Messages API](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages)

---

## ❓ PROBLEMAS COMUNS

### "Access token inválido"
→ Gere um novo token permanente no passo 4

### "Phone number not verified"
→ Adicione o número como destinatário de teste (passo 5)

### "Rate limit exceeded"
→ Aguarde alguns minutos e tente novamente

### "Message template required"
→ Para mensagens iniciadas por você (fora da janela de 24h), precisa usar templates aprovados

---

**Continue quando tiver as credenciais! 📱✅**

