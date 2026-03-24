# 📊 Análise Completa: Processamento de Holerites

## 🎯 Visão Geral

O sistema possui **DUAS ABORDAGENS** diferentes para processamento de holerites:

1. **Abordagem Antiga (Síncrona)** - `PayslipService.processPayslipPDF()` - Endpoint `/api/holerites/process`
2. **Abordagem Nova (Assíncrona com Workers)** - Pipeline Redis Streams - Endpoint `/api/document-processing/upload-payslips`

---

## 🔄 ABORDAGEM 1: Processamento Síncrono (PayslipService)

### Endpoint
- **URL**: `POST /api/holerites/process`
- **Controller**: `HoleriteController`
- **Serviço**: `PayslipService.processPayslipPDF()`

### Fluxo de Processamento

```
1. Upload de PDF
   ↓
2. PayslipService.processPayslipPDF()
   ↓
3. ETAPA 1: Ler todas as páginas e identificar CPFs
   - Lê cada página do PDF usando PDFBox
   - Extrai texto de cada página
   - Identifica todos os CPFs usando regex
   - Armazena posição de cada CPF no texto
   ↓
4. ETAPA 2: Identificar Empresa e CNPJ para cada CPF
   - Para cada CPF encontrado, isola seção do texto
   - Inclui 500 caracteres antes do CPF (contexto da empresa)
   - Define limites até próximo CPF ou fim da página
   ↓
5. ETAPA 3: Identificar Setor para cada CPF
   - Setor é extraído da seção isolada do texto
   ↓
6. ETAPA 4: Processar cada holerite individualmente
   - Extrai informações (nome, CPF, período, valores, empresa, CNPJ, setor)
   - Valida CPF extraído corresponde ao esperado
   - Se falhar, tenta OCR com Tesseract
   - Salva na tabela `payslips`
   - Organiza arquivos em pastas: backend/holerites/MM-YYYY/CPF-Nome/
   ↓
7. Retorna lista de holerites processados
```

### Características

✅ **Vantagens:**
- Processamento direto e simples
- Separação clara de holerites por CPF
- Extração de empresa/CNPJ/setor por seção isolada
- Validação de duplicatas por CPF + período

❌ **Limitações:**
- Processamento síncrono (bloqueia requisição)
- Não usa OCR avançado (Gemini)
- Não integra com pipeline de matching holerite ↔ comprovante
- Não salva em `DocumentPage` (tabela intermediária)

### Métodos Principais

1. **`processPayslipPDF(MultipartFile file)`** - Método principal
2. **`detectarTodosCPFsNaPagina(String pageText)`** - Identifica CPFs na página
3. **`extractPayslipInfo(String text, int pageNumber)`** - Extrai dados do holerite
4. **`extractPayslipInfoWithOCR(PDDocument document, int pageNumber)`** - Fallback OCR
5. **`processarHoleriteUnico(...)`** - Salva holerite no banco e organiza arquivos

### Armazenamento

- **Tabela**: `payslips`
- **Campos principais**: `id`, `employee_name`, `cpf`, `month`, `year`, `file_name`, `file_path`, `hash_conteudo`
- **Organização de arquivos**: `backend/holerites/MM-YYYY/CPF-Nome/holerite.pdf`

---

## 🚀 ABORDAGEM 2: Processamento Assíncrono (Pipeline Redis Streams)

### Endpoint
- **URL**: `POST /api/document-processing/upload-payslips`
- **Controller**: `DocumentProcessingController`
- **Serviço**: `DocumentProcessingService.createProcessingJob()`

### Pipeline Completo

