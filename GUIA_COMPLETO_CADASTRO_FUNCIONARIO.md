# 📋 GUIA COMPLETO - Cadastro de Funcionário (Employee CRUD)

## 🔴 PROBLEMA IDENTIFICADO

**Erro no log:**
```
O campo address.street é obrigatório e não pode ser vazio.
```

**Causa:** O campo `address.street` está sendo enviado como string vazia `""`, mas o backend valida que ele não pode ser vazio (linha 401 do `EmployeeService.java`).

---

## 📝 CAMPOS DO CADASTRO DE FUNCIONÁRIO

### ✅ CAMPOS OBRIGATÓRIOS

Estes campos **DEVEM** ter valor preenchido:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `name` | String | Nome completo | "ABRAAO MALDONADO" |
| `cpf` | String | CPF (pode ter formatação) | "034.127.526-30" |
| `status` | String | Status do funcionário | "ACTIVE" |
| **`address.street`** | **String** | **Rua/logradouro (OBRIGATÓRIO)** | **"Rua Coronel João Camargos"** |

### 📋 CAMPOS IMPORTANTES (Altamente recomendados)

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `registrationNumber` | String | Matrícula | "000127" |
| `hireDate` | Date | Data de admissão | "2024-01-10" |
| `birthDate` | Date | Data de nascimento | "1978-04-09" |
| `email` | String | E-mail (validação de formato) | "abraao@example.com" |
| `phone` | String | Telefone | "(31) 99999-9999" |
| `gender` | String | Gênero | "M", "F", "N" |

### 🔗 RELAÇÕES (IDs de outras entidades)

| Relação | Campo JSON | Obrigatório | Descrição |
|---------|------------|-------------|-----------|
| Position (Cargo) | `position: { id: "uuid" }` | ❌ Opcional | Cargo do funcionário |
| Unit (Unidade) | `unit: { id: "uuid" }` | ❌ Opcional | Unidade de trabalho |
| Company (Empresa) | `company: { id: "uuid" }` | ❌ Opcional | Empresa |
| User (Usuário Sistema) | `user: { id: "uuid" }` | ❌ Opcional | Se funcionário é usuário |

### 📍 OBJETO ENDEREÇO (Address)

**IMPORTANTE:** O campo `address.street` é **OBRIGATÓRIO** e não pode ser vazio!

```json
{
  "address": {
    "street": "Rua Coronel João Camargos",        // ✅ OBRIGATÓRIO
    "number": "267",                               // ⚪ Opcional
    "complement": "Sala 10",                       // ⚪ Opcional
    "neighborhood": "Centro",                      // ⚪ Opcional
    "city": "Contagem",                            // ⚪ Opcional
    "state": "MG",                                 // ⚪ Opcional
    "zipCode": "32040-000"                         // ⚪ Opcional
  }
}
```

---

## 📄 TODOS OS CAMPOS DISPONÍVEIS

### 1️⃣ DADOS PESSOAIS BÁSICOS

```json
{
  "name": "ABRAAO MALDONADO",                      // ✅ Obrigatório
  "cpf": "034.127.526-30",                         // ✅ Obrigatório
  "rg": "M8051635",                                // ⚪ Opcional
  "birthDate": "1978-04-09",                       // ⚪ Opcional (formato: yyyy-MM-dd)
  "gender": "M",                                   // ⚪ Opcional (M/F/N)
  "maritalStatus": "CASADO",                       // ⚪ Opcional
  "email": "abraao@example.com",                   // ⚪ Opcional (validação de formato)
  "phone": "(31) 99999-9999"                       // ⚪ Opcional
}
```

### 2️⃣ DADOS PROFISSIONAIS

```json
{
  "registrationNumber": "000127",                  // ⚪ Opcional
  "hireDate": "2024-01-10",                        // ⚪ Opcional (formato: yyyy-MM-dd)
  "terminationDate": null,                         // ⚪ Opcional (formato: yyyy-MM-dd)
  "status": "ACTIVE",                              // ✅ Obrigatório
  "notes": "Observações gerais"                    // ⚪ Opcional
}
```

**Valores válidos para `status`:**
- `ACTIVE` - Ativo
- `INACTIVE` - Inativo
- `SUSPENDED` - Suspenso
- `TERMINATED` - Demitido
- `ON_VACATION` - Em férias
- `ON_LEAVE` - Afastado

