# 🔧 Corrigir Número de WhatsApp - URGENTE

## ❌ **PROBLEMA:**

O número de WhatsApp no banco tem **10 dígitos**, mas precisa ter **11 ou 13 dígitos**.

```
Atual: 3197142309 (10 dígitos) ❌
Correto: 31971423309 (11 dígitos) ✅
Ou: 5531971423309 (13 dígitos com DDI) ✅
```

---

## ✅ **SOLUÇÃO RÁPIDA - EXECUTE AGORA:**

### **Opção 1: SQL Direto (RECOMENDADO)**

Abra o **DBeaver** ou conecte ao PostgreSQL:

```sql
-- Atualizar SEU número (ajuste conforme necessário)
UPDATE users 
SET whatsapp = '31971423309'  -- ← COLOQUE O NÚMERO CORRETO (11 dígitos)
WHERE cpf = '00824310608';

-- Verificar
SELECT name, cpf, whatsapp 
FROM users 
WHERE cpf = '00824310608';
```

### **Opção 2: PowerShell (Automático)**

```powershell
# Conectar ao banco via Docker
docker exec -it secured-guard-db-local psql -U postgres -d secured_guard -c "UPDATE users SET whatsapp = '31971423309' WHERE cpf = '00824310608';"

# Verificar
docker exec -it secured-guard-db-local psql -U postgres -d secured_guard -c "SELECT name, cpf, whatsapp FROM users WHERE cpf = '00824310608';"
```

---

## 📋 **Formato Correto do Número:**

### **Celular Brasileiro:**

| Formato | Dígitos | Exemplo | Válido? |
|---------|---------|---------|---------|
| DDD + 8 dígitos | 10 | 3197142309 | ❌ Antigo |
| DDD + 9 dígitos | 11 | 31971423309 | ✅ Atual |
| DDI + DDD + 9 | 13 | 5531971423309 | ✅ Internacional |

### **Seu Caso:**

```
Atual: 3197142309 (10 dígitos)
         ^^^^^^^^^^
         31 9714 2309

Correto: 31 9 7142 3309 (11 dígitos)
          ^^ ^ ^^^^ ^^^^
          DDD 9 número
```

**Falta o "9" entre o DDD e o número!**

---

## 🎯 **QUAL É O SEU NÚMERO CORRETO?**

Escolha um:

**A)** `31971423309` (11 dígitos - sem DDI)  
**B)** `5531971423309` (13 dígitos - com DDI 55)  
**C)** Outro formato

---

## 🔨 **Script SQL Automático:**

Se você tem **vários usuários** com o mesmo problema:

```sql
-- Adicionar o "9" automaticamente para números com 10 dígitos
UPDATE users 
SET whatsapp = CONCAT(
    SUBSTRING(whatsapp, 1, 2),  -- DDD (31)
    '9',                         -- Adicionar 9
    SUBSTRING(whatsapp, 3)       -- Resto (71423309)
)
WHERE whatsapp IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(whatsapp, '[^0-9]', '', 'g')) = 10
  AND whatsapp ~ '^[0-9]{10}$';

-- Depois, adicionar DDI 55 para todos com 11 dígitos
UPDATE users 
SET whatsapp = '55' || whatsapp
WHERE whatsapp IS NOT NULL
  AND LENGTH(REGEXP_REPLACE(whatsapp, '[^0-9]', '', 'g')) = 11
  AND NOT whatsapp LIKE '55%';
```

---

## ✅ **APÓS CORRIGIR:**

Tente novamente no frontend. A mensagem deve ser enviada com sucesso!

---

## 💡 **TESTE MANUAL:**

```powershell
# Teste com número corrigido
$body = @{
    id = "5531971423309"  # ← Número correto com DDI
    message = "🎉 Teste do Secured Guard!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/message/text" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

**Me diga qual é o número correto e eu atualizo no banco para você!** 📱

