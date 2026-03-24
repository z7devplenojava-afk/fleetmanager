# 📱 Mensagens WhatsApp - Padrão de Encoding

## 🎯 **Regra Geral**

**TODAS as mensagens WhatsApp devem EVITAR acentos e caracteres especiais para garantir compatibilidade.**

---

## ✅ **Mensagens Corrigidas**

### **1. Código 2FA - Ativação**

**Arquivo:** `FirstAccessController.java`

```java
String message = String.format(
    "*SecuredGuard - Codigo de Ativacao*\n\n" +
    "Seu codigo de verificacao e: *%s*\n\n" +
    "Este codigo expira em 5 minutos.\n" +
    "Se voce nao solicitou este codigo, ignore esta mensagem.",
    codigo
);
```

**Exemplo Real:**
```
*SecuredGuard - Codigo de Ativacao*

Seu codigo de verificacao e: *778013*

Este codigo expira em 5 minutos.
Se voce nao solicitou este codigo, ignore esta mensagem.
```

---

### **2. Teste de WhatsApp**

**Arquivo:** `CommunicationTestController.java`

```java
String testMessage = String.format(
    "*Teste do Sistema SecuredGuard*\n\n" +
    "Esta e uma mensagem de teste.\n\n" +
    "Data/Hora: %s\n\n" +
    "Se voce recebeu esta mensagem, o sistema de WhatsApp esta funcionando corretamente!",
    timestamp
);
```

---

### **3. Holerite via WhatsApp**

**Arquivo:** `EnvioService.java`

```java
// Mensagem simples sem acentos
String mensagem = "Seu holerite do mes " + mes + "/" + ano + " esta disponivel.";
```

---

## 📋 **Tabela de Substituições**

| Caractere | Substituir Por |
|-----------|----------------|
| `ã` | `a` |
| `á` | `a` |
| `à` | `a` |
| `â` | `a` |
| `é` | `e` |
| `ê` | `e` |
| `í` | `i` |
| `ó` | `o` |
| `ô` | `o` |
| `õ` | `o` |
| `ú` | `u` |
| `ç` | `c` |
| `ü` | `u` |
| `🔐` | Remover (emoji) |
| `✅` | Remover (emoji) |
| `❌` | Remover (emoji) |

---

## 🔧 **Implementação no Código**

### **Opção 1: Remover Acentos Manualmente** ✅ (Implementado)

```java
// Texto sem acentos
String message = "Codigo de verificacao e: " + code;
```

### **Opção 2: Utilitário de Remoção de Acentos** (Opcional)

```java
public class StringUtil {
    public static String removeAccents(String text) {
        if (text == null) return null;
        
        return java.text.Normalizer
            .normalize(text, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace("ç", "c")
            .replace("Ç", "C");
    }
}

// Uso:
String message = StringUtil.removeAccents("Código de verificação é: " + code);
// Resultado: "Codigo de verificacao e: 778013"
```

### **Opção 3: URL Encoding** ✅ (Implementado)

```java
// URL encode preserva caracteres especiais
String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
String body = "id=" + phone + "&message=" + encodedMessage;
```

---

## 🧪 **Teste de Encoding**

### **Antes da Correção:**

```
Enviado: "Código de Ativação"
Recebido: "C?digo de Ativa??o" ❌
```

### **Depois da Correção (Opção 1):**

```
Enviado: "Codigo de Ativacao"
Recebido: "Codigo de Ativacao" ✅
```

### **Depois da Correção (Opção 2 + URL Encoding):**

```
Enviado: "C%C3%B3digo%20de%20Ativa%C3%A7%C3%A3o"
Recebido: "Código de Ativação" ✅ (se Baileys suportar)
```

---

## 📝 **Template de Mensagens**

### **Código 2FA:**

```
*SecuredGuard - Codigo de Ativacao*

Seu codigo de verificacao e: *XXXXXX*

Este codigo expira em 5 minutos.
Se voce nao solicitou este codigo, ignore esta mensagem.
```

### **Holerite Disponível:**

```
*SecuredGuard - Holerite Disponivel*

Ola, seu holerite de MM/AAAA esta disponivel.

Acesse o sistema para visualizar e baixar.

SecuredGuard - Sistema de Gestao
```

### **Notificação Geral:**

```
*SecuredGuard - Notificacao*

[TITULO DA NOTIFICACAO]

[MENSAGEM]

Data: DD/MM/AAAA HH:MM
```

---

## ⚠️ **Importante: Emojis**

### **Evitar Emojis em Mensagens Críticas:**

```
❌ EVITAR:
🔐 Código
✅ Sucesso
❌ Erro
📱 WhatsApp

✅ USAR:
* Codigo *
[ OK ]
[ ERRO ]
WhatsApp
```

**Por quê?**
- Emojis podem não ser suportados
- Podem causar problemas de encoding
- Podem não aparecer em todos os dispositivos

---

## 🔒 **Segurança e Encoding**

### **Headers HTTP:**

```java
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
headers.set("Accept-Charset", "UTF-8");
headers.set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
```

### **URL Encoding:**

```java
String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF-8);
// "Código" → "C%C3%B3digo"
```

### **Logs de Debug:**

```java
logger.debug("📝 Mensagem original: {}", message);
logger.debug("📝 Mensagem encoded: {}", encodedMessage);
logger.debug("📝 Número normalizado: {}", normalizedNumber);
```

---

## 📊 **Comparação**

| Método | Compatibilidade | Legibilidade | Recomendado |
|--------|-----------------|--------------|-------------|
| **Sem Acentos** | ✅ 100% | ⚠️ Média | ✅ **SIM** |
| **Com URL Encoding** | ⚠️ Depende API | ✅ Alta | ⚠️ Testar |
| **UTF-8 Puro** | ❌ Baixa | ✅ Alta | ❌ NÃO |

---

## ✅ **Checklist de Mensagens**

- [x] Código 2FA - Ativação (FirstAccessController)
- [x] Teste WhatsApp (CommunicationTestController)
- [ ] Envio de Holerite (EnvioService) - Verificar
- [ ] Notificações gerais - Verificar
- [ ] Mensagens de alerta - Verificar

---

## 🚀 **Resultado Esperado**

**Mensagem enviada:**
```
*SecuredGuard - Codigo de Ativacao*

Seu codigo de verificacao e: *778013*

Este codigo expira em 5 minutos.
Se voce nao solicitou este codigo, ignore esta mensagem.
```

**WhatsApp exibe:**
```
SecuredGuard - Codigo de Ativacao (em negrito)

Seu codigo de verificacao e: 778013 (em negrito)

Este codigo expira em 5 minutos.
Se voce nao solicitou este codigo, ignore esta mensagem.
```

✅ **SEM caracteres quebrados!**

---

**ENCODING WHATSAPP CORRIGIDO!** ✅📱🔧