```
1. Upload de PDF
   ↓
2. DocumentProcessingService.createProcessingJob()
   - Calcula hash SHA-256 do arquivo
   - Verifica se já foi processado (opcional, desabilitado)
   - Cria job no banco (tabela document_processing_job)
   - Salva arquivo temporariamente
   - Publica mensagem no Redis Stream: stream:jobs
   ↓
3. [SplitterWorker] - Divide PDF em páginas
   - Consome stream:jobs
   - Divide PDF em páginas individuais
   - Converte cada página para PNG (300 DPI)
   - Faz upload para MinIO/S3
   - Publica em stream:pages
   ↓
4. [OcrWorker] - OCR com Gemini Vision
   - Consome stream:pages (múltiplos workers em paralelo)
   - Baixa imagem do MinIO/S3
   - Chama Gemini Vision API para OCR
   - Fallback para Tesseract se Gemini falhar
   - Calcula hash MD5 da página
   - Salva DocumentPage no banco
   - Publica em stream:parsed
   ↓
5. [ParserWorker] - Validação e normalização
   - Consome stream:parsed
   - Valida CPF (dígitos verificadores)
   - Valida valores (>= 0)
   - Valida nomes (mínimo 2 palavras)
   - Detecta duplicados por hash MD5
   - Normaliza dados
   - Publica em stream:validated
   ↓
6. [MatcherWorker] - Matching holerite ↔ comprovante
   - Consome stream:validated
   - Implementa algoritmo de matching (5 regras):
     * Regra A: CPF + Valor + Período (match perfeito)
     * Regra B: CPF + Período + Similaridade nome >= 0.92
     * Regra C: Valor + Período + Similaridade nome >= 0.92
     * Regra D: Similaridade >= 0.80 e < 0.92 (ambíguo)
     * Regra E: Sem match (revisão manual)
   - Publica matches em stream:matched
   - Publica itens ambíguos em stream:review
   ↓
7. [PdfMergeWorker] - Gera PDF unificado
   - Consome stream:matched
   - Cria Payslip e PaymentReceipt
   - Gera PDF unificado (holerite + comprovante)
   - Faz upload para MinIO/S3
   - Publica em stream:merged
   ↓
8. [UnmatchedPayslipWorker] - Processa holerites sem match
   - Consome stream:validated
   - Processa holerites e comprovantes sem match
   - Salva individualmente na tabela payslips/payment_receipts
   - Gera PDF físico na pasta backend/holerites/
   ↓
9. [IndexerWorker] - Indexação final
   - Consome stream:merged
   - Cria UnifiedDocument
   - Cacheia URLs no Redis
   - Finaliza processamento
```

### Características

✅ **Vantagens:**
- Processamento assíncrono (não bloqueia API)
- OCR avançado com Gemini Vision
- Pipeline escalável (múltiplos workers)
- Matching automático holerite ↔ comprovante
- Validações robustas
- Detecção de duplicatas por hash
- Rate limiting (10 chamadas simultâneas ao Gemini)

❌ **Limitações:**
- Mais complexo (múltiplos workers)
- Requer Redis funcionando
- Requer MinIO/S3 configurado
- Requer Gemini API Key configurada

### Tabelas Utilizadas

1. **`document_processing_job`** - Jobs de processamento
2. **`document_page`** - Páginas processadas (intermediária)
3. **`payslips`** - Holerites finais
4. **`payment_receipts`** - Comprovantes finais
5. **`unified_document`** - Documentos unificados (holerite + comprovante)

### Redis Streams Utilizados

- `stream:jobs` - Jobs para processar
- `stream:pages` - Páginas divididas
- `stream:parsed` - Páginas com OCR
- `stream:validated` - Páginas validadas
- `stream:matched` - Matches encontrados
- `stream:review` - Itens para revisão
- `stream:merged` - PDFs unificados

---

## 📋 Comparação das Abordagens

| Aspecto | Abordagem 1 (Síncrona) | Abordagem 2 (Assíncrona) |
|---------|------------------------|--------------------------|
| **Endpoint** | `/api/holerites/process` | `/api/document-processing/upload-payslips` |
| **Processamento** | Síncrono (bloqueia) | Assíncrono (não bloqueia) |
| **OCR** | Tesseract (fallback) | Gemini Vision (principal) + Tesseract (fallback) |
| **Separação de CPFs** | ✅ Sim (por seção de texto) | ✅ Sim (por página) |
| **Matching** | ❌ Não | ✅ Sim (5 regras) |
| **Validações** | Básicas | Robustas (CPF, valores, nomes) |
| **Duplicatas** | Por CPF + período | Por hash MD5 |
| **Escalabilidade** | Baixa | Alta (workers paralelos) |
| **Complexidade** | Baixa | Alta |
| **Dependências** | PDFBox, Tesseract | Redis, MinIO/S3, Gemini API |