### 3️⃣ ENDEREÇO

```json
{
  "address": {
    "street": "Rua Exemplo, 123",                  // ✅ OBRIGATÓRIO (não pode ser vazio)
    "number": "123",                               // ⚪ Opcional
    "complement": "Apto 10",                       // ⚪ Opcional
    "neighborhood": "Centro",                      // ⚪ Opcional
    "city": "Belo Horizonte",                      // ⚪ Opcional
    "state": "MG",                                 // ⚪ Opcional
    "zipCode": "30000-000"                         // ⚪ Opcional
  }
}
```

### 4️⃣ DOCUMENTOS

#### CNH (Carteira Nacional de Habilitação)

```json
{
  "cnhNumber": "12345678901",                      // ⚪ Opcional
  "cnhCategory": "B",                              // ⚪ Opcional (A, B, C, D, E, AB, etc.)
  "cnhExpirationDate": "2026-12-31"                // ⚪ Opcional (formato: yyyy-MM-dd)
}
```

#### CTPS (Carteira de Trabalho)

```json
{
  "ctps": "123456",                                // ⚪ Opcional
  "ctpsRural": "654321",                           // ⚪ Opcional
  "ctpsSeries": "0001",                            // ⚪ Opcional
  "ctpsIssueDate": "2023-01-01",                   // ⚪ Opcional (formato: yyyy-MM-dd)
  "ctpsIssuingAgency": "MG"                        // ⚪ Opcional
}
```

#### RG / Carteira de Identidade

```json
{
  "rg": "M8051635",                                // ⚪ Opcional
  "carteiraIdentidadeOrgaoEmissor": "SSP-MG",      // ⚪ Opcional
  "carteiraIdentidadeDataEmissao": "2010-01-01"    // ⚪ Opcional (formato: yyyy-MM-dd)
}
```

#### Outros Documentos

```json
{
  "certificadoMilitar": "123456789",               // ⚪ Opcional
  "tituloEleitorZona": "001",                      // ⚪ Opcional
  "tituloEleitorSecao": "0001"                     // ⚪ Opcional
}
```

### 5️⃣ INFORMAÇÕES FAMILIARES

#### Pais

```json
{
  "nomePai": "Pai do Abraão",                      // ⚪ Opcional
  "nomeMae": "Mãe do Abraão",                      // ⚪ Opcional
  "localNascimento": "Belo Horizonte - MG"         // ⚪ Opcional
}
```

#### Cônjuge

```json
{
  "spouseName": "Maria Silva",                     // ⚪ Opcional
  "spouseCpf": "123.456.789-00",                   // ⚪ Opcional
  "spouseRg": "MG1234567",                         // ⚪ Opcional
  "spouseBirthDate": "1980-05-15",                 // ⚪ Opcional (formato: yyyy-MM-dd)
  "spousePhone": "(31) 98888-8888",                // ⚪ Opcional
  "spouseEmail": "maria@example.com"               // ⚪ Opcional
}
```

### 6️⃣ DADOS TRABALHISTAS

#### CBO e Grau de Instrução

```json
{
  "cbo": "5173-30",                                // ⚪ Opcional (Código Brasileiro de Ocupações)
  "grauInstrucao": "ENSINO_MEDIO"                  // ⚪ Opcional
}
```

**Valores válidos para `grauInstrucao`:**
- `FUNDAMENTAL_INCOMPLETO`
- `FUNDAMENTAL_COMPLETO`
- `MEDIO_INCOMPLETO`
- `MEDIO_COMPLETO` ou `ENSINO_MEDIO`
- `SUPERIOR_INCOMPLETO`
- `SUPERIOR_COMPLETO`
- `POS_GRADUACAO`
- `MESTRADO`
- `DOUTORADO`

#### Salário e Condições de Trabalho

```json
{
  "salario": 2395.54,                              // ⚪ Opcional (número decimal)
  "salarioPorExtenso": "Dois mil...",              // ⚪ Opcional
  "periodoPagamento": "MENSAL",                    // ⚪ Opcional
  "horarioTrabalho": "08:00-17:00",                // ⚪ Opcional
  "folgaSemanal": "DOMINGO"                        // ⚪ Opcional
}
```

