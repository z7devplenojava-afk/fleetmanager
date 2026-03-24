# 🐳 Guia Docker Compose - Secured Guard

## 📋 Visão Geral

Este projeto possui vários arquivos Docker Compose para diferentes ambientes:

- **`docker-compose.dev.yml`** - Desenvolvimento local completo (recomendado)
- **`docker-compose.yml`** - Serviços standalone (apenas infraestrutura)
- **`docker-compose.ci.yml`** - Ambiente de CI/CD

## 🚀 Início Rápido - Desenvolvimento

### 1. Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose v2.x ou superior

### 2. Iniciar Serviços de Desenvolvimento

```bash
# Iniciar todos os serviços (PostgreSQL, Redis, MinIO, WhatsApp)
docker-compose -f docker-compose.dev.yml up -d

# Ver logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.dev.yml logs -f whatsapp-service
```

### 3. Parar Serviços

```bash
# Parar todos os serviços
docker-compose -f docker-compose.dev.yml down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```

## 📦 Serviços Disponíveis

### PostgreSQL
- **Porta:** `5432`
- **Usuário:** `postgres`
- **Senha:** `postgres`
- **Database:** `secured_guard`
- **Container:** `secured-guard-postgres-dev`

### Redis
- **Porta:** `6379`
- **Container:** `secured-guard-redis-dev`
- **Uso:** Cache e filas de processamento

### MinIO (S3-compatible)
- **API Port:** `9000`
- **Console Port:** `9001`
- **Usuário:** `minioadmin`
- **Senha:** `minioadmin`
- **Container:** `secured-guard-minio-dev`
- **Console:** http://localhost:9001

### WhatsApp Service (Baileys)
- **Porta:** `3333`
- **Container:** `whatsapp-service-dev`
- **Health Check:** http://localhost:3333/health
- **Sessões:** Persistidas em volume Docker

## 🔧 Configuração do Backend

### Arquivo `application.properties`

O backend já está configurado para usar os serviços Docker:

```properties
# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/secured_guard
spring.datasource.username=postgres
spring.datasource.password=postgres

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# WhatsApp Baileys
baileys.enabled=true
baileys.rest.url=http://localhost:3333
baileys.rest.instance.key=securedguard
```

### Iniciar Backend

```bash
cd backend
mvn spring-boot:run
```

Ou via IDE (IntelliJ, Eclipse, VS Code):
- Porta: `8083`
- Profile: `test` (padrão)

## 📱 Configuração do WhatsApp

### 1. Verificar Status

```bash
# Via curl
curl http://localhost:3333/health

# Via PowerShell
Invoke-WebRequest -Uri "http://localhost:3333/health" | Select-Object Content
```

### 2. Conectar WhatsApp

1. Acesse o sistema: http://localhost:3000
2. Vá para **Configurações > Conexão WhatsApp**
3. Clique em **"Limpar Sessão e Reconectar"** (se houver sessão anterior)
4. Clique em **"Gerar QR Code"**
5. Escaneie o QR Code com seu WhatsApp

### 3. Verificar Conexão

```bash
# Ver logs do WhatsApp Service
docker-compose -f docker-compose.dev.yml logs -f whatsapp-service
```

## 🔍 Troubleshooting

### WhatsApp: Erro 401 (Connection Failure)

**Problema:** Sessão anterior corrompida

**Solução:**
```bash
# Opção 1: Limpar via UI (recomendado)
# Acesse a página de Conexão WhatsApp e clique em "Limpar Sessão"

# Opção 2: Limpar manualmente
docker exec whatsapp-service-dev rm -rf /app/sessions/*
docker restart whatsapp-service-dev
```

### Backend não conecta ao PostgreSQL

**Problema:** Banco não está pronto

**Solução:**
```bash
# Verificar status do banco
docker-compose -f docker-compose.dev.yml ps postgres

# Ver logs do PostgreSQL
docker-compose -f docker-compose.dev.yml logs postgres

# Aguardar health check
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres
```

### Redis não disponível

**Solução:**
```bash
# Verificar Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
# Esperado: PONG

# Reiniciar Redis
docker-compose -f docker-compose.dev.yml restart redis
```

### Container não inicia

**Solução:**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.dev.yml logs [service-name]

# Reconstruir imagem
docker-compose -f docker-compose.dev.yml build --no-cache [service-name]

# Remover e recriar
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --force-recreate
```

## 📊 Comandos Úteis

### Gerenciamento de Containers

```bash
# Listar containers ativos
docker-compose -f docker-compose.dev.yml ps

# Ver uso de recursos
docker stats

# Executar comando em container
docker-compose -f docker-compose.dev.yml exec whatsapp-service sh

# Ver logs dos últimos 100 linhas
docker-compose -f docker-compose.dev.yml logs --tail=100
```

### Gerenciamento de Volumes

```bash
# Listar volumes
docker volume ls | grep secured-guard

# Inspecionar volume
docker volume inspect whatsapp_sessions_dev

# Backup de volume
docker run --rm -v whatsapp_sessions_dev:/data -v $(pwd):/backup alpine tar czf /backup/whatsapp_sessions_backup.tar.gz -C /data .

# Restaurar volume
docker run --rm -v whatsapp_sessions_dev:/data -v $(pwd):/backup alpine tar xzf /backup/whatsapp_sessions_backup.tar.gz -C /data
```

### Limpeza

```bash
# Remover containers parados
docker-compose -f docker-compose.dev.yml down

# Remover containers e volumes
docker-compose -f docker-compose.dev.yml down -v

# Limpar imagens não utilizadas
docker image prune -a

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes
```

## 🔐 Segurança

### Senhas Padrão

⚠️ **IMPORTANTE:** As senhas padrão são apenas para desenvolvimento local!

Para produção, **sempre** use senhas fortes e variáveis de ambiente:

```bash
# Criar arquivo .env
POSTGRES_PASSWORD=senha_forte_aqui
REDIS_PASSWORD=outra_senha_forte
MINIO_ROOT_PASSWORD=senha_minio_forte
```

### Redes Docker

Os serviços estão em uma rede isolada (`secured-guard-dev`):
- Comunicação interna entre containers
- Apenas portas expostas são acessíveis do host

## 🚢 Ambientes

### Desenvolvimento Local (docker-compose.dev.yml)
- Todos os serviços em um único arquivo
- Volumes locais para persistência
- Portas expostas para acesso direto

### CI/CD (docker-compose.ci.yml)
- Otimizado para pipelines
- Health checks rigorosos
- Configurações via variáveis de ambiente

### Produção
- Usar arquivos em `deploy/`
- Configurar secrets e variáveis de ambiente
- Backup automático de volumes

## 📚 Referências

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [Baileys WhatsApp Library](https://github.com/WhiskeySockets/Baileys)

## 💡 Dicas

1. **Use `docker-compose.dev.yml` para desenvolvimento** - tem tudo que você precisa
2. **Sempre verifique os logs** quando algo não funcionar
3. **Faça backup das sessões WhatsApp** antes de limpar volumes
4. **Use health checks** para garantir que serviços estejam prontos
5. **Monitore recursos** com `docker stats` para evitar problemas de performance

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose -f docker-compose.dev.yml logs -f`
2. Verifique o status: `docker-compose -f docker-compose.dev.yml ps`
3. Reinicie o serviço específico: `docker-compose -f docker-compose.dev.yml restart [service]`
4. Se persistir, abra uma issue no repositório

---

**Última atualização:** 03/12/2025





























