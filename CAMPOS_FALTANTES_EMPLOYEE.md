# Campos Faltantes no Modelo Employee

## Comparação com a Relação de Cadastro de Funcionário

### ✅ Campos que JÁ EXISTEM:
- Nome Completo (`name`)
- Data de Nascimento (`birthDate`)
- Naturalidade (`localNascimento`)
- Estado Civil (`maritalStatus`)
- Nome do Cônjuge (`spouseName`)
- Telefone (`phone`)
- Grau de Instrução (`grauInstrucao`)
- CTPS - Número, Série, Data Emissão, Órgão Emissor
- Título de Eleitor - Número, Zona, Seção
- RG - Órgão Emissor, Data Emissão
- CPF (`document`)
- PIS (`pis`)
- Reservista (`certificadoMilitar`)
- Data de Admissão (`hireDate`)
- Salário (`salario`)
- Forma de Pagamento (`periodoPagamento`)
- Horário de Trabalho (`horarioTrabalho`)
- Prazo de Experiência (`probationEndDate`)
- Folga Semanal (`folgaSemanal`)
- Nome da Mãe (`nomeMae`)
- Nome do Pai (`nomePai`)
- Dependentes (relacionamento `dependents`)
- Empresa CNPJ (`empresaCnpj`)

---

## ❌ CAMPOS FALTANTES:

### **I. Dados da Empresa Contratante**
✅ CNPJ - JÁ EXISTE (`empresaCnpj`)

### **II. Dados Pessoais do Funcionário**

#### Endereço Completo:
- ❌ **Número do Endereço** - Campo separado para número
- ❌ **Complemento do Endereço** - Campo para complemento (apto, bloco, etc)
- ❌ **CEP** - Campo comentado no código, precisa ser ativado
- ❌ **Cidade** - Campo separado para cidade
- ❌ **UF (Estado)** - Campo separado para estado/UF
- ❌ **UF da Naturalidade** - Campo separado para UF do local de nascimento
- ❌ **Sexo** - Campo para sexo (M/F/Outro)
- ❌ **Deficiência** - Campo para tipo de deficiência:
  - Física
  - Auditiva
  - Visual
  - Reabilitado
  - Nenhuma

### **III. Dados de Documentos**

#### Carteira Profissional (CTPS):
- ❌ **CTPS - UF** - UF do órgão emissor da CTPS

#### Título de Eleitor:
- ❌ **Título de Eleitor - Data de Expedição**
- ❌ **Título de Eleitor - Validade**

#### Registro Geral (RG):
- ❌ **RG - Número** - Campo separado para número do RG (atualmente só tem órgão emissor e data)

#### Outros:
- ❌ **Nome do Conselho Regional** - Campo para conselho profissional (CRM, OAB, etc)

### **IV. Dados do Cadastro / Admissão**

- ❌ **Dias de Trabalho** - Campo para padrão de trabalho (ex: "12X36", "5X2", etc)
- ❌ **Intervalo de Trabalho** - Campo separado para intervalo (ex: "23:00 ÀS 00:00 H")
- ❌ **Prorrogação de Experiência** - Campo para prorrogação do prazo de experiência
- ❌ **Dias de Folga Detalhado** - Campo mais detalhado para folgas (ex: "1ª Escola")

### **V. Dados do Exame Médico (ASO)**

- ❌ **Data do Exame Médico (ASO)**
- ❌ **Tipo de Exames Realizados** - Campo para tipo (ADMISSIONAL, PERIÓDICO, etc)
- ❌ **Nome do Médico**
- ❌ **CRM Número**
- ❌ **CRM Estado**
- ❌ **Horário do Exame**
- ❌ **Intervalos Almoço/Janta** - Campo boolean para indicar se tem intervalo
- ❌ **Observações do Exame**
- ❌ **Primeiro Emprego** - Campo boolean para indicar se é o primeiro registro
- ❌ **Contribuição Sindical Paga** - Campo boolean para indicar se está paga

### **VI. Para Estrangeiro**

- ❌ **RNE Número** - Registro Nacional de Estrangeiro
- ❌ **RNE Validade** - Data de validade do RNE
- ❌ **RIC Número** - Registro de Identidade Civil (para naturalizados)
- ❌ **RIC Órgão Emissor** - Órgão que emitiu o RIC
- ❌ **RIC Data Emissão** - Data de emissão do RIC
- ❌ **Tipo de Visto** - Tipo de visto do estrangeiro

---

## 📋 RESUMO DOS CAMPOS FALTANTES:

### Total: **28 campos faltantes**

1. Número do Endereço
2. Complemento do Endereço
3. CEP
4. Cidade
5. UF (Estado)
6. UF da Naturalidade
7. Sexo
8. Deficiência (tipo)
9. CTPS - UF
10. Título de Eleitor - Data de Expedição
11. Título de Eleitor - Validade
12. RG - Número
13. Nome do Conselho Regional
14. Dias de Trabalho (padrão)
15. Intervalo de Trabalho
16. Prorrogação de Experiência
17. Data do Exame Médico (ASO)
18. Tipo de Exames Realizados
19. Nome do Médico
20. CRM Número
21. CRM Estado
22. Horário do Exame
23. Intervalos Almoço/Janta
24. Observações do Exame
25. Primeiro Emprego
26. Contribuição Sindical Paga
27. RNE Número
28. RNE Validade
29. RIC Número
30. RIC Órgão Emissor
31. RIC Data Emissão
32. Tipo de Visto

---

## 💡 SUGESTÕES DE IMPLEMENTAÇÃO:

### Campos de Endereço:
Sugestão: Criar uma entidade separada `Address` ou adicionar campos:
- `addressNumber` (String)
- `addressComplement` (String)
- `cep` (String)
- `city` (String)
- `state` (String) - UF

### Campos de Documentos Médicos:
Sugestão: Criar uma entidade separada `MedicalExam` (ASO) com relacionamento OneToMany:
- `examDate` (LocalDate)
- `examType` (String/Enum)
- `doctorName` (String)
- `crmNumber` (String)
- `crmState` (String)
- `examTime` (String)
- `hasLunchBreak` (Boolean)
- `observations` (String)
- `isFirstJob` (Boolean)
- `unionContributionPaid` (Boolean)

### Campos de Estrangeiro:
Sugestão: Adicionar campos ao Employee:
- `rneNumber` (String)
- `rneValidity` (LocalDate)
- `ricNumber` (String)
- `ricIssuingAgency` (String)
- `ricIssueDate` (LocalDate)
- `visaType` (String)