**Valores válidos para `periodoPagamento`:**
- `MENSAL`
- `SEMANAL`
- `QUINZENAL`
- `HORISTA`

### 7️⃣ FGTS (Fundo de Garantia)

```json
{
  "fgtsOptante": true,                             // ⚪ Opcional (boolean)
  "fgtsDataOpcao": "2024-01-10",                   // ⚪ Opcional (formato: yyyy-MM-dd)
  "fgtsBancoDepositario": "Caixa Econômica",       // ⚪ Opcional
  "fgtsDataRetratacao": null                       // ⚪ Opcional (formato: yyyy-MM-dd)
}
```

### 8️⃣ PIS/PASEP

```json
{
  "pisDataCadastro": "2020-01-15",                 // ⚪ Opcional (formato: yyyy-MM-dd)
  "pisBancoDepositario": "Banco do Brasil",        // ⚪ Opcional
  "pisEnderecoBanco": "Rua XV de Novembro, 123",   // ⚪ Opcional
  "pisCodigoBanco": "001",                         // ⚪ Opcional
  "pisCodigoAgencia": "1234"                       // ⚪ Opcional
}
```

### 9️⃣ DADOS DA EMPRESA

```json
{
  "empresaNome": "Promover Vigilância Patrimonial Ltda",           // ⚪ Opcional
  "empresaEndereco": "Rua Coronel João Camargos, nº 267...",       // ⚪ Opcional
  "empresaCnpj": "43.576.260/0001-12"                              // ⚪ Opcional
}
```

### 🔟 ESTRANGEIROS (Apenas para funcionários estrangeiros)

```json
{
  "carteiraModelo19": "ABC123456",                 // ⚪ Opcional
  "registroGeralEstrangeiro": "RNE123456",         // ⚪ Opcional
  "casadoBrasileiro": false,                       // ⚪ Opcional
  "nomeConjugeEstrangeiro": "Nome do cônjuge",     // ⚪ Opcional
  "temFilhosBrasileiros": false,                   // ⚪ Opcional
  "quantidadeFilhosBrasileiros": 0,                // ⚪ Opcional
  "dataChegadaBrasil": "2015-03-20",               // ⚪ Opcional (formato: yyyy-MM-dd)
  "naturalizado": false,                           // ⚪ Opcional
  "decretoNaturalizacao": "Decreto nº..."          // ⚪ Opcional
}
```

### 1️⃣1️⃣ OUTROS CAMPOS

```json
{
  "vistoFiscalizacao": "Visto em 01/01/2024",      // ⚪ Opcional
  "assinaturaFuncionario": "Base64 da assinatura", // ⚪ Opcional
  "dataRescisao": null                             // ⚪ Opcional (formato: yyyy-MM-dd)
}
```

---

## 📦 EXEMPLO JSON COMPLETO - MÍNIMO FUNCIONAL

```json
{
  "name": "ABRAAO MALDONADO",
  "cpf": "034.127.526-30",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Coronel João Camargos, 267"
  }
}
```

## 📦 EXEMPLO JSON COMPLETO - COM DADOS BÁSICOS

```json
{
  "name": "ABRAAO MALDONADO",
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
  "notes": "Funcionário admitido via Postman",
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
  "ctpsSeries": "0001",
  "ctpsIssueDate": "2023-01-01",
  "ctpsIssuingAgency": "MG",
  "carteiraIdentidadeOrgaoEmissor": "SSP-MG",
  "carteiraIdentidadeDataEmissao": "2010-01-01",
  "nomePai": "Pai do Abraão",
  "nomeMae": "Mãe do Abraão",
  "localNascimento": "Belo Horizonte - MG",
  "grauInstrucao": "ENSINO_MEDIO",
  "cbo": "5173-30",
  "salario": 2395.54,
  "salarioPorExtenso": "Dois mil trezentos e noventa e cinco reais e cinquenta e quatro centavos",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "08:00-17:00",
  "folgaSemanal": "DOMINGO",
  "fgtsOptante": true,
  "fgtsDataOpcao": "2024-01-10",
  "fgtsBancoDepositario": "Caixa Econômica Federal",
  "empresaNome": "Promover Vigilância Patrimonial Ltda",
  "empresaEndereco": "Rua Coronel João Camargos, nº 267 - Centro - Contagem - MG",
  "empresaCnpj": "43.576.260/0001-12"
}
```