---

## 🔍 Detalhamento Técnico

### Extração de Dados (PayslipService)

#### Padrões Regex Utilizados

1. **CPF**: `CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2}|[0-9]{11})`
2. **Nome**: Múltiplos padrões para capturar nome do funcionário
3. **Período**: `(\\d{2}/\\d{4})` - formato MM/YYYY
4. **Valor Líquido**: `(?:R\\$|valor|líquido)[:\\s]*(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?)`
5. **CNPJ**: `(\\d{2}\\.?\\d{3}\\.?\\d{3}/?\\d{4}-?\\d{2})`
6. **Empresa**: Busca por contexto antes do CPF

#### Processo de Separação de Holerites

1. **Identificação de CPFs**: Varre toda a página procurando CPFs
2. **Isolamento de Seções**: Para cada CPF, extrai seção do texto:
   - Início: 500 caracteres antes do CPF (para pegar dados da empresa)
   - Fim: Próximo CPF ou fim da página
3. **Extração Individual**: Processa cada seção isoladamente
4. **Validação**: Verifica se CPF extraído corresponde ao esperado

### OCR com Gemini Vision (OcrWorker)

#### Fluxo de OCR

1. **Tentativa Principal**: Chama Gemini Vision API
   - Envia imagem da página
   - Recebe JSON estruturado com dados extraídos
   - Confiança >= 0.5 é considerada válida

2. **Fallback**: Se Gemini falhar ou confiança < 0.5
   - Usa Tesseract OCR
   - Aplica regex para extrair dados

3. **Normalização**: 
   - Remove caracteres especiais
   - Normaliza CPF (apenas dígitos)
   - Normaliza nomes (remove acentos, uppercase)

### Validações (ParserWorker)

1. **CPF**: Valida dígitos verificadores
2. **Valores**: Verifica se >= 0
3. **Nomes**: Mínimo 2 palavras, não pode ser "Desconhecido"
4. **Duplicatas**: Compara hash MD5 da página

### Matching (MatcherWorker)

#### Algoritmo de Matching

1. **Regra A - Match Perfeito**:
   - CPF igual + Valor igual + Período igual
   - → Match automático

2. **Regra B - Match Confiável**:
   - CPF igual + Período igual + Similaridade nome >= 0.92
   - → Match automático

3. **Regra C - Match por Valor**:
   - Valor igual + Período igual + Similaridade nome >= 0.92
   - Comprovante sem CPF
   - → Match automático

4. **Regra D - Match Ambíguo**:
   - Similaridade >= 0.80 e < 0.92
   - → Marca para revisão manual

5. **Regra E - Sem Match**:
   - Nenhum comprovante encontrado
   - → Marca para revisão manual

#### Similaridade de Nomes

- Usa algoritmo **Jaro-Winkler**
- Considera nomes similares mesmo com abreviações
- Exemplo: "JOSE C A ALVES" ≈ "JOSE CARLOS ALVES"

---

## 📊 Estrutura de Dados

### Tabela: `payslips`

```sql
CREATE TABLE payslips (
    id UUID PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    hash_conteudo VARCHAR(64), -- SHA-256 do arquivo completo
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- Campos adicionais (empresa, CNPJ, setor, valores, etc.)
);
```

### Tabela: `document_page`

```sql
CREATE TABLE document_page (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL,
    page_index INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'HOLERITE' ou 'COMPROVANTE'
    status VARCHAR(20) NOT NULL, -- 'OK', 'REVIEW', 'ERROR'
    cpf VARCHAR(11),
    name VARCHAR(255),
    period VARCHAR(7), -- 'MM/YYYY'
    value DECIMAL(10,2),
    hash_md5 VARCHAR(32), -- Hash MD5 da página
    s3_url VARCHAR(500),
    raw_text TEXT,
    extracted_data JSONB,
    created_at TIMESTAMP
);
```

