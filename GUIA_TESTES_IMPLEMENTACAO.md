# 🧪 Guia de Testes - Implementação Redis Streams + Gemini Vision

## 📋 Como Executar os Testes

### **1. Testes Unitários**

```bash
cd backend
mvn test
```

### **2. Testes Específicos**

```bash
# Testar apenas DocumentProcessingService
mvn test -Dtest=DocumentProcessingServiceTest

# Testar apenas Workers
mvn test -Dtest=*WorkerTest

# Testar apenas Serviços
mvn test -Dtest=*ServiceTest
```

### **3. Testes de Integração**

```bash
# Testar pipeline completo
mvn test -Dtest=DocumentProcessingPipelineIntegrationTest
```

---

## 🧪 Testes Implementados

### **1. DocumentProcessingServiceTest**
- ✅ `testCreateProcessingJob_Success` - Cria job com sucesso
- ✅ `testGetJob_Exists` - Busca job existente
- ✅ `testGetJob_NotExists` - Job não encontrado

### **2. SplitterWorkerTest**
- ✅ `testInit_CreatesConsumerGroup` - Inicialização do worker

### **3. OcrWorkerTest**
- ✅ `testInit_CreatesConsumerGroup` - Inicialização do worker
- ✅ `testOcrResponse_ValidData` - Validação de dados OCR

### **4. MatcherWorkerTest**
- ✅ `testInit_CreatesConsumerGroup` - Inicialização do worker
- ✅ `testMatchHoleriteWithComprovante_PerfectMatch` - Match perfeito
- ✅ `testMatchHoleriteWithComprovante_NoMatch` - Sem match

### **5. GeminiOcrServiceTest**
- ✅ `testExtractTextFromImage_Disabled` - Serviço desabilitado
- ✅ `testExtractTextFromImage_EmptyResponse` - Resposta vazia

### **6. MinIOServiceTest**
- ✅ `testUploadPage_Disabled` - Upload com MinIO desabilitado
- ✅ `testDownloadBytes_Disabled` - Download com MinIO desabilitado
- ✅ `testUploadUnifiedPdf_Disabled` - Upload PDF com MinIO desabilitado

### **7. DocumentProcessingPipelineIntegrationTest**
- ✅ `testCreateProcessingJob` - Criação de job
- ✅ `testJobExistsInDatabase` - Job no banco
- ✅ `testJobEnqueuedInRedis` - Job enfileirado

---

## 🔍 Como Testar Manualmente

### **1. Via Swagger UI**

1. Acesse: `http://localhost:8083/swagger-ui.html`
2. Encontre: `Document Processing` → `POST /api/v1/document-processing/upload`
3. Clique em "Try it out"
4. Selecione um arquivo PDF
5. Execute

### **2. Via cURL**

```bash
# Upload
curl -X POST "http://localhost:8083/api/v1/document-processing/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@/caminho/para/arquivo.pdf"

# Status
curl "http://localhost:8083/api/v1/document-processing/job/{jobId}" \
  -H "Authorization: Bearer {token}"

# Download
curl "http://localhost:8083/api/v1/document-processing/download/{unifiedDocumentId}" \
  -H "Authorization: Bearer {token}"
```

### **3. Verificar Logs**

Os workers logam todas as operações:
- `SplitterWorker` - Logs de divisão de PDFs
- `OcrWorker` - Logs de OCR e confiança
- `ParserWorker` - Logs de validação
- `MatcherWorker` - Logs de matches encontrados
- `PdfMergeWorker` - Logs de PDFs gerados
- `IndexerWorker` - Logs de indexação

---

## ✅ Checklist de Testes

- [x] Testes unitários compilando
- [x] Testes de integração básicos
- [x] Swagger documentado
- [x] Endpoints funcionais
- [x] Workers processando

---

**Pronto para testes em ambiente de desenvolvimento!**

