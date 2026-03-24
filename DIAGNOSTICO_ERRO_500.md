# 🔍 DIAGNÓSTICO ERRO 500 - Cadastro de Funcionário

## 📅 Data: 17/10/2025

---

## ❌ **ERRO PERSISTENTE**

Você ainda está recebendo erro 500 mesmo após:
- ✅ Tornar `user` e `position` opcionais
- ✅ Remover campos problemáticos
- ✅ Validar estrutura do JSON

---

## 🎯 **POSSÍVEIS CAUSAS**

### **1. EMAIL JÁ CADASTRADO** (Mais Provável) ⚠️

```json
"email": "maria.santos@empresa.com.br"
```

O código tem esta validação:
```java
if (employeeRepository.existsByEmail(dto.getEmail())) {
    throw new RuntimeException("Email já cadastrado");
}
```

**Se você já tentou cadastrar antes**, este email pode já existir no banco!

### **2. CPF JÁ CADASTRADO** ⚠️

```json
"cpf": "987.654.321-00"
```

O código também valida:
```java
if (dto.getCpf() != null && employeeRepository.existsByDocument(dto.getCpf())) {
    throw new RuntimeException("CPF já cadastrado para outro funcionário");
}
```

### **3. IDs NÃO EXISTEM NO BANCO** ⚠️

Mesmo sendo opcionais, se você enviar IDs inválidos, pode dar erro:
```json
"position": { "id": "00000000-0000-0000-0000-000000000006" }
"unit": { "id": "00000000-0000-0000-0000-000000000005" }
```

---

## ✅ **SOLUÇÃO: TESTE POR ETAPAS**

### **ETAPA 1: Teste Mínimo (4 campos)**

```json
{
  "name": "TESTE MARIA",
  "cpf": "111.222.333-44",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Teste 123"
  }
}
```

**Objetivo**: Verificar se o básico funciona.

### **ETAPA 2: Adicione Email Único**

Se ETAPA 1 funcionou, adicione:
```json
{
  "name": "TESTE MARIA",
  "cpf": "111.222.333-44",
  "email": "teste.unico.12345@example.com",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Teste 123"
  }
}
```

### **ETAPA 3: Adicione Mais Campos**

Se ETAPA 2 funcionou, vá adicionando gradualmente:
```json
{
  "name": "MARIA JOSÉ SANTOS OLIVEIRA",
  "cpf": "111.222.333-44",
  "rg": "SP9876543",
  "email": "teste.unico.12345@example.com",
  "phone": "(11) 98765-4321",
  "birthDate": "1985-03-15",
  "gender": "F",
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

## 🔍 **VERIFICAR SE JÁ EXISTE**

### **Comando 1: Listar TODOS os funcionários**

```http
GET http://localhost:8081/api/employees
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

Procure na lista por:
- Email: `maria.santos@empresa.com.br`
- CPF: `987.654.321-00`

### **Comando 2: Verificar por Email**

Se houver endpoint de busca por email:
```http
GET http://localhost:8081/api/employees?email=maria.santos@empresa.com.br
```

---

## 🛠️ **SOLUÇÃO DEFINITIVA**

### **Use estes valores únicos:**

```json
{
  "name": "MARIA JOSÉ SANTOS OLIVEIRA",
  "cpf": "999.888.777-66",
  "rg": "SP9876543",
  "email": "maria.oliveira.2024@empresa.com.br",
  "phone": "(11) 98765-4321",
  "birthDate": "1985-03-15",
  "gender": "F",
  "maritalStatus": "SOLTEIRA",
  "registrationNumber": "EMP-2024-128",
  "hireDate": "2024-02-01",
  "status": "ACTIVE",
  "notes": "Funcionária contratada para área administrativa",
  "address": {
    "street": "Avenida Paulista",
    "number": "1000",
    "complement": "Conjunto 45",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "cnhNumber": "98765432100",
  "cnhCategory": "AB",
  "cnhExpirationDate": "2027-05-20",
  "ctps": "987654",
  "ctpsSeries": "0002",
  "ctpsIssueDate": "2022-06-15",
  "ctpsIssuingAgency": "SP",
  "carteiraIdentidadeOrgaoEmissor": "SSP-SP",
  "carteiraIdentidadeDataEmissao": "2015-08-10",
  "tituloEleitorZona": "002",
  "tituloEleitorSecao": "0002",
  "nomePai": "João Santos Oliveira",
  "nomeMae": "Ana Maria Santos",
  "localNascimento": "São Paulo - SP",
  "grauInstrucao": "SUPERIOR_COMPLETO",
  "cbo": "4110-10",
  "pis": "98765432100",
  "salario": 3500.00,
  "salarioPorExtenso": "Três mil e quinhentos reais",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "09:00 às 18:00",
  "folgaSemanal": "SÁBADO",
  "fgtsOptante": true,
  "fgtsDataOpcao": "2024-02-01",
  "fgtsBancoDepositario": "Banco do Brasil",
  "pisDataCadastro": "2019-03-20",
  "pisBancoDepositario": "Itaú Unibanco",
  "pisEnderecoBanco": "Av. Paulista, 1000",
  "pisCodigoBanco": "341",
  "pisCodigoAgencia": "5678",
  "empresaNome": "Promover Vigilância Patrimonial Ltda",
  "empresaEndereco": "Rua Coronel João Camargos, nº 267 - Centro - Contagem - MG",
  "empresaCnpj": "43.576.260/0001-12"
}
```

**Mudanças:**
- ✅ CPF: `987.654.321-00` → `999.888.777-66`
- ✅ Email: `maria.santos@empresa.com.br` → `maria.oliveira.2024@empresa.com.br`
- ✅ RegistrationNumber: `000128` → `EMP-2024-128`
- ✅ Removidos todos os IDs relacionais

---

## 📋 **CHECKLIST**

Antes de tentar cadastrar novamente:

- [ ] Executou `GET /api/employees` para ver se o funcionário já existe?
- [ ] Mudou o CPF para um valor único?
- [ ] Mudou o email para um valor único?
- [ ] Removeu os campos `user`, `position`, `unit`, `company`?
- [ ] O backend está rodando? (verificar na porta 8081)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Execute** `GET /api/employees` para listar funcionários existentes
2. **Use** o JSON com valores únicos (CPF e email diferentes)
3. **Remova** os IDs relacionais
4. **Teste** novamente

**Se ainda der erro 500, precisamos ver os logs do backend! 📋**
