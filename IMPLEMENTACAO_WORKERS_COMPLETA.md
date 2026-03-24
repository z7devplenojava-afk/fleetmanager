# ✅ Implementação dos Workers - Redis Streams Pipeline

## 🎯 Status da Implementação

### ✅ **Workers Implementados**

1. **SplitterWorker** ✅
   - Divide PDFs em páginas individuais
   - Converte páginas para PNG (300 DPI)
   - Faz upload para MinIO/S3
   - Publica páginas em `stream:pages`
   - Atualiza progresso do job

2. **OcrWorker** ✅
   - Consome `stream:pages`
   - Processa OCR com Gemini Vision API
   - Calcula hash MD5 das páginas
   - Normaliza dados extraídos
   - Salva `DocumentPage` no banco
   - Publica em `stream:parsed`
   - Rate limiting com Semaphore (10 simultâneos)

3. **ParserWorker** ✅
   - Consome `stream:parsed`
   - Valida CPF (dígitos verificadores)
   - Valida valores e nomes
   - Detecta duplicados por hash
   - Normaliza dados
   - Publica em `stream:validated`

4. **MatcherWorker** ✅
   - Consome `stream:validated`
   - Implementa algoritmo de matching conforme PRD:
     - **Regra A:** CPF + Valor + Período (match perfeito)
     - **Regra B:** CPF + Período + Similaridade de nome (>= 0.92)
     - **Regra C:** Valor + Período + Similaridade de nome (>= 0.92)
     - **Regra D:** Similaridade >= 0.80 e < 0.92 (marca como ambíguo)
     - **Regra E:** Nenhum match (marca para revisão)
   - Usa Jaro-Winkler para similaridade de nomes
   - Publica matches em `stream:matched`
   - Publica itens ambíguos em `stream:review`

---

## 📊 Pipeline Completo

```
UPLOAD PDF
    ↓
DocumentProcessingService.createProcessingJob()
    ↓
Redis Stream: stream:jobs
    ↓
[SplitterWorker] - Divide PDF em páginas
    ↓
Redis Stream: stream:pages
    ↓
[OcrWorker] - OCR com Gemini Vision
    ↓
Redis Stream: stream:parsed
    ↓
[ParserWorker] - Validação e normalização
    ↓
Redis Stream: stream:validated
    ↓
[MatcherWorker] - Matching holerite ↔ comprovante
    ↓
Redis Stream: stream:matched (matches encontrados)
Redis Stream: stream:review (itens ambíguos/sem match)
```

---

## 🔧 Configuração Necessária

### 1. **Redis**
```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
```

### 2. **Gemini API**
```properties
gemini.api.key=sua_chave_aqui
gemini.api.enabled=true
gemini.api.url=https://generativelanguage.googleapis.com/v1beta
```

### 3. **MinIO (Opcional)**
```properties
minio.enabled=false  # Se false, usa armazenamento local
minio.url=http://localhost:9000
minio.access-key=minioadmin
minio.secret-key=minioadmin
```

---

## 🚀 Como Funciona

### **1. Upload de PDF**
```bash
POST /api/v1/document-processing/upload
Content-Type: multipart/form-data
file: arquivo.pdf
```

**Resposta:**
```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "Arquivo enfileirado para processamento"
}
```

### **2. Consultar Status**
```bash
GET /api/v1/document-processing/job/{jobId}
```

**Resposta:**
```json
{
  "jobId": "uuid",
  "status": "processing",
  "progressPercentage": 45,
  "totalPages": 100,
  "processedPages": 45
}
```

### **3. Processamento Automático**

Os workers processam automaticamente em background:
- **SplitterWorker:** A cada 1 segundo
- **OcrWorker:** A cada 500ms
- **ParserWorker:** A cada 500ms
- **MatcherWorker:** A cada 2 segundos

---

## 📝 Próximos Passos

### ⏳ **Pendentes:**

1. **PdfMergeWorker** - Gerar PDFs unificados
   - Consome `stream:matched`
   - Cria Payslip e PaymentReceipt a partir de DocumentPage
   - Gera PDF unificado (holerite + comprovante)
   - Salva em MinIO/S3
   - Cria UnifiedDocument no banco

2. **IndexerWorker** - Indexação final
   - Consome `stream:matched`
   - Atualiza índices
   - Cacheia metadados no Redis
   - Gera signed URLs

3. **Testes Unitários**
   - Testes para cada worker
   - Testes de integração do pipeline
   - Testes de matching

4. **Painel de Revisão**
   - Endpoint para listar itens em `stream:review`
   - Interface para aprovar/rejeitar matches ambíguos

---

## 🐛 Troubleshooting

### **Workers não processam**
- Verifique se Redis está rodando
- Verifique logs para erros
- Verifique se consumer groups foram criados

### **OCR falha**
- Verifique chave do Gemini API
- Verifique se `gemini.api.enabled=true`
- O sistema usa fallback automático se Gemini falhar

### **Matching não funciona**
- Verifique se dados foram extraídos corretamente
- Verifique logs do MatcherWorker
- Itens ambíguos vão para `stream:review`

---

## 📊 Métricas e Monitoramento

### **Logs Importantes:**
- `SplitterWorker`: Logs de progresso de divisão de PDFs
- `OcrWorker`: Logs de confiança do OCR
- `ParserWorker`: Logs de validação
- `MatcherWorker`: Logs de matches encontrados

### **Streams Redis:**
- `stream:jobs` - Jobs de processamento
- `stream:pages` - Páginas extraídas
- `stream:parsed` - Páginas com OCR
- `stream:validated` - Páginas validadas
- `stream:matched` - Matches encontrados
- `stream:review` - Itens para revisão

---

**Data:** 2025-01-XX  
**Versão:** 1.0  
**Status:** ✅ Workers principais implementados

