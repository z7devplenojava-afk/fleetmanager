# 📘 GUIA COMPLETO - JSON com TODOS os Campos do Employee

## 📅 Data: 17/10/2025

---

## 🎯 **ARQUIVOS CRIADOS**

1. **`ANALISE_COMPLETA_EMPLOYEE_FIELDS.md`** - Análise detalhada de todos os 87 campos
2. **`POSTMAN_EMPLOYEE_COMPLETO_TODOS_CAMPOS.json`** - JSON completo com todos os campos preenchidos

---

## 📊 **RESUMO DOS CAMPOS**

### **TOTAL: 87 CAMPOS**

| Categoria | Quantidade | Campos |
|-----------|------------|--------|
| 🔴 **Obrigatórios** | 4 | name, cpf, status, address.street |
| 🟡 **Recomendados** | 10 | registrationNumber, hireDate, birthDate, email, phone, gender, maritalStatus, rg, salario, cbo |
| ⚪ **Opcionais Simples** | 58 | CNH, CTPS, PIS, FGTS, Documentos, Cônjuge, Estrangeiros, etc |
| 🔵 **DTOs Aninhados** | 3 | bankInfo, jobInfo, emergencyContact |
| 🟢 **Listas** | 8 | documents, benefits, schedules, occurrences, payrolls, epis, timeRecords, dependents |
| 🟣 **Relacionais** | 4 | user, position, unit, company |

---

## 📋 **ESTRUTURA COMPLETA DO JSON**

```json
{
  // ========================================
  // 🔴 CAMPOS OBRIGATÓRIOS (4)
  // ========================================
  "name": "string",                    // Nome completo
  "cpf": "string",                     // CPF (único)
  "status": "ACTIVE",                  // ACTIVE, INACTIVE, SUSPENDED, TERMINATED, ON_VACATION, ON_LEAVE
  "address": {
    "street": "string"                 // Endereço (obrigatório)
  },
  
  // ========================================
  // 🟡 CAMPOS RECOMENDADOS (10)
  // ========================================
  "registrationNumber": "string",      // Matrícula
  "hireDate": "2024-01-01",           // Data de admissão
  "birthDate": "1990-01-01",          // Data de nascimento
  "email": "string",                   // E-mail (único)
  "phone": "string",                   // Telefone
  "gender": "M/F",                    // Gênero
  "maritalStatus": "string",          // Estado civil
  "rg": "string",                     // RG
  "salario": 0.00,                    // Salário
  "cbo": "string",                    // CBO
  
  // ========================================
  // ⚪ ENDEREÇO COMPLETO (7 campos)
  // ========================================
  "address": {
    "street": "string",               // Rua (obrigatório)
    "number": "string",               // Número
    "complement": "string",           // Complemento
    "neighborhood": "string",         // Bairro
    "city": "string",                 // Cidade
    "state": "string",                // Estado (UF)
    "zipCode": "string"               // CEP
  },
  
  // ========================================
  // ⚪ CNH (3 campos)
  // ========================================
  "cnhNumber": "string",              // Número da CNH
  "cnhCategory": "string",            // A, B, AB, C, D, E
  "cnhExpirationDate": "2027-01-01",  // Data de validade
  
  // ========================================
  // ⚪ CTPS (5 campos)
  // ========================================
  "ctps": "string",                   // Número CTPS
  "ctpsRural": "string",              // CTPS Rural
  "ctpsSeries": "string",             // Série
  "ctpsIssueDate": "2020-01-01",      // Data de emissão
  "ctpsIssuingAgency": "string",      // Órgão emissor
  
  // ========================================
  // ⚪ TÍTULO DE ELEITOR (3 campos)
  // ========================================
  "tituloEleitor": "string",          // Número do título
  "tituloEleitorZona": "string",      // Zona
  "tituloEleitorSecao": "string",     // Seção
  
  // ========================================
  // ⚪ DOCUMENTOS PESSOAIS (4 campos)
  // ========================================
  "carteiraIdentidadeOrgaoEmissor": "string",  // Órgão emissor RG
  "carteiraIdentidadeDataEmissao": "2015-01-01", // Data emissão RG
  "certificadoMilitar": "string",     // Certificado militar
  
  // ========================================
  // ⚪ DADOS FAMILIARES (4 campos)
  // ========================================
  "nomePai": "string",                // Nome do pai
  "nomeMae": "string",                // Nome da mãe
  "localNascimento": "string",        // Local de nascimento
  "grauInstrucao": "string",          // Grau de instrução
  
  // ========================================
  // ⚪ TRABALHO (6 campos)
  // ========================================
  "salarioPorExtenso": "string",      // Salário por extenso
  "periodoPagamento": "string",       // MENSAL, QUINZENAL, SEMANAL
  "horarioTrabalho": "string",        // Horário de trabalho
  "folgaSemanal": "string",           // Dia de folga
  "empresaNome": "string",            // Nome da empresa
  "empresaEndereco": "string",        // Endereço da empresa
  "empresaCnpj": "string",            // CNPJ da empresa
  
  // ========================================
  // ⚪ FGTS (4 campos)
  // ========================================
  "fgtsOptante": true/false,          // Optante FGTS
  "fgtsDataOpcao": "2024-01-01",      // Data da opção
  "fgtsBancoDepositario": "string",   // Banco depositário
  "fgtsDataRetratacao": "2024-01-01", // Data de retratação
  
  // ========================================
  // ⚪ PIS/PASEP (6 campos)
  // ========================================
  "pis": "string",                    // Número do PIS
  "pisDataCadastro": "2020-01-01",    // Data de cadastro
  "pisBancoDepositario": "string",    // Banco depositário
  "pisEnderecoBanco": "string",       // Endereço do banco
  "pisCodigoBanco": "string",         // Código do banco
  "pisCodigoAgencia": "string",       // Código da agência
  
  // ========================================
  // ⚪ DADOS DO CÔNJUGE (6 campos)
  // ========================================
  "spouseName": "string",             // Nome do cônjuge
  "spouseCpf": "string",              // CPF do cônjuge
  "spouseRg": "string",               // RG do cônjuge
  "spouseBirthDate": "1990-01-01",    // Data de nascimento
  "spousePhone": "string",            // Telefone
  "spouseEmail": "string",            // E-mail
  
  // ========================================
  // ⚪ ESTRANGEIROS (9 campos)
  // ========================================
  "carteiraModelo19": "string",       // Carteira modelo 19
  "registroGeralEstrangeiro": "string", // RGE
  "casadoBrasileiro": true/false,     // Casado com brasileiro
  "nomeConjugeEstrangeiro": "string", // Nome do cônjuge estrangeiro
  "temFilhosBrasileiros": true/false, // Tem filhos brasileiros
  "quantidadeFilhosBrasileiros": 0,   // Quantidade
  "dataChegadaBrasil": "2020-01-01",  // Data de chegada
  "naturalizado": true/false,         // É naturalizado
  "decretoNaturalizacao": "string",   // Decreto
  
  // ========================================
  // ⚪ CONTROLE (5 campos)
  // ========================================
  "terminationDate": "2024-01-01",    // Data de demissão
  "dataRescisao": "2024-01-01",       // Data de rescisão
  "notes": "string",                  // Observações
  "vistoFiscalizacao": "string",      // Visto de fiscalização
  "assinaturaFuncionario": "string",  // Assinatura
  
  // ========================================
  // 🔵 INFORMAÇÕES BANCÁRIAS (DTO)
  // ========================================
  "bankInfo": {
    "bank": "string",                 // Nome do banco
    "agency": "string",               // Agência
    "account": "string",              // Conta
    "accountType": "string"           // Tipo de conta
  },
  
  // ========================================
  // 🔵 INFORMAÇÕES DO TRABALHO (DTO)
  // ========================================
  "jobInfo": {
    "position": "string",             // Cargo
    "function": "string",             // Função
    "unit": "string",                 // Unidade
    "admissionDate": "2024-01-01",    // Data de admissão
    "probationEndDate": "2024-04-01", // Fim do período probatório
    "contractType": "string",         // Tipo de contrato
    "salary": 0.00,                   // Salário
    "status": "string"                // Status
  },
  
  // ========================================
  // 🔵 CONTATO DE EMERGÊNCIA (DTO)
  // ========================================
  "emergencyContact": {
    "name": "string",                 // Nome
    "relationship": "string",         // Parentesco
    "phone": "string"                 // Telefone
  },
  
  // ========================================
  // 🟢 DOCUMENTOS (Lista)
  // ========================================
  "documents": [
    {
      "type": "string",               // Tipo (RG, CPF, CNH, etc)
      "number": "string",             // Número
      "issueDate": "2020-01-01",      // Data de emissão
      "issuingAuthority": "string"    // Órgão emissor
    }
  ],
  
  // ========================================
  // 🟣 RELACIONAMENTOS (IDs)
  // ========================================
  "user": {
    "id": "uuid"                      // ID do usuário do sistema (opcional)
  },
  "position": {
    "id": "uuid"                      // ID do cargo (opcional)
  },
  "unit": {
    "id": "uuid"                      // ID da unidade (opcional)
  },
  "company": {
    "id": "uuid"                      // ID da empresa (opcional)
  }
}
```

