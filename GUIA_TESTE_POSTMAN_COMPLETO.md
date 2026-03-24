# 🚀 GUIA COMPLETO - Teste de Cadastro de Funcionário no Postman

## 📅 Data: 17/10/2025

---

## 🎯 **OBJETIVO**
Testar o cadastro completo de funcionário via Postman com **TODOS os campos** disponíveis.

---

## 📋 **PRÉ-REQUISITOS**

### ✅ **Backend Rodando**
```bash
# Verificar se está rodando na porta 8081
netstat -an | findstr :8081
```

### ✅ **Token de Autenticação**
Você precisa fazer login primeiro para obter o token.

---

## 🔐 **PASSO 1: FAZER LOGIN**

### **Endpoint:**
```
POST http://localhost:8081/api/auth/login
```

### **Headers:**
```
Content-Type: application/json
```

### **Body (JSON):**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### **Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresIn": 3600
}
```

### **⚠️ IMPORTANTE:**
Copie o token da resposta para usar no próximo passo!

---

## 👤 **PASSO 2: CADASTRAR FUNCIONÁRIO COMPLETO**

### **Endpoint:**
```
POST http://localhost:8081/api/employees
```

### **Headers:**
```
Authorization: Bearer [SEU_TOKEN_AQUI]
Content-Type: application/json
```

### **Body (JSON):**
Use um dos arquivos criados:

#### **Opção 1: Funcionário Masculino Completo**
**Arquivo:** `POSTMAN_EMPLOYEE_FULL_COMPLETE.json`

```json
{
  "name": "ABRAAO MALDONADO SILVA",
  "cpf": "034.127.526-30",
  "rg": "M8051635",
  "email": "abraao.maldonado@example.com",
  "phone": "(31) 99999-9999",
  "birthDate": "1978-04-09",
  "gender": "M",
  "maritalStatus": "CASADO",
  "registrationNumber": "000127",
  "hireDate": "2024-01-10",
  "terminationDate": null,
  "status": "ACTIVE",
  "notes": "Funcionário admitido via Postman - Cadastro completo",
  "address": {
    "street": "Rua Coronel João Camargos",
    "number": "267",
    "complement": "Sala 10",
    "neighborhood": "Centro",
    "city": "Contagem",
    "state": "MG",
    "zipCode": "32040-000"
  },
  "cnhNumber": "12345678901",
  "cnhCategory": "B",
  "cnhExpirationDate": "2026-12-31",
  "ctps": "123456",
  "ctpsRural": null,
  "ctpsSeries": "0001",
  "ctpsIssueDate": "2023-01-01",
  "ctpsIssuingAgency": "MG",
  "carteiraIdentidadeOrgaoEmissor": "SSP-MG",
  "carteiraIdentidadeDataEmissao": "2010-01-01",
  "certificadoMilitar": "123456789",
  "tituloEleitorZona": "001",
  "tituloEleitorSecao": "0001",
  "nomePai": "João Maldonado Silva",
  "nomeMae": "Maria Maldonado Silva",
  "localNascimento": "Belo Horizonte - MG",
  "grauInstrucao": "ENSINO_MEDIO",
  "cbo": "5173-30",
  "pis": "12345678901",
  "salario": 2395.54,
  "salarioPorExtenso": "Dois mil trezentos e noventa e cinco reais e cinquenta e quatro centavos",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "08:00 às 17:00",
  "folgaSemanal": "DOMINGO",
  "fgtsOptante": true,
  "fgtsDataOpcao": "2024-01-10",
  "fgtsBancoDepositario": "Caixa Econômica Federal",
  "fgtsDataRetratacao": null,
  "pisDataCadastro": "2020-01-15",
  "pisBancoDepositario": "Banco do Brasil",
  "pisEnderecoBanco": "Rua XV de Novembro, 123",
  "pisCodigoBanco": "001",
  "pisCodigoAgencia": "1234",
  "empresaNome": "Promover Vigilância Patrimonial Ltda",
  "empresaEndereco": "Rua Coronel João Camargos, nº 267 - Centro - Contagem - MG",
  "empresaCnpj": "43.576.260/0001-12",
  "vistoFiscalizacao": "Visto em 01/01/2024",
  "assinaturaFuncionario": null,
  "dataRescisao": null,
  "spouseName": "Maria Silva Maldonado",
  "spouseCpf": "123.456.789-00",
  "spouseRg": "MG1234567",
  "spouseBirthDate": "1980-05-15",
  "spousePhone": "(31) 98888-8888",
  "spouseEmail": "maria.silva@example.com",
  "carteiraModelo19": null,
  "registroGeralEstrangeiro": null,
  "casadoBrasileiro": null,
  "nomeConjugeEstrangeiro": null,
  "temFilhosBrasileiros": false,
  "quantidadeFilhosBrasileiros": 0,
  "dataChegadaBrasil": null,
  "naturalizado": false,
  "decretoNaturalizacao": null,
  "position": {
    "id": null
  },
  "unit": {
    "id": null
  },
  "company": {
    "id": null
  },
  "user": {
    "id": null
  }
}
```

#### **Opção 2: Funcionária Feminina Completa**
**Arquivo:** `POSTMAN_EMPLOYEE_FEMALE_EXAMPLE.json`

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
  "terminationDate": null,
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
  "ctpsRural": null,
  "ctpsSeries": "0002",
  "ctpsIssueDate": "2022-06-15",
  "ctpsIssuingAgency": "SP",
  "carteiraIdentidadeOrgaoEmissor": "SSP-SP",
  "carteiraIdentidadeDataEmissao": "2015-08-10",
  "certificadoMilitar": null,
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
  "fgtsDataRetratacao": null,
  "pisDataCadastro": "2019-03-20",
  "pisBancoDepositario": "Itaú Unibanco",
  "pisEnderecoBanco": "Av. Paulista, 1000",
  "pisCodigoBanco": "341",
  "pisCodigoAgencia": "5678",
  "empresaNome": "Promover Vigilância Patrimonial Ltda",
  "empresaEndereco": "Rua Coronel João Camargos, nº 267 - Centro - Contagem - MG",
  "empresaCnpj": "43.576.260/0001-12",
  "vistoFiscalizacao": null,
  "assinaturaFuncionario": null,
  "dataRescisao": null,
  "spouseName": null,
  "spouseCpf": null,
  "spouseRg": null,
  "spouseBirthDate": null,
  "spousePhone": null,
  "spouseEmail": null,
  "carteiraModelo19": null,
  "registroGeralEstrangeiro": null,
  "casadoBrasileiro": null,
  "nomeConjugeEstrangeiro": null,
  "temFilhosBrasileiros": false,
  "quantidadeFilhosBrasileiros": 0,
  "dataChegadaBrasil": null,
  "naturalizado": false,
  "decretoNaturalizacao": null,
  "position": {
    "id": null
  },
  "unit": {
    "id": null
  },
  "company": {
    "id": null
  },
  "user": {
    "id": null
  }
}
```