---

## 🔗 RELAÇÕES COM OUTRAS ENTIDADES

### 1. Position (Cargo)

Para vincular um **cargo**:

```json
{
  "position": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

📌 **Como obter IDs de cargos?**
```
GET http://localhost:8081/api/positions
```

### 2. Unit (Unidade)

Para vincular uma **unidade**:

```json
{
  "unit": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

📌 **Como obter IDs de unidades?**
```
GET http://localhost:8081/api/units
```

### 3. Company (Empresa)

Para vincular uma **empresa**:

```json
{
  "company": {
    "id": "123e4567-e89b-12d3-a456-426614174002"
  }
}
```

📌 **Como obter IDs de empresas?**
```
GET http://localhost:8081/api/companies
```

### 4. User (Usuário do Sistema)

**⚠️ IMPORTANTE:** Só preencha se o funcionário também for um usuário do sistema!

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174003"
  }
}
```

📌 **Como obter IDs de usuários?**
```
GET http://localhost:8081/api/users
```

---

## 🚀 COMO TESTAR NO POSTMAN

### Passo 1: Fazer Login

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Passo 2: Copiar o Token da resposta

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Passo 3: Criar Funcionário

```
POST http://localhost:8081/api/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "ABRAAO MALDONADO",
  "cpf": "034.127.526-30",
  "rg": "M8051635",
  "email": "abraao@example.com",
  "phone": "(31) 99999-9999",
  "birthDate": "1978-04-09",
  "gender": "M",
  "maritalStatus": "CASADO",
  "registrationNumber": "000127",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Coronel João Camargos",
    "number": "267",
    "city": "Contagem",
    "state": "MG"
  },
  "empresaNome": "Promover Vigilância Patrimonial Ltda",
  "empresaCnpj": "43.576.260/0001-12"
}
```

---

## ❌ ERROS COMUNS

### 1. `address.street é obrigatório e não pode ser vazio`

**Problema:** Enviando `"street": ""`

**Solução:** Envie um valor válido:
```json
{
  "address": {
    "street": "Rua Exemplo, 123"  // ✅ Não pode ser vazio!
  }
}
```

### 2. `Status inválido`

**Problema:** Enviando status não reconhecido

**Solução:** Use um dos valores válidos:
- `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TERMINATED`, `ON_VACATION`, `ON_LEAVE`

### 3. `Invalid email format`

**Problema:** E-mail inválido

**Solução:** Use um formato válido: `usuario@dominio.com`

### 4. `position/unit/company não encontrado`

**Problema:** ID inválido ou não existe

**Solução:** Deixe `null` ou consulte IDs válidos nos endpoints de listagem

---

## 📊 RESUMO DE CAMPOS

| Categoria | Campos Obrigatórios | Campos Opcionais |
|-----------|---------------------|------------------|
| **Dados Básicos** | `name`, `cpf`, `status` | `rg`, `email`, `phone`, `birthDate`, `gender`, `maritalStatus` |
| **Endereço** | `address.street` | `number`, `complement`, `neighborhood`, `city`, `state`, `zipCode` |
| **Profissional** | - | `registrationNumber`, `hireDate`, `terminationDate`, `notes` |
| **Documentos** | - | `cnhNumber`, `cnhCategory`, `cnhExpirationDate`, `ctps`, `ctpsSeries`, etc. |
| **Família** | - | `nomePai`, `nomeMae`, `spouseName`, `spouseCpf`, etc. |
| **Trabalhista** | - | `cbo`, `grauInstrucao`, `salario`, `periodoPagamento`, etc. |
| **Relações** | - | `position`, `unit`, `company`, `user` |

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Corrigir o JSON para incluir `address.street` com valor válido
2. ✅ Testar cadastro no Postman
3. ✅ Verificar se o funcionário foi criado: `GET http://localhost:8081/api/employees`
4. ✅ Cadastrar dependentes (se necessário): Ver `COMO_TESTAR_CADASTRO_DEPENDENTE_POSTMAN.md`

