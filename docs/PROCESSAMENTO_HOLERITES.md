# Processamento de Holerites - Armazenamento de Dados Extraídos

## Visão Geral

O sistema de processamento de holerites foi implementado para extrair automaticamente dados dos PDFs de holerites e armazená-los em duas tabelas principais:

1. **`payslips`** - Tabela principal com metadados dos holerites
2. **`tb_extract_data_holerites`** - Tabela específica para dados extraídos

## Fluxo de Processamento

### 1. Upload e Processamento
```
PDF Upload → Extração de Dados → Armazenamento → Organização de Arquivos
```

### 2. Extração de Dados
O sistema extrai automaticamente:
- **Nome do funcionário**
- **CPF** (ou código do funcionário como fallback)
- **Mês de referência**
- **Ano de referência**

### 3. Armazenamento Duplo

#### Tabela `payslips`
```sql
CREATE TABLE payslips (
    id UUID PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    month VARCHAR(50) NOT NULL,
    year VARCHAR(4) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL
);
```

#### Tabela `tb_extract_data_holerites`
```sql
CREATE TABLE tb_extract_data_holerites (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    codigo VARCHAR(50),
    mes_referencia VARCHAR(7) NOT NULL,
    ano_referencia INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementação Técnica

### Serviços Principais

#### 1. PayslipService
- **Método**: `processPayslipPDF(MultipartFile file)`
- **Responsabilidade**: Processamento principal do PDF
- **Chamadas**:
  - `salvarDadosExtraidos(payslip)` - Salva na tabela de dados extraídos
  - `payslipRepository.save(payslip)` - Salva na tabela principal

#### 2. ExtractDataHoleritesService
- **Método**: `saveExtractData(String nome, String cpf, String codigo, String mesReferencia, Integer anoReferencia)`
- **Responsabilidade**: Gerenciamento específico dos dados extraídos
- **Funcionalidades**:
  - Verifica duplicatas por CPF e período
  - Atualiza registros existentes
  - Cria novos registros

### Endpoints Disponíveis

#### Processamento
- `POST /api/payslips/upload` - Upload e processamento simples
- `POST /api/payslips/upload-and-send` - Upload + processamento + envio
- `POST /api/payslips/upload-and-send-async` - Processamento assíncrono

#### Consulta de Dados
- `GET /api/payslips/extracted-data` - Dados extraídos + holerites
- `GET /api/extract-data-holerites` - Apenas dados extraídos
- `GET /api/extract-data-holerites/cpf/{cpf}` - Por CPF
- `GET /api/extract-data-holerites/period/{mes}/{ano}` - Por período

## Estratégia de Extração

### 1. PDFBox (Primeira Tentativa)
- Extração de texto nativo do PDF
- Regex patterns para identificar dados
- Padrões robustos para diferentes formatos

### 2. OCR (Fallback)
- Conversão de página para imagem
- Processamento com Tesseract
- Aplicação dos mesmos patterns de extração

### 3. Padrões de Regex
```java
// CPF - múltiplos formatos
Pattern cpfPattern = Pattern.compile("\\b\\d{3}[.\\s]?\\d{3}[.\\s]?\\d{3}[\\-\\s]?\\d{2}\\b");

// Nome - com acentos
Pattern nomePattern = Pattern.compile("(?i)(?:nome|funcionário|empregado)[:\\s]+([A-ZÀ-Úa-zà-ú\\s]+?)(?:\\n|\\r|CPF|\\d{3})");

// Mês e Ano
Pattern mesPattern = Pattern.compile("(?i)(?:m[eê]s|período)[:\\s]+([A-Za-zÀ-ú]+)");
Pattern anoPattern = Pattern.compile("(?i)(?:ano|exercício)[:\\s]+(\\d{4})");
```

## Validações e Tratamento de Erros

### 1. Validação de Dados
- Nome não pode ser "Desconhecido"
- CPF ou código deve estar presente
- Mês e ano devem ser válidos

### 2. Tratamento de Duplicatas
- Verifica existência por CPF + período
- Atualiza registros existentes
- Evita duplicação de dados

### 3. Fallback para Código
- Se CPF não for encontrado, usa código do funcionário
- Prefixo "COD" para identificar códigos
- Mantém compatibilidade com diferentes formatos

## Organização de Arquivos

### Estrutura de Pastas
```
backend/holerites/
├── MM-YYYY/
│   ├── CPF-Nome_Funcionario/
│   │   └── holerite.pdf
│   └── COD123456-Nome_Funcionario/
│       └── holerite.pdf
```

### Nomenclatura
- **Pasta mês-ano**: `01-2025`, `02-2025`, etc.
- **Pasta funcionário**: `12345678901-Joao_Silva` ou `COD123456-Joao_Silva`
- **Arquivo**: `holerite.pdf`

## Logs e Monitoramento

### Logs Principais
```
✅ Página 1 processada com sucesso: João Silva - CPF: 12345678901 - Caminho: backend/holerites/01-2025/12345678901-Joao_Silva/holerite.pdf
💾 Dados extraídos salvos na tabela tb_extract_data_holerites: João Silva - CPF: 12345678901 - Período: 01/2025
🎉 Processamento concluído. 15 holerites processados com sucesso
```

### Tratamento de Erros
- Erros na tabela de dados extraídos não interrompem o processamento
- Logs detalhados para debug
- Validação de dados antes do salvamento

## Teste e Verificação

### Script de Teste
Execute o script `test-holerite-processing.ps1` para verificar:
- Status do backend
- Dados extraídos existentes
- Funcionamento dos endpoints
- Estrutura das tabelas

### Verificação Manual
```bash
# Verificar dados extraídos
curl http://localhost:8080/api/payslips/extracted-data

# Verificar dados específicos
curl http://localhost:8080/api/extract-data-holerites

# Verificar por CPF
curl http://localhost:8080/api/extract-data-holerites/cpf/12345678901
```

## Benefícios da Implementação

### 1. Duplo Armazenamento
- **Tabela principal**: Metadados e referências de arquivos
- **Tabela extraída**: Dados estruturados para consultas

### 2. Flexibilidade
- Suporte a CPF e códigos de funcionário
- Múltiplos formatos de PDF
- Processamento com e sem OCR

### 3. Rastreabilidade
- Logs detalhados
- Timestamps de processamento
- Histórico de extrações

### 4. Performance
- Processamento página por página
- Verificação de duplicatas
- Organização eficiente de arquivos

## Próximos Passos

1. **Dashboard de Dados Extraídos**
   - Interface para visualizar dados extraídos
   - Filtros por período, funcionário, etc.

2. **Relatórios**
   - Relatórios baseados nos dados extraídos
   - Exportação de dados estruturados

3. **Validação Avançada**
   - Validação de CPF
   - Verificação de consistência de dados
   - Alertas para dados inconsistentes

4. **Integração com RH**
   - Sincronização com cadastro de funcionários
   - Atualização automática de dados 