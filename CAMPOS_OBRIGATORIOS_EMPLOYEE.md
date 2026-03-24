# ⚠️ CAMPOS OBRIGATÓRIOS PARA CADASTRO DE FUNCIONÁRIO

## 📅 Data: 17/10/2025

---

## 🔴 **CAMPOS OBRIGATÓRIOS (6 campos)**

De acordo com a validação do backend (`EmployeeService.java`), os campos **OBRIGATÓRIOS** são:

### **1. `name`** - Nome Completo
```json
"name": "JOSE DA SILVA"
```
- **Tipo**: String
- **Obrigatório**: ✅ SIM
- **Validação**: Deve estar preenchido

---

### **2. `cpf`** - CPF do Funcionário
```json
"cpf": "123.456.789-00"
```
- **Tipo**: String
- **Obrigatório**: ✅ SIM
- **Validação**: 
  - Deve ser único no sistema
  - Pode incluir formatação (123.456.789-00) ou não (12345678900)

---

### **3. `status`** - Status do Funcionário
```json
"status": "ACTIVE"
```
- **Tipo**: String (Enum)
- **Obrigatório**: ✅ SIM
- **Valores Válidos**:
  - `ACTIVE` - Ativo
  - `INACTIVE` - Inativo
  - `SUSPENDED` - Suspenso
  - `TERMINATED` - Demitido
  - `ON_VACATION` - Em Férias
  - `ON_LEAVE` - Em Licença

---

### **4. `address.street`** - Rua/Endereço
```json
"address": {
  "street": "Rua das Flores"
}
```
- **Tipo**: String (dentro do objeto `address`)
- **Obrigatório**: ✅ SIM
- **Validação**: Não pode ser null, vazio ou em branco
- **⚠️ ATENÇÃO**: Este foi o erro que você teve! O campo `address.street` **NÃO PODE SER VAZIO**

---

### **5. `user.id`** - ID do Usuário do Sistema
```json
"user": {
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Tipo**: UUID (String)
- **Obrigatório**: ✅ SIM
- **Validação**: 
  - Deve ser um UUID válido
  - O usuário deve existir no banco de dados
- **⚠️ ATENÇÃO**: Este campo vincula o funcionário a um usuário do sistema

---

### **6. `position.id`** - ID do Cargo
```json
"position": {
  "id": "123e4567-e89b-12d3-a456-426614174001"
}
```
- **Tipo**: UUID (String)
- **Obrigatório**: ✅ SIM
- **Validação**: 
  - Deve ser um UUID válido
  - O cargo deve existir no banco de dados

---

## 🟡 **CAMPOS IMPORTANTES (Recomendados)**

Embora não sejam tecnicamente obrigatórios, estes campos são **altamente recomendados**:

### **7. `email`** - E-mail
```json
"email": "jose.silva@example.com"
```
- **Tipo**: String
- **Validação**: Deve ser único se preenchido

### **8. `registrationNumber`** - Matrícula
```json
"registrationNumber": "000127"
```
- **Tipo**: String
- **Recomendado**: Para identificação do funcionário

### **9. `hireDate`** - Data de Admissão
```json
"hireDate": "2024-01-10"
```
- **Tipo**: Data (formato: yyyy-MM-dd)
- **Recomendado**: Para controle trabalhista

### **10. `birthDate`** - Data de Nascimento
```json
"birthDate": "1978-04-09"
```
- **Tipo**: Data (formato: yyyy-MM-dd)
- **Recomendado**: Para documentação

---

## ⚠️ **CAMPOS QUE NÃO DEVEM SER ENVIADOS**

Estes campos estão **COMENTADOS** no DTO e **NÃO DEVEM** ser incluídos no JSON:

### ❌ **NÃO ENVIE ESTES CAMPOS:**

```json
// ❌ NÃO ENVIE:
"pis": "12345678901",           // Campo comentado no DTO (linha 61)
"tituloEleitor": "123456",      // Campo comentado no DTO (linha 46)
```

Se você enviar estes campos, receberá o erro:
```
Unrecognized field "pis" (class com.z7design.secured_guard.dto.EmployeeDTO), not marked as ignorable
```

---

## 📋 **JSON MÍNIMO PARA CADASTRO**

Este é o JSON **MÍNIMO** que funciona:

```json
{
  "name": "JOSE DA SILVA",
  "cpf": "123.456.789-00",
  "status": "ACTIVE",
  "address": {
    "street": "Rua das Flores"
  },
  "user": {
    "id": "COLE_AQUI_O_ID_DO_USUARIO"
  },
  "position": {
    "id": "COLE_AQUI_O_ID_DO_CARGO"
  }
}
```

---

## 🔧 **COMO OBTER OS IDs NECESSÁRIOS**

### **Obter ID de Usuário (`user.id`):**

```http
GET http://localhost:8081/api/users
Authorization: Bearer [SEU_TOKEN]
```

Resposta:
```json
[
  {
    "id": "face6ab3-f2c8-4714-aa34-8d4247b6b0b7",
    "username": "jose.ramos",
    "name": "José Ramos"
  }
]
```

### **Obter ID de Cargo (`position.id`):**

```http
GET http://localhost:8081/api/positions
Authorization: Bearer [SEU_TOKEN]
```

Resposta:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Vigilante",
    "description": "Vigilante patrimonial"
  }
]
```

