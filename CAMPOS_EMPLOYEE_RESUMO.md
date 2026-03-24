# 📊 RESUMO RÁPIDO - Campos do Employee

## 🔴 CAMPOS OBRIGATÓRIOS (4 campos)

| # | Campo | Tipo | Validação | Exemplo |
|---|-------|------|-----------|---------|
| 1 | `name` | String | Não pode ser nulo/vazio | "ABRAAO MALDONADO" |
| 2 | `cpf` | String | Não pode ser nulo/vazio | "034.127.526-30" |
| 3 | `status` | String (Enum) | Valores: ACTIVE, INACTIVE, SUSPENDED, TERMINATED, ON_VACATION, ON_LEAVE | "ACTIVE" |
| 4 | **`address.street`** | **String** | **Não pode ser nulo/vazio** | **"Rua Exemplo, 123"** |

---

## 🟡 CAMPOS IMPORTANTES (Recomendados)

| # | Campo | Tipo | Exemplo |
|---|-------|------|---------|
| 5 | `registrationNumber` | String | "000127" |
| 6 | `hireDate` | Date (yyyy-MM-dd) | "2024-01-10" |
| 7 | `birthDate` | Date (yyyy-MM-dd) | "1978-04-09" |
| 8 | `email` | String (validação) | "usuario@example.com" |
| 9 | `phone` | String | "(31) 99999-9999" |
| 10 | `gender` | String | "M", "F", "N" |
| 11 | `rg` | String | "M8051635" |

---

## ⚪ TODOS OS CAMPOS OPCIONAIS (80+ campos)

### 📝 Dados Pessoais (15 campos)
- `maritalStatus` - Estado civil
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

### 📍 Endereço Completo (7 campos)
- `address.street` ✅ **OBRIGATÓRIO**
- `address.number` - Número
- `address.complement` - Complemento
- `address.neighborhood` - Bairro
- `address.city` - Cidade
- `address.state` - Estado
- `address.zipCode` - CEP

### 🚗 CNH (3 campos)
- `cnhNumber` - Número da CNH
- `cnhCategory` - Categoria (A, B, C, D, E)
- `cnhExpirationDate` - Data validade

### 📄 CTPS (5 campos)
- `ctps` - Número CTPS
- `ctpsRural` - CTPS Rural
- `ctpsSeries` - Série
- `ctpsIssueDate` - Data emissão
- `ctpsIssuingAgency` - Órgão emissor

### 🆔 Documentos Identidade (5 campos)
- `rg` - RG
- `carteiraIdentidadeOrgaoEmissor` - Órgão emissor RG
- `carteiraIdentidadeDataEmissao` - Data emissão RG
- `certificadoMilitar` - Certificado militar
- `tituloEleitorZona` - Título eleitor zona
- `tituloEleitorSecao` - Título eleitor seção

### 💼 Dados Trabalhistas (9 campos)
- `cbo` - Código Brasileiro Ocupações
- `salario` - Salário (número)
- `salarioPorExtenso` - Salário por extenso
- `periodoPagamento` - Período (MENSAL, SEMANAL, etc)
- `horarioTrabalho` - Horário trabalho
- `folgaSemanal` - Dia folga
- `empresaNome` - Nome empresa
- `empresaEndereco` - Endereço empresa
- `empresaCnpj` - CNPJ empresa

### 🏦 FGTS (4 campos)
- `fgtsOptante` - Optante (boolean)
- `fgtsDataOpcao` - Data opção
- `fgtsBancoDepositario` - Banco depositário
- `fgtsDataRetratacao` - Data retratação

### 📋 PIS/PASEP (5 campos)
- `pisDataCadastro` - Data cadastro
- `pisBancoDepositario` - Banco depositário
- `pisEnderecoBanco` - Endereço banco
- `pisCodigoBanco` - Código banco
- `pisCodigoAgencia` - Código agência

### 🌍 Estrangeiros (10 campos)
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

### 🔗 Relações (4 entidades)
- `position` - Cargo `{ id: "uuid" }`
- `unit` - Unidade `{ id: "uuid" }`
- `company` - Empresa `{ id: "uuid" }`
- `user` - Usuário Sistema `{ id: "uuid" }`

---

## 📊 ESTATÍSTICAS

| Categoria | Quantidade |
|-----------|------------|
| ✅ Campos Obrigatórios | 4 |
| 🟡 Campos Recomendados | 7 |
| ⚪ Campos Opcionais | ~80 |
| 🔗 Relações | 4 |
| **TOTAL** | **~91 campos** |

---

## 🚀 EXEMPLOS DE USO

### Cadastro Mínimo (4 campos)
```json
{
  "name": "João Silva",
  "cpf": "123.456.789-00",
  "status": "ACTIVE",
  "address": { "street": "Rua Exemplo, 123" }
}
```

### Cadastro Básico (11 campos)
```json
{
  "name": "João Silva",
  "cpf": "123.456.789-00",
  "rg": "MG1234567",
  "email": "joao@example.com",
  "phone": "(31) 99999-9999",
  "birthDate": "1990-01-15",
  "gender": "M",
  "registrationNumber": "001",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Exemplo",
    "number": "123",
    "city": "Belo Horizonte",
    "state": "MG"
  }
}
```

### Cadastro Completo
Ver arquivo: `POSTMAN_EMPLOYEE_COMPLETE_EXAMPLE.json`

---

## ❌ ERRO MAIS COMUM

### ⚠️ "O campo address.street é obrigatório e não pode ser vazio"

**Causa:**
```json
{
  "address": {
    "street": ""  // ❌ VAZIO!
  }
}
```

**Solução:**
```json
{
  "address": {
    "street": "Rua Exemplo, 123"  // ✅ COM VALOR!
  }
}
```

---

## 📚 DOCUMENTOS RELACIONADOS

- 📖 **Guia Completo:** `GUIA_COMPLETO_CADASTRO_FUNCIONARIO.md`
- 📝 **Exemplo Mínimo:** `POSTMAN_EMPLOYEE_MINIMAL_EXAMPLE.json`
- 📝 **Exemplo Completo:** `POSTMAN_EMPLOYEE_COMPLETE_EXAMPLE.json`
- 🧪 **Como Testar:** `COMO_TESTAR_CADASTRO_FUNCIONARIO_POSTMAN.md`

