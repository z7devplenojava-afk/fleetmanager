# 🚨 INSTRUÇÕES - Executar SQL no DBeaver

## 📅 Data: 17/10/2025

---

## 🎯 **OBJETIVO**

Adicionar 50 colunas faltantes na tabela `employees` do banco de dados.

---

## 📋 **PASSO A PASSO NO DBEAVER**

### **1. Abra o DBeaver**

### **2. Conecte no Banco**
- **Database**: `secured_guard_test`
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres` (ou a senha que você usa)

### **3. Abra o arquivo SQL**
- Vá em: `File` → `Open File`
- Selecione: `adicionar_colunas_employees.sql`

### **4. Execute o Script**
- Clique no botão **"Execute SQL Script"** (ícone de play laranja)
- OU pressione `Ctrl + X`

### **5. Verifique se funcionou**

Execute esta query:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('cnh_category', 'pis', 'salario', 'gender', 'rg')
ORDER BY column_name;
```

Deve retornar 5 linhas.

---

## ✅ **APÓS EXECUTAR O SQL**

### **1. Reinicie o Backend**

```powershell
java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
```

### **2. Aguarde 30 segundos**

### **3. Teste no Postman**

```http
POST http://localhost:8081/api/employees
Authorization: Bearer [SEU_TOKEN]
Content-Type: application/json

{
  "name": "MARIA JOSÉ SANTOS OLIVEIRA",
  "cpf": "987.654.321-00",
  "status": "ACTIVE",
  "address": {
    "street": "Avenida Paulista"
  }
}
```

---

## 📁 **ARQUIVO A EXECUTAR**

**`adicionar_colunas_employees.sql`**

Este script:
- ✅ Adiciona 50 colunas faltantes
- ✅ Usa `ADD COLUMN IF NOT EXISTS` (seguro)
- ✅ Registra a migration no Flyway

---

## 🚨 **IMPORTANTE**

**Execute este SQL ANTES de reiniciar o backend!**

Caso contrário, o erro 500 continuará porque o banco não terá as colunas que o código está tentando usar.

---

## ✅ **RESULTADO ESPERADO**

Após executar o SQL e reiniciar:
- ✅ Todas as 50 colunas estarão no banco
- ✅ O cadastro via Postman funcionará
- ✅ Você poderá usar todos os 87 campos do Employee

---

**Execute o SQL no DBeaver agora e me avise quando terminar! 🚀**