---

## 🚀 **COMO USAR**

### **OPÇÃO 1: JSON Mínimo (4 campos)**
```json
{
  "name": "MARIA JOSÉ",
  "cpf": "111.222.333-44",
  "status": "ACTIVE",
  "address": {
    "street": "Rua Teste"
  }
}
```

### **OPÇÃO 2: JSON Recomendado (14 campos)**
```json
{
  "name": "MARIA JOSÉ SANTOS",
  "cpf": "111.222.333-44",
  "rg": "SP9876543",
  "email": "maria@example.com",
  "phone": "(11) 98765-4321",
  "birthDate": "1985-03-15",
  "gender": "F",
  "maritalStatus": "SOLTEIRA",
  "registrationNumber": "EMP001",
  "hireDate": "2024-01-01",
  "status": "ACTIVE",
  "salario": 3500.00,
  "cbo": "4110-10",
  "address": {
    "street": "Avenida Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

### **OPÇÃO 3: JSON Completo (87 campos)**
Use o arquivo: **`POSTMAN_EMPLOYEE_COMPLETO_TODOS_CAMPOS.json`**

---

## 📝 **OBSERVAÇÕES IMPORTANTES**

1. **Campos Obrigatórios:**
   - Apenas 4 campos são obrigatórios
   - Todos os outros são opcionais

2. **IDs Relacionais:**
   - `user.id`, `position.id`, `unit.id`, `company.id` são opcionais
   - Se fornecidos, devem existir no banco

3. **Listas:**
   - `documents`, `benefits`, etc são listas opcionais
   - Podem ser enviadas vazias ou com itens

4. **DTOs Aninhados:**
   - `bankInfo`, `jobInfo`, `emergencyContact` são objetos opcionais
   - Se enviados, todos os campos internos também são opcionais

---

## ✅ **CONCLUSÃO**

Você tem agora:
- ✅ **Análise completa** de todos os 87 campos
- ✅ **JSON completo** com todos os campos preenchidos
- ✅ **Guia de uso** com exemplos
- ✅ **Estrutura detalhada** de cada categoria

**Use o JSON completo como referência e adapte conforme suas necessidades! 🚀**