### Tabela: `document_processing_job`

```sql
CREATE TABLE document_processing_job (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_hash VARCHAR(64), -- SHA-256
    status VARCHAR(20) NOT NULL, -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'
    document_type VARCHAR(20) NOT NULL, -- 'HOLERITE' ou 'COMPROVANTE'
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔧 Configurações Necessárias

### Para Abordagem 1 (Síncrona)
- ✅ PDFBox (já incluído)
- ✅ Tesseract OCR (opcional, para fallback)

### Para Abordagem 2 (Assíncrona)
- ✅ Redis (obrigatório)
- ✅ MinIO/S3 (obrigatório)
- ✅ Gemini API Key (obrigatório)
- ✅ Tesseract OCR (fallback)

---

## 📝 Logs e Monitoramento

### Logs Principais

#### PayslipService (Abordagem 1)
```
📄 PDF contém X página(s)
🔍 ETAPA 1: LENDO TODAS AS PÁGINAS E IDENTIFICANDO CPFs
📖 Lendo página X/Y
   ✅ N CPF(s) encontrado(s) na página X: [...]
🔍 ETAPA 2: IDENTIFICANDO EMPRESA E CNPJ PARA CADA CPF
🔍 ETAPA 3: IDENTIFICANDO SETOR PARA CADA CPF
🔍 ETAPA 4: PROCESSANDO CADA HOLERITE COM SEPARAÇÃO
📄 Processando holerite - CPF: ... (página X)
✅ Página X processada com sucesso
🎉 Processamento concluído. X holerite(s) processado(s)
```

#### Workers (Abordagem 2)
```
🟢 SplitterWorker: Processando job ...
🟡 OcrWorker: Processando OCR para página X
🟢 ParserWorker: Página X publicada no stream:validated
🟢 MatcherWorker: Processando matching para job ...
🟡 UnmatchedPayslipWorker: Processando HOLERITE - ID: ...
```

---

## ⚠️ Problemas Conhecidos

### Abordagem 1
1. **Processamento lento**: Síncrono, bloqueia requisição
2. **OCR limitado**: Apenas Tesseract (menos preciso)
3. **Sem matching**: Não integra com comprovantes

### Abordagem 2
1. **Complexidade**: Múltiplos workers, mais difícil de debugar
2. **Dependências**: Requer Redis, MinIO/S3, Gemini API
3. **Possível perda de dados**: Se algum worker falhar silenciosamente

---

## 🎯 Recomendações

1. **Usar Abordagem 2** para produção (mais robusta e escalável)
2. **Manter Abordagem 1** para casos simples ou fallback
3. **Monitorar logs** de todos os workers
4. **Verificar Redis Streams** periodicamente para mensagens não processadas
5. **Validar hash de arquivos** para evitar reprocessamento

---

## 📚 Arquivos Relacionados

### Backend
- `HoleriteController.java` - Endpoint antigo (síncrono)
- `DocumentProcessingController.java` - Endpoint novo (assíncrono)
- `PayslipService.java` - Lógica de processamento síncrono
- `DocumentProcessingService.java` - Criação de jobs
- `OcrWorker.java` - Worker de OCR
- `ParserWorker.java` - Worker de validação
- `MatcherWorker.java` - Worker de matching
- `UnmatchedPayslipWorker.java` - Worker de holerites sem match
- `SplitterWorker.java` - Worker de divisão de PDF
- `PdfMergeWorker.java` - Worker de merge de PDFs
- `IndexerWorker.java` - Worker de indexação

### Frontend
- `Holerites.tsx` - Página de holerites (vazia atualmente)
- `HoleriteUpload.tsx` - Componente de upload
- `documentProcessingService.ts` - Serviço de processamento

### Documentação
- `NOVA_ABORDAGEM_PROCESSAMENTO.md` - Documentação da abordagem nova
- `docs/PROCESSAMENTO_HOLERITES.md` - Documentação geral
- `IMPLEMENTACAO_WORKERS_COMPLETA.md` - Documentação dos workers
- `ANALISE_COMPLETA_PRD_HOLERITES.md` - Análise completa do PRD







