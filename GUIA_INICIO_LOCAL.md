# 🚀 Guia: Como Iniciar o Projeto Localmente

## 📋 Problema Identificado

Ao tentar iniciar o backend diretamente pela IDE, você recebe o erro:
```
Unable to connect to localhost/<unresolved>:6379
Connection refused: getsockopt: localhost/127.0.0.1:6379
```

**Causa:** O Redis não está rodando. O backend precisa do Redis para funcionar.

## ✅ Solução: Iniciar os Serviços com Docker Compose

### Opção 1: Iniciar Apenas os Serviços (Recomendado para Desenvolvimento)

Se você quer rodar o backend pela IDE mas precisa dos serviços (PostgreSQL, Redis, etc.):

```bash
# 1. Iniciar apenas os serviços (sem o backend e frontend)
docker-compose -f docker-compose.local.yml up -d postgres redis minio whatsapp

# 2. Verificar se os serviços estão rodando
docker-compose -f docker-compose.local.yml ps

# 3. Agora você pode iniciar o backend pela IDE normalmente
# O backend vai conectar em:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - MinIO: localhost:9000
# - WhatsApp: localhost:3333
```

### Opção 2: Iniciar Tudo com Docker Compose

Se você quer rodar tudo via Docker:

```bash
# 1. Iniciar todos os serviços
docker-compose -f docker-compose.local.yml up -d

# 2. Verificar status
docker-compose -f docker-compose.local.yml ps

# 3. Ver logs do backend
docker-compose -f docker-compose.local.yml logs -f backend
```

## 🔧 Configuração do Perfil Spring

O projeto usa perfis do Spring Boot. Por padrão, o perfil é `test`, mas para desenvolvimento local você deve usar `local`:

### Na IDE (IntelliJ IDEA / Eclipse):

1. **IntelliJ IDEA:**
   - Vá em `Run` → `Edit Configurations`
   - Na sua configuração de run, adicione em `Environment variables`:
     ```
     SPRING_PROFILES_ACTIVE=local
     ```
   - Ou em `VM options`:
     ```
     -Dspring.profiles.active=local
     ```

2. **Eclipse:**
   - Vá em `Run` → `Run Configurations`
   - Selecione sua configuração
   - Na aba `Arguments`, adicione em `VM arguments`:
     ```
     -Dspring.profiles.active=local
     ```

3. **Via linha de comando:**
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```

## 📝 Variáveis de Ambiente Recomendadas

Para desenvolvimento local, configure estas variáveis de ambiente:

```bash
# Perfil Spring
SPRING_PROFILES_ACTIVE=local

# Banco de Dados
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/secured_guard_local
SPRING_DATASOURCE_USERNAME=dev_user
SPRING_DATASOURCE_PASSWORD=dev_pass

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
SPRING_REDIS_PASSWORD=

# MinIO (opcional)
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# WhatsApp (opcional)
BAILEYS_REST_URL=http://localhost:3333
BAILEYS_ENABLED=true
```

## 🗄️ Criar o Banco de Dados Local

Se for a primeira vez rodando localmente, você precisa criar o banco:

```bash
# 1. Iniciar PostgreSQL
docker-compose -f docker-compose.local.yml up -d postgres

# 2. Aguardar o PostgreSQL estar pronto (cerca de 10 segundos)
sleep 10

# 3. O Flyway vai criar as tabelas automaticamente quando o backend iniciar
# Ou você pode executar as migrations manualmente se preferir
```

## 🔍 Verificar se os Serviços Estão Rodando

```bash
# Verificar containers
docker ps

# Verificar logs do Redis
docker logs secured-guard-local-redis

# Verificar logs do PostgreSQL
docker logs secured-guard-local-db

# Testar conexão com Redis
docker exec -it secured-guard-local-redis redis-cli ping
# Deve retornar: PONG

# Testar conexão com PostgreSQL
docker exec -it secured-guard-local-db psql -U dev_user -d secured_guard_local -c "SELECT 1;"
```

## 🛑 Parar os Serviços

```bash
# Parar todos os serviços
docker-compose -f docker-compose.local.yml down

# Parar e remover volumes (⚠️ apaga dados!)
docker-compose -f docker-compose.local.yml down -v
```

## 🐛 Troubleshooting

### Erro: "Connection refused" no Redis

**Solução:**
```bash
# Verificar se o Redis está rodando
docker ps | grep redis

# Se não estiver, iniciar
docker-compose -f docker-compose.local.yml up -d redis

# Verificar logs
docker logs secured-guard-local-redis
```

### Erro: "Connection refused" no PostgreSQL

**Solução:**
```bash
# Verificar se o PostgreSQL está rodando
docker ps | grep postgres

# Se não estiver, iniciar
docker-compose -f docker-compose.local.yml up -d postgres

# Aguardar inicialização (pode levar 10-30 segundos)
docker logs -f secured-guard-local-db
```

### Erro: "Port already in use"

**Solução:**
```bash
# Verificar qual processo está usando a porta
# Windows:
netstat -ano | findstr :6379
netstat -ano | findstr :5432

# Linux/Mac:
lsof -i :6379
lsof -i :5432

# Parar o processo ou mudar a porta no docker-compose.local.yml
```

### Backend não encontra o Redis

**Verificar:**
1. Redis está rodando? `docker ps | grep redis`
2. Porta 6379 está acessível? `telnet localhost 6379` (ou `Test-NetConnection localhost -Port 6379` no PowerShell)
3. Perfil Spring está correto? `SPRING_PROFILES_ACTIVE=local`
4. Variáveis de ambiente estão configuradas?

## 📚 Estrutura do Projeto Local

```
secured-guard/
├── docker-compose.local.yml    # Configuração Docker para local
├── backend/                     # Backend Spring Boot
│   └── src/main/resources/
│       ├── application.properties      # Configuração padrão
│       └── application-local.properties # Configuração local
└── frontend/                    # Frontend React
```

## 🎯 Checklist de Início Rápido

- [ ] Docker e Docker Compose instalados
- [ ] Portas 5432, 6379, 9000, 3333, 8083 disponíveis
- [ ] Executar: `docker-compose -f docker-compose.local.yml up -d postgres redis`
- [ ] Configurar perfil Spring: `SPRING_PROFILES_ACTIVE=local`
- [ ] Iniciar backend pela IDE
- [ ] Verificar logs: não deve ter erros de conexão

## 💡 Dicas

1. **Desenvolvimento com Hot Reload:**
   - Use o perfil `local` no Spring Boot
   - Configure o Spring DevTools (já está no projeto)
   - O backend vai recarregar automaticamente quando você salvar arquivos

2. **Banco de Dados:**
   - O Flyway vai executar as migrations automaticamente
   - Dados são persistidos no volume Docker `secured-guard-local-db-data`
   - Para resetar o banco: `docker-compose -f docker-compose.local.yml down -v`

3. **Redis:**
   - Dados são persistidos no volume Docker `secured-guard-local-redis-data`
   - Para limpar o cache: `docker-compose -f docker-compose.local.yml restart redis`

4. **MinIO (S3 Local):**
   - Acesse o console em: http://localhost:9001
   - Credenciais: `minioadmin` / `minioadmin`

## 🔗 Links Úteis

- Backend API: http://localhost:8083
- Health Check: http://localhost:8083/api/health
- MinIO Console: http://localhost:9001
- WhatsApp Service: http://localhost:3333

