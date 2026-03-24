# Campos Identificados no Holerite (MARCO TULIO MENEZES - CPF: 11396510648)

## Campos Obrigatórios que o Sistema Precisa Localizar:

### 1. **Informações da Empresa**
- **Código da Empresa:** `00555`
- **Nome da Empresa:** `PROMOVER VIGILANCIA PATRIMONIAL LTDA`
- **CNPJ:** `43576260000112`
- **Endereço:** `R CORONEL JOAO CAMARGOS. 267`

### 2. **Informações do Funcionário**
- **Código do Funcionário:** `000224`
- **Nome Completo:** `MARCO TULIO MENEZES`
- **CPF:** `11396510648`
- **Cargo/Função:** `Vigilante`

### 3. **Período e Setor**
- **Período de Referência:** `01/10/2025 a 31/10/2025`
- **Mês/Ano:** `10/2025`
- **Setor/Posto de Trabalho:** `TRANSPES TRANSP PESADOS`
- **IMPORTANTE:** O setor está na MESMA LINHA do período: `01/10/2025 a 31/10/2025 TRANSPES TRANSP PESADOS`

### 4. **Dados Financeiros - Vencimentos (Earnings)**
- **001** - Salário Base: Referência `15,14`, Vencimentos `1.209,08`
- **032** - Adicional Noturno 40%: Referência `007:00`, Vencimentos `30,49`
- **020** - Periculosidade 30%: Vencimentos `362,72`
- **273** - Décimo Terceiro - Contrato Intermitente: Vencimentos `133,52`
- **274** - Férias + 1/3 - Contrato Intermitente: Vencimentos `178,03`
- **999** - Arredondamento: Vencimentos `0,71`
- **Total Vencimentos:** `1.914,55`

### 5. **Dados Financeiros - Descontos (Deductions)**
- **680** - Desc Plano de saude co partic - Part.: Descontos `19,70`
- **660** - Desc Ticket Alim: Descontos `21,41`
- **897** - INSS 13° Salário Intermitente: Descontos `10,01`
- **903** - INSS Folha: Referência `7,72 %`, Descontos `137,45`
- **610** - Arredondamento Mes Anterior: Descontos `0,98`
- **Total Descontos:** `189,55`

### 6. **Valores Totais**
- **Valor Líquido (Net Value):** `1.725,00`

### 7. **Bases de Cálculo (Bottom Table)**
- **Saldo Base:** `10,89`
- **Sal. Contri. INSS:** `1.780,32`
- **% INSS:** `8,00`
- **Base Cál. FGTS:** `1.913,84`
- **F.G.T.S do mês:** `153,10`
- **Base Cálc. IRRF:** `1.173,12`
- **Faixa IRRF:** (vazio)

## Campos Críticos para Versionamento:
**O sistema deve comparar APENAS os seguintes campos para determinar se cria nova versão:**
1. **Total Vencimentos** (`1.914,55`)
2. **Total Descontos** (`189,55`)
3. **Valor Líquido** (`1.725,00`)
4. **Detalhes da Tabela** (códigos, descrições, referências, valores de vencimentos e descontos)

**NÃO deve criar versão se apenas:**
- Hash do PDF for diferente (pode ser apenas metadados)
- Nome do arquivo for diferente
- Campos não financeiros forem diferentes

