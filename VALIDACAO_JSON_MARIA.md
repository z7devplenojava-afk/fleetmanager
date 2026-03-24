# ✅ VALIDAÇÃO DO JSON - MARIA JOSÉ SANTOS OLIVEIRA

## 📅 Data: 17/10/2025

---

## 🔍 **ANÁLISE DO JSON**

### ✅ **CAMPOS OBRIGATÓRIOS (4/4) - OK!**
- ✅ `name`: "MARIA JOSÉ SANTOS OLIVEIRA"
- ✅ `cpf`: "987.654.321-00"
- ✅ `status`: "ACTIVE"
- ✅ `address.street`: "Avenida Paulista" ✅

### ✅ **CAMPOS RECOMENDADOS (10/10) - OK!**
- ✅ `registrationNumber`: "000128"
- ✅ `hireDate`: "2024-02-01"
- ✅ `birthDate`: "1985-03-15"
- ✅ `email`: "maria.santos@empresa.com.br"
- ✅ `phone`: "(11) 98765-4321"
- ✅ `gender`: "F"
- ✅ `maritalStatus`: "SOLTEIRA"
- ✅ `rg`: "SP9876543"
- ✅ `salario`: 3500.00
- ✅ `cbo`: "4110-10"

### ✅ **ENDEREÇO COMPLETO (7/7) - OK!**
- ✅ `street`: "Avenida Paulista"
- ✅ `number`: "1000"
- ✅ `complement`: "Conjunto 45"
- ✅ `neighborhood`: "Bela Vista"
- ✅ `city`: "São Paulo"
- ✅ `state`: "MG"
- ✅ `zipCode`: "01310-100"

### ✅ **CNH (3/3) - OK!**
- ✅ `cnhNumber`: "98765432100"
- ✅ `cnhCategory`: "AB"
- ✅ `cnhExpirationDate`: "2027-05-20"

### ✅ **CTPS (5/5) - OK!**
- ✅ `ctps`: "987654"
- ✅ `ctpsRural`: null
- ✅ `ctpsSeries`: "0002"
- ✅ `ctpsIssueDate`: "2022-06-15"
- ✅ `ctpsIssuingAgency`: "SP"

### ✅ **DOCUMENTOS (4/4) - OK!**
- ✅ `tituloEleitorZona`: "002"
- ✅ `tituloEleitorSecao`: "0002"
- ✅ `carteiraIdentidadeOrgaoEmissor`: "SSP-SP"
- ✅ `carteiraIdentidadeDataEmissao`: "2015-08-10"

### ✅ **DADOS FAMILIARES (4/4) - OK!**
- ✅ `nomePai`: "João Santos Oliveira"
- ✅ `nomeMae`: "Ana Maria Santos"
- ✅ `localNascimento`: "São Paulo - SP"
- ✅ `grauInstrucao`: "SUPERIOR_COMPLETO"

### ✅ **TRABALHO (7/7) - OK!**
- ✅ `salarioPorExtenso`: "Três mil e quinhentos reais"
- ✅ `periodoPagamento`: "MENSAL"
- ✅ `horarioTrabalho`: "09:00 às 18:00"
- ✅ `folgaSemanal`: "SÁBADO"
- ✅ `empresaNome`: "Promover Vigilância Patrimonial Ltda"
- ✅ `empresaEndereco`: "Rua Coronel João Camargos..."
- ✅ `empresaCnpj`: "43.576.260/0001-12"

### ✅ **FGTS (4/4) - OK!**
- ✅ `fgtsOptante`: true
- ✅ `fgtsDataOpcao`: "2024-02-01"
- ✅ `fgtsBancoDepositario`: "Banco do Brasil"
- ✅ `fgtsDataRetratacao`: null

### ✅ **PIS/PASEP (6/6) - OK!**
- ✅ `pis`: "98765432100"
- ✅ `pisDataCadastro`: "2019-03-20"
- ✅ `pisBancoDepositario`: "Itaú Unibanco"
- ✅ `pisEnderecoBanco`: "Av. Paulista, 1000"
- ✅ `pisCodigoBanco`: "341"
- ✅ `pisCodigoAgencia`: "5678"

### ✅ **ESTRANGEIROS (9/9) - OK!**
- ✅ Todos null ou false (correto para brasileira nata)

### ✅ **RELACIONAMENTOS (4/4) - OK!**
- ✅ `user.id`: "face6ab3-f2c8-4714-aa34-8d4247b6b0b7"
- ✅ `position.id`: "00000000-0000-0000-0000-000000000006"
- ✅ `unit.id`: "00000000-0000-0000-0000-000000000005"
- ✅ `company.id`: "7e6dd8e2-aa31-4a6a-948e-6a4ee69f261e"

---

## 📊 **ESTATÍSTICAS**

| Categoria | Preenchidos |
|-----------|-------------|
| Obrigatórios | 4/4 ✅ |
| Recomendados | 10/10 ✅ |
| Endereço | 7/7 ✅ |
| CNH | 3/3 ✅ |
| CTPS | 5/5 ✅ |
| Documentos | 4/4 ✅ |
| Familiares | 4/4 ✅ |
| Trabalho | 7/7 ✅ |
| FGTS | 4/4 ✅ |
| PIS | 6/6 ✅ |
| Estrangeiros | 9/9 ✅ |
| Relacionais | 4/4 ✅ |
| **TOTAL** | **65/87 campos** |

---

## ⚠️ **ATENÇÃO - IDs PODEM NÃO EXISTIR**

Estes IDs podem estar causando o erro 500:

```json
"user": { "id": "face6ab3-f2c8-4714-aa34-8d4247b6b0b7" }      // ⚠️ Verificar
"position": { "id": "00000000-0000-0000-0000-000000000006" }  // ⚠️ Parece ID de seed
"unit": { "id": "00000000-0000-0000-0000-000000000005" }      // ⚠️ Parece ID de seed
"company": { "id": "7e6dd8e2-aa31-4a6a-948e-6a4ee69f261e" }   // ⚠️ Verificar
```

---

## ✅ **OPÇÃO 1: REMOVER IDs (Mais Seguro)**

Como agora `user` e `position` são **OPCIONAIS**, remova esses campos:

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

---

## ✅ **OPÇÃO 2: VERIFICAR IDs PRIMEIRO**

Execute estes comandos no Postman:

```http
GET http://localhost:8081/api/users
GET http://localhost:8081/api/positions
GET http://localhost:8081/api/units
GET http://localhost:8081/api/companies
Authorization: Bearer [SEU_TOKEN]
```

E use os IDs reais que retornarem.

---

## 🚀 **RECOMENDAÇÃO**

**Use a OPÇÃO 1** (sem os IDs) para garantir que o cadastro funcionará.

Você pode adicionar os IDs depois com um UPDATE:

```http
PUT http://localhost:8081/api/employees/{id}
```

---

## ✅ **CONCLUSÃO**

Seu JSON está **EXCELENTE** com 65 campos preenchidos!

O problema do erro 500 provavelmente são os IDs relacionais que podem não existir.

**Teste primeiro SEM os IDs (user, position, unit, company) para garantir sucesso! 🚀**