---

## ✅ **RESUMO RÁPIDO**

| Campo | Obrigatório | Tipo | Exemplo |
|-------|-------------|------|---------|
| `name` | ✅ SIM | String | "JOSE DA SILVA" |
| `cpf` | ✅ SIM | String | "123.456.789-00" |
| `status` | ✅ SIM | Enum | "ACTIVE" |
| `address.street` | ✅ SIM | String | "Rua das Flores" |
| `user.id` | ✅ SIM | UUID | "face6ab3-..." |
| `position.id` | ✅ SIM | UUID | "123e4567-..." |
| `email` | 🟡 Recomendado | String | "jose@example.com" |
| `registrationNumber` | 🟡 Recomendado | String | "000127" |
| `hireDate` | 🟡 Recomendado | Date | "2024-01-10" |
| `birthDate` | 🟡 Recomendado | Date | "1978-04-09" |

---

## 🚨 **ERROS COMUNS**

### **Erro 1: Campo `pis` não reconhecido**
```json
{
  "error": "Unrecognized field \"pis\""
}
```
**Solução**: **REMOVA** o campo `pis` do JSON. Ele está comentado no DTO.

### **Erro 2: Campo `address.street` vazio**
```json
{
  "error": "O campo address.street é obrigatório e não pode ser vazio."
}
```
**Solução**: Preencha `address.street` com um valor válido (não vazio).

### **Erro 3: Campo `user.id` obrigatório**
```json
{
  "error": "O campo user.id é obrigatório."
}
```
**Solução**: Consulte `/api/users` para obter um ID válido e preencha `user.id`.

### **Erro 4: Campo `position.id` obrigatório**
```json
{
  "error": "O campo position.id é obrigatório."
}
```
**Solução**: Consulte `/api/positions` para obter um ID válido e preencha `position.id`.

---

## 📁 **ARQUIVOS CRIADOS**

1. **`POSTMAN_EMPLOYEE_MINIMO_OBRIGATORIO.json`** - JSON com apenas os 6 campos obrigatórios
2. **`POSTMAN_EMPLOYEE_SEM_CAMPOS_COMENTADOS.json`** - JSON completo SEM os campos comentados (pis, tituloEleitor)
3. **`CAMPOS_OBRIGATORIOS_EMPLOYEE.md`** - Este guia

---

**✅ Use o arquivo `POSTMAN_EMPLOYEE_SEM_CAMPOS_COMENTADOS.json` para cadastrar funcionários com TODOS os dados disponíveis, mas sem os campos que causam erro!**
