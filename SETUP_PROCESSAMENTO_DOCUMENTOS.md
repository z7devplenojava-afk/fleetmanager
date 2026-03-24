# 🚀 Setup para Processamento de Documentos

## 📋 Serviços Necessários

Para o processamento de documentos funcionar, você precisa dos seguintes serviços:

### ✅ **OBRIGATÓRIOS:**

1. **PostgreSQL** - Banco de dados principal
2. **Redis** - Fila de processamento (Redis Streams)

### ⚠️ **OPCIONAIS:**

3. **MinIO** - Armazenamento S3-compatible (se não usar, o sistema salva localmente)

---

## 🐳 Iniciar Serviços com Docker

### **Opção 1: Usar docker-compose.dev.yml (Recomendado)**

```bash
# Na raiz do projeto
docker-compose -f docker-compose.dev.yml up -d
```

Isso iniciará:
- ✅ PostgreSQL na porta **5432**
- ✅ Redis na porta **6379**
- ✅ MinIO na porta **9000** (API) e **9001** (Console Web)

### **Opção 2: Iniciar apenas Redis (se PostgreSQL já estiver rodando)**

```bash
docker run -d \
  --name secured-guard-redis-dev \
  -p 6379:6379 \
  -v redis_data_dev:/data \
  redis:7-alpine \
  redis-server --appendonly yes
```

### **Opção 3: Usar docker-compose.yml existente**

```bash
# Verificar se a rede existe
docker network create secured-guard 2>/dev/null || true

# Iniciar serviços
docker-compose up -d postgres redis
```

---

## ✅ Verificar se os Serviços Estão Rodando

### **1. Verificar Containers**

```bash
docker ps
```

Você deve ver:
- `secured-guard-postgres-dev` (ou similar)
- `secured-guard-redis-dev` (ou similar)

### **2. Verificar Redis**

```bash
# Testar conexão
docker exec -it secured-guard-redis-dev redis-cli ping
# Deve retornar: PONG
```

### **3. Verificar PostgreSQL**

```bash
# Testar conexão
docker exec -it secured-guard-postgres-dev pg_isready -U postgres
# Deve retornar: postgres:5432 - accepting connections
```

### **4. Verificar via API do Backend**

```bash
# Acesse no navegador ou via curl:
GET http://localhost:8083/api/v1/document-processing/health
```

Resposta esperada:
```json
{
  "redis": {
    "status": "OK",
    "ping": "PONG"
  },
  "streams": {
    "stream:jobs": 0,
    "stream:pages": 0,
    "stream:parsed": 0,
    "stream:validated": 0
  },
  "status": "OK"
}
```

---

## 🔧 Configuração do Backend

### **application.properties**

Certifique-se de que as seguintes configurações estão corretas:

```properties
# Redis (OBRIGATÓRIO)
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=

# PostgreSQL (OBRIGATÓRIO)
spring.datasource.url=jdbc:postgresql://localhost:5432/secured_guard
spring.datasource.username=postgres
spring.datasource.password=postgres

# MinIO (OPCIONAL - se não usar, deixe minio.enabled=false)
minio.enabled=false
minio.url=http://localhost:9000
minio.access-key=minioadmin
minio.secret-key=minioadmin

# Gemini API (OPCIONAL - se não tiver chave, o sistema usa Tesseract)
gemini.api.enabled=false
gemini.api.key=
```

---

## 🐛 Troubleshooting

### **Problema: Redis não está disponível**

**Sintomas:**
- Logs mostram: `❌ Redis não está disponível`
- Endpoint `/health` retorna: `"redis": {"status": "ERROR"}`

**Solução:**
```bash
# Verificar se o container está rodando
docker ps | grep redis

# Se não estiver, iniciar
docker-compose -f docker-compose.dev.yml up -d redis

# Verificar logs
docker logs secured-guard-redis-dev
```

### **Problema: Workers não estão processando**

**Sintomas:**
- Upload funciona, mas status fica em "QUEUED"
- Nenhum log de processamento aparece

**Solução:**
1. Verificar se Redis está rodando (veja acima)
2. Verificar logs de inicialização do backend:
   ```
   Procure por: "🟢 SPLITTER WORKER: Iniciando inicialização..."
   ```
3. Verificar se `@EnableScheduling` está habilitado (já está em `SecuredGuardApplication.java`)

### **Problema: PostgreSQL não está acessível**

**Sintomas:**
- Erro ao iniciar o backend
- Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar se o container está rodando
docker ps | grep postgres

# Se não estiver, iniciar
docker-compose -f docker-compose.dev.yml up -d postgres

# Verificar logs
docker logs secured-guard-postgres-dev
```

---

## 📊 Verificar Status dos Workers

Após iniciar o backend, você deve ver nos logs:

```
═══════════════════════════════════════════════════════════
🟢 SPLITTER WORKER: Iniciando inicialização...
═══════════════════════════════════════════════════════════
✅ SPLITTER WORKER: Redis está disponível!
✅ SPLITTER WORKER: Consumer group 'splitter-group' criado com sucesso!
✅ SPLITTER WORKER: Inicialização concluída - Worker pronto para processar jobs!
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
🟡 OCR WORKER: Iniciando inicialização...
═══════════════════════════════════════════════════════════
✅ OCR WORKER: Consumer group 'ocr-group' criado/verificado
✅ OCR WORKER: Inicialização concluída - Worker pronto!
═══════════════════════════════════════════════════════════
```

---

## 🎯 Próximos Passos

1. ✅ Iniciar serviços: `docker-compose -f docker-compose.dev.yml up -d`
2. ✅ Verificar saúde: `GET /api/v1/document-processing/health`
3. ✅ Verificar logs de inicialização do backend
4. ✅ Fazer upload de um PDF de teste
5. ✅ Monitorar logs do backend para ver o processamento

---

## 📝 Notas Importantes

- **Redis é OBRIGATÓRIO** - Sem ele, os workers não podem processar jobs
- **PostgreSQL é OBRIGATÓRIO** - Sem ele, o backend não inicia
- **MinIO é OPCIONAL** - Se não usar, arquivos são salvos em `uploads/` localmente
- **Gemini API é OPCIONAL** - Se não tiver chave, o sistema usa Tesseract OCR

