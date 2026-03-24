# 🚨 INSTRUÇÕES FINAIS - Adicionar company_id

## 📅 Data: 17/10/2025

---

## ❌ **ERRO PERSISTENTE**

```
ERRO: coluna "company_id" da relação "employees" não existe
Posição: 238
```

---

## ✅ **SOLUÇÃO FINAL**

### **Execute o arquivo: `ADICIONAR_TUDO_FALTANTE.sql`**

Este arquivo adiciona:
1. ✅ `company_id` (UUID) - **FALTANDO**
2. ✅ Foreign key para `companies`
3. ✅ Índice para performance
4. ✅ Verifica outras colunas (`cnh_category`, `cnh_expiration_date`, `gender`, `rg`)

---

## 📋 **COMO EXECUTAR NO DBEAVER**

### **1. Abra o DBeaver**

### **2. Conecte no banco**
- Database: `secured_guard_test`
- Port: `5432`
- User: `postgres`

### **3. Execute o SQL**
- `File` → `Open File`
- Selecione: `ADICIONAR_TUDO_FALTANTE.sql`
- Clique em **"Execute SQL Script"** (Ctrl + X)

### **4. Verifique o resultado**

Deve retornar **5 linhas**:
```
cnh_category        | character varying | YES
cnh_expiration_date | date             | YES
company_id          | uuid             | YES
gender              | character varying | YES
rg                  | character varying | YES
```

---

## 🚀 **APÓS EXECUTAR**

### **1. Pare o backend**
```powershell
# Encontrar PID
netstat -ano | findstr :8081

# Parar (substitua XXXX pelo PID)
taskkill /F /PID XXXX
```

### **2. Reinicie o backend**
```powershell
java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
```

### **3. Aguarde 30 segundos**

### **4. Teste no Postman**

Use o JSON **SEM** company (para evitar problemas com IDs):

```json
{
  "name": "MARIA JOSÉ SANTOS OLIVEIRA",
  "cpf": "987.654.321-00",
  "rg": "SP9876543",
  "email": "maria.santos@empresa.com.br",
  "phone": "(11) 98765-4321",
  "birthDate": "1985-03-15",
  "gender": "F",
  "maritalStatus": "SOLTEIRA",
  "registrationNumber": "000128",
  "hireDate": "2024-02-01",
  "status": "ACTIVE",
  "address": {
    "street": "Avenida Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

---

## ✅ **AGORA VAI FUNCIONAR!**

Após executar este SQL e reiniciar:
- ✅ Todas as colunas estarão no banco
- ✅ O cadastro funcionará
- ✅ Você poderá cadastrar funcionários completos

**Execute o SQL `ADICIONAR_TUDO_FALTANTE.sql` no DBeaver agora! 🚀**
