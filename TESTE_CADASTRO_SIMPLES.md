# 🧪 TESTE DE CADASTRO SIMPLIFICADO

## 📅 Data: 17/10/2025

---

## ❌ **ERRO IDENTIFICADO**

Você está recebendo erro **500** ao tentar cadastrar. Os possíveis problemas são:

### **1. IDs Não Existem no Banco**
```json
"user": { "id": "face6ab3-f2c8-4714-aa34-8d4247b6b0b7" }
"position": { "id": "00000000-0000-0000-0000-000000000006" }
```

Esses IDs podem não existir no banco de dados.

### **2. Email Já Cadastrado**
```json
"email": "maria.santos@empresa.com.br"
```

Se este email já foi cadastrado antes, o sistema retorna erro.

### **3. CPF Já Cadastrado**
```json
"cpf": "987.654.321-00"
```

Se este CPF já foi cadastrado, o sistema retorna erro.

---

## ✅ **PASSO A PASSO PARA RESOLVER**

### **PASSO 1: Verificar se os IDs existem**

#### **1.1 Verificar User ID:**
```http
GET http://localhost:8081/api/users
Authorization: Bearer [SEU_TOKEN]
```

**Procure por um usuário existente e copie o ID real.**

#### **1.2 Verificar Position ID:**
```http
GET http://localhost:8081/api/positions
Authorization: Bearer [SEU_TOKEN]
```

**Procure por um cargo existente e copie o ID real.**

#### **1.3 Verificar Unit ID (opcional):**
```http
GET http://localhost:8081/api/units
Authorization: Bearer [SEU_TOKEN]
```

#### **1.4 Verificar Company ID (opcional):**
```http
GET http://localhost:8081/api/companies
Authorization: Bearer [SEU_TOKEN]
```

---

### **PASSO 2: Usar um JSON simplificado para teste**

Use **APENAS os campos obrigatórios** primeiro:

```json
{
  "name": "MARIA TESTE OLIVEIRA",
  "cpf": "111.222.333-44",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Teste"
  },
  "user": {
    "id": "COLE_ID_REAL_AQUI"
  },
  "position": {
    "id": "COLE_ID_REAL_AQUI"
  }
}
```

**⚠️ IMPORTANTE:**
- Use um **CPF diferente** (111.222.333-44)
- Use um **email diferente** ou omita o email
- Cole os **IDs reais** que você obteve nos endpoints acima

---

### **PASSO 3: Verificar se email ou CPF já existem**

Se o erro persistir, verifique se já existe um funcionário com esse email ou CPF:

```http
GET http://localhost:8081/api/employees
Authorization: Bearer [SEU_TOKEN]
```

Procure na lista por:
- Email: `maria.santos@empresa.com.br`
- CPF: `987.654.321-00`

Se encontrar, significa que o funcionário **já está cadastrado** e você precisa:
- Usar um CPF e email diferentes, OU
- Fazer um UPDATE ao invés de CREATE

---

## 🔍 **DIAGNÓSTICO DO SEU JSON ATUAL**

Analisando seu JSON:

| Campo | Valor | Status |
|-------|-------|--------|
| `user.id` | `face6ab3-f2c8-4714-aa34-8d4247b6b0b7` | ⚠️ Verificar se existe |
| `position.id` | `00000000-0000-0000-0000-000000000006` | ⚠️ Parece um ID de teste/seed |
| `unit.id` | `00000000-0000-0000-0000-000000000005` | ⚠️ Parece um ID de teste/seed |
| `company.id` | `7e6dd8e2-aa31-4a6a-948e-6a4ee69f261e` | ⚠️ Verificar se existe |
| `cpf` | `987.654.321-00` | ⚠️ Pode já estar cadastrado |
| `email` | `maria.santos@empresa.com.br` | ⚠️ Pode já estar cadastrado |

---

## 🛠️ **COMANDOS PARA DIAGNÓSTICO NO POSTMAN**

### **1. Listar Usuários:**
```
GET http://localhost:8081/api/users
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **2. Listar Cargos:**
```
GET http://localhost:8081/api/positions
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **3. Listar Empresas:**
```
GET http://localhost:8081/api/companies
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **4. Verificar Funcionários Existentes:**
```
GET http://localhost:8081/api/employees
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

---

## 📝 **PRÓXIMOS PASSOS**

1. ✅ Execute os 4 comandos GET acima no Postman
2. ✅ Copie os IDs reais que aparecerem nas respostas
3. ✅ Use esses IDs reais no JSON
4. ✅ Mude o CPF e email para valores únicos
5. ✅ Tente cadastrar novamente

---

## ⚠️ **PROVÁVEL CAUSA DO ERRO 500**

O erro 500 provavelmente está acontecendo porque:

1. **IDs não existem:** Os IDs `00000000-0000-0000-0000-000000000006` podem não existir no banco
2. **Email/CPF duplicados:** O email `maria.santos@empresa.com.br` ou CPF `987.654.321-00` já podem estar cadastrados
3. **Validação falhou:** Algum campo está causando erro de validação no backend

**Execute os comandos GET acima para obter os IDs corretos e tente novamente! 🚀**