---

## ✅ **RESPOSTA ESPERADA**

### **Status Code:** `201 Created`

### **Body da Resposta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "ABRAAO MALDONADO SILVA",
  "cpf": "034.127.526-30",
  "rg": "M8051635",
  "email": "abraao.maldonado@example.com",
  "phone": "(31) 99999-9999",
  "birthDate": "1978-04-09",
  "gender": "M",
  "maritalStatus": "CASADO",
  "registrationNumber": "000127",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "notes": "Funcionário admitido via Postman - Cadastro completo",
  "address": {
    "street": "Rua Coronel João Camargos",
    "number": "267",
    "complement": "Sala 10",
    "neighborhood": "Centro",
    "city": "Contagem",
    "state": "MG",
    "zipCode": "32040-000"
  },
  "createdAt": "2025-10-17T12:00:00",
  "updatedAt": "2025-10-17T12:00:00"
}
```

---

## 🔍 **PASSO 3: VERIFICAR CADASTRO**

### **Listar Funcionários:**
```
GET http://localhost:8081/api/employees
Authorization: Bearer [SEU_TOKEN]
```

### **Contar Funcionários:**
```
GET http://localhost:8081/api/employees/count
Authorization: Bearer [SEU_TOKEN]
```

### **Buscar por ID:**
```
GET http://localhost:8081/api/employees/{ID_DO_FUNCIONARIO}
Authorization: Bearer [SEU_TOKEN]
```

---

## 📊 **CAMPOS INCLUÍDOS NO JSON COMPLETO**

### 🔴 **Campos Obrigatórios (4)**
- ✅ `name` - Nome completo
- ✅ `cpf` - CPF
- ✅ `status` - Status do funcionário
- ✅ `address.street` - Rua (não pode ser vazio)

### 🟡 **Campos Importantes (7)**
- ✅ `registrationNumber` - Matrícula
- ✅ `hireDate` - Data de admissão
- ✅ `birthDate` - Data de nascimento
- ✅ `email` - E-mail
- ✅ `phone` - Telefone
- ✅ `gender` - Gênero
- ✅ `maritalStatus` - Estado civil

### ⚪ **Campos Opcionais (80+)**

#### **Dados Pessoais (15 campos)**
- `rg` - RG
- `nomePai` - Nome do pai
- `nomeMae` - Nome da mãe
- `localNascimento` - Local de nascimento
- `grauInstrucao` - Nível educacional
- `spouseName` - Nome do cônjuge
- `spouseCpf` - CPF do cônjuge
- `spouseRg` - RG do cônjuge
- `spouseBirthDate` - Data nasc. cônjuge
- `spousePhone` - Telefone cônjuge
- `spouseEmail` - E-mail cônjuge
- `terminationDate` - Data demissão
- `dataRescisao` - Data rescisão
- `notes` - Observações
- `assinaturaFuncionario` - Assinatura

#### **Endereço Completo (7 campos)**
- `address.street` ✅ **OBRIGATÓRIO**
- `address.number` - Número
- `address.complement` - Complemento
- `address.neighborhood` - Bairro
- `address.city` - Cidade
- `address.state` - Estado
- `address.zipCode` - CEP

#### **CNH (3 campos)**
- `cnhNumber` - Número da CNH
- `cnhCategory` - Categoria (A, B, C, D, E, AB)
- `cnhExpirationDate` - Data validade

#### **CTPS (5 campos)**
- `ctps` - Número CTPS
- `ctpsRural` - CTPS Rural
- `ctpsSeries` - Série
- `ctpsIssueDate` - Data emissão
- `ctpsIssuingAgency` - Órgão emissor

#### **Documentos Identidade (6 campos)**
- `carteiraIdentidadeOrgaoEmissor` - Órgão emissor RG
- `carteiraIdentidadeDataEmissao` - Data emissão RG
- `certificadoMilitar` - Certificado militar
- `tituloEleitorZona` - Título eleitor zona
- `tituloEleitorSecao` - Título eleitor seção

#### **Dados Trabalhistas (9 campos)**
- `cbo` - Código Brasileiro Ocupações
- `salario` - Salário (número)
- `salarioPorExtenso` - Salário por extenso
- `periodoPagamento` - Período (MENSAL, SEMANAL, etc)
- `horarioTrabalho` - Horário trabalho
- `folgaSemanal` - Dia folga
- `empresaNome` - Nome empresa
- `empresaEndereco` - Endereço empresa
- `empresaCnpj` - CNPJ empresa

#### **FGTS (4 campos)**
- `fgtsOptante` - Optante (boolean)
- `fgtsDataOpcao` - Data opção
- `fgtsBancoDepositario` - Banco depositário
- `fgtsDataRetratacao` - Data retratação

#### **PIS/PASEP (5 campos)**
- `pis` - Número PIS
- `pisDataCadastro` - Data cadastro
- `pisBancoDepositario` - Banco depositário
- `pisEnderecoBanco` - Endereço banco
- `pisCodigoBanco` - Código banco
- `pisCodigoAgencia` - Código agência

#### **Estrangeiros (10 campos)**
- `carteiraModelo19` - Carteira modelo 19
- `registroGeralEstrangeiro` - RGE
- `casadoBrasileiro` - Casado c/ brasileiro
- `nomeConjugeEstrangeiro` - Nome cônjuge
- `temFilhosBrasileiros` - Tem filhos brasileiros
- `quantidadeFilhosBrasileiros` - Qtd filhos
- `dataChegadaBrasil` - Data chegada
- `naturalizado` - É naturalizado
- `decretoNaturalizacao` - Decreto
- `vistoFiscalizacao` - Visto fiscalização

#### **Relações (4 entidades)**
- `position` - Cargo `{ id: "uuid" }`
- `unit` - Unidade `{ id: "uuid" }`
- `company` - Empresa `{ id: "uuid" }`
- `user` - Usuário Sistema `{ id: "uuid" }`

---

## ❌ **ERROS COMUNS E SOLUÇÕES**

### 1. **`401 Unauthorized`**
**Problema:** Token inválido ou expirado
**Solução:** Faça login novamente e copie o novo token

### 2. **`400 Bad Request`**
**Problema:** Dados inválidos
**Solução:** Verifique se todos os campos obrigatórios estão preenchidos

### 3. **`O campo address.street é obrigatório`**
**Problema:** `address.street` vazio
**Solução:** Sempre preencha com um valor válido

### 4. **`Status inválido`**
**Problema:** Status não reconhecido
**Solução:** Use: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TERMINATED`, `ON_VACATION`, `ON_LEAVE`

### 5. **`Invalid email format`**
**Problema:** E-mail inválido
**Solução:** Use formato válido: `usuario@dominio.com`

---

## 📚 **ARQUIVOS CRIADOS**

1. **`POSTMAN_EMPLOYEE_FULL_COMPLETE.json`** - Funcionário masculino completo
2. **`POSTMAN_EMPLOYEE_FEMALE_EXAMPLE.json`** - Funcionária feminina completa
3. **`GUIA_TESTE_POSTMAN_COMPLETO.md`** - Este guia passo a passo

---

## 🎯 **RESULTADO ESPERADO**

Após executar o teste, você deve ver:
- ✅ **Status 201** - Funcionário criado com sucesso
- ✅ **ID gerado** - UUID do funcionário
- ✅ **Dados salvos** - Todos os campos preenchidos
- ✅ **Contador atualizado** - Interface mostra +1 funcionário
- ✅ **Listagem funcionando** - Funcionário aparece na lista

---

**Agora você tem JSONs completos para testar o cadastro de funcionário com TODOS os campos! 🚀**
