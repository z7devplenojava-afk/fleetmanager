# 🚀 Guia de Início Rápido - Processamento de Holerites

## 📋 Pré-requisitos

Para o processamento de holerites funcionar, você precisa dos seguintes containers rodando:

1. **PostgreSQL** - Banco de dados (já deve estar rodando)
2. **Redis** - Necessário para os workers processarem os jobs ⚠️ **ESSENCIAL**

## 🔧 Passo 1: Verificar/Iniciar Containers

### Opção A: Usar Docker Compose (Recomendado)

```bash
# 1. Navegar para a raiz do projeto
cd c:\dev\secured-guard

# 2. Verificar se a rede existe
docker network ls | grep secured-guard

# Se não existir, criar a rede:
docker network create secured-guard

# 3. Iniciar apenas PostgreSQL e Redis
docker-compose up -d postgres redis

# 4. Verificar se os containers estão rodando
docker ps | grep -E "postgres|redis"
```

### Opção B: Iniciar Redis Manualmente

Se você já tem o PostgreSQL rodando, pode iniciar apenas o Redis:

```bash
docker run -d \
  --name secured-guard-redis-local \
  --network secured-guard \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes
```

## ✅ Passo 2: Verificar se os Containers Estão Funcionando

### Verificar Redis:

```bash
# Testar conexão com Redis
docker exec secured-guard-redis-local redis-cli ping
# Deve retornar: PONG
```

### Verificar PostgreSQL:

```bash
# Testar conexão com PostgreSQL
docker exec secured-guard-db-local pg_isready -U postgres
# Deve retornar: secured-guard-db-local:5432 - accepting connections
```

## 🔍 Passo 3: Verificar Configuração do Backend

Verifique se o `application.properties` está configurado corretamente:

```properties
# Redis (deve apontar para localhost:6379)
spring.data.redis.host=localhost
spring.data.redis.port=6379

# PostgreSQL (verifique a porta - pode ser 5433 no docker-compose)
spring.datasource.url=jdbc:postgresql://localhost:5433/secured_guard
```

## 🚀 Passo 4: Iniciar o Backend

```bash
cd backend
mvn spring-boot:run
```

## 📊 Passo 5: Verificar se os Workers Estão Inicializados

Após iniciar o backend, procure nos logs por:

```
═══════════════════════════════════════════════════════════
🟢 SPLITTER WORKER: Iniciando inicialização...
═══════════════════════════════════════════════════════════
✅ SPLITTER WORKER: Redis está disponível!
✅ SPLITTER WORKER: Inicialização concluída - Worker pronto para processar jobs!
```

## 🔍 Passo 6: Testar o Sistema

### 1. Verificar Health do Sistema:

```bash
curl http://localhost:8083/api/v1/document-processing/health
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

### 2. Fazer Upload de um PDF:

- Acesse o frontend
- Faça upload de um PDF
- Verifique os logs do backend para ver o processamento

## ⚠️ Problemas Comuns

### Problema 1: Redis não está disponível

**Sintoma:** Logs mostram `❌ Redis não está disponível`

**Solução:**
```bash
# Verificar se o container está rodando
docker ps | grep redis

# Se não estiver, iniciar:
docker-compose up -d redis

# Verificar logs do Redis
docker logs secured-guard-redis-local
```

### Problema 2: Workers não estão inicializando

**Sintoma:** Não aparecem os logs de inicialização dos workers

**Solução:**
1. Verifique se o Redis está acessível:
   ```bash
   docker exec secured-guard-redis-local redis-cli ping
   ```

2. Verifique se o backend consegue conectar ao Redis:
   ```bash
   curl http://localhost:8083/api/v1/document-processing/health
   ```

3. Verifique os logs do backend para erros de inicialização

### Problema 3: Jobs ficam em QUEUED e não processam

**Sintoma:** Upload funciona mas o status fica em QUEUED

**Solução:**
1. Verifique se o Redis está rodando
2. Verifique se os workers foram inicializados (procure pelos logs)
3. Verifique se há mensagens no stream:
   ```bash
   docker exec secured-guard-redis-local redis-cli XINFO STREAM stream:jobs
   ```

## 📝 Resumo dos Containers Necessários

| Container | Porta | Necessário Para |
|-----------|-------|-----------------|
| PostgreSQL | 5433 | Banco de dados |
| Redis | 6379 | **Workers de processamento** ⚠️ |

## 🎯 Checklist de Inicialização

- [ ] Docker Desktop está rodando
- [ ] Rede `secured-guard` existe
- [ ] Container PostgreSQL está rodando
- [ ] Container Redis está rodando
- [ ] Backend está rodando
- [ ] Logs mostram workers inicializados
- [ ] Endpoint `/health` retorna Redis OK

## 🔗 Comandos Úteis

```bash
# Ver todos os containers
docker ps -a

# Ver logs do Redis
docker logs secured-guard-redis-local

# Ver logs do PostgreSQL
docker logs secured-guard-db-local

# Parar todos os containers
docker-compose down

# Iniciar todos os containers
docker-compose up -d

# Reiniciar apenas Redis
docker-compose restart redis
```

