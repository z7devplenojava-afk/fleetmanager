# 🔍 TESTE DE IDs RELACIONAIS

## 📅 Data: 17/10/2025

---

## ✅ **FUNCIONÁRIOS EXISTENTES CONFIRMADOS**

Você já tem 2 funcionários:
1. João Silva - `joao.silva@example.com` - CPF: `123.456.789-00`
2. Pedro Costa - `pedro.costa@example.com` - CPF: `456.789.123-00`

**Conclusão**: Seu email `maria.santos@empresa.com.br` e CPF `987.654.321-00` **NÃO estão cadastrados**! ✅

---

## ⚠️ **PROBLEMA IDENTIFICADO: IDs RELACIONAIS**

Você está enviando estes IDs:

```json
"user": { "id": "face6ab3-f2c8-4714-aa34-8d4247b6b0b7" }
"position": { "id": "00000000-0000-0000-0000-000000000006" }
"unit": { "id": "00000000-0000-0000-0000-000000000005" }
"company": { "id": "7e6dd8e2-aa31-4a6a-948e-6a4ee69f261e" }
```

O erro 500 provavelmente acontece porque:
- ❌ Estes IDs **NÃO EXISTEM** no banco de dados
- ❌ O backend tenta buscar e não encontra
- ❌ Lança exceção → Erro 500

---

## 🎯 **VERIFICAR IDs NO POSTMAN**

Execute estes comandos para ver quais IDs realmente existem:

### **1. Verificar Users:**
```http
GET http://localhost:8081/api/users
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **2. Verificar Positions:**
```http
GET http://localhost:8081/api/positions
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **3. Verificar Units:**
```http
GET http://localhost:8081/api/units
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

### **4. Verificar Companies:**
```http
GET http://localhost:8081/api/companies
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwiaWF0IjoxNzYwNjY0MDE1LCJleHAiOjE3NjEyNjg4MTV9.QEw6bWoFni3PcYRXuAIhJwL3QUJRLvX4LUOqaphcSWa6UzQlANFjc5SKrfi8NhnCkcWg_AZR4k0b34MlEK2kzw
```

---

## ✅ **SOLUÇÃO IMEDIATA: REMOVER TODOS OS IDs**

**Teste SEM nenhum ID relacional:**

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

**⚠️ REMOVIDOS:**
- ❌ `user`
- ❌ `position`
- ❌ `unit`
- ❌ `company`

---

## 🚀 **TESTE AGORA**

Use o JSON acima (arquivo `POSTMAN_MARIA_SEM_IDS.json`) e teste novamente.

**Deve funcionar! 🎉**

Se ainda der erro, me mostre a resposta para investigarmos mais a fundo.
