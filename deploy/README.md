# Deploy SecuredGuard

Este diretório contém os arquivos de configuração para deploy do SecuredGuard em diferentes ambientes.

## Estrutura

```
deploy/
├── docker-compose.dev.yml     # Ambiente de desenvolvimento
├── docker-compose.prod.yml    # Ambiente de produção
├── docker-compose.ci.yml      # Ambiente de CI/Testes
├── nginx/
│   └── nginx.conf            # Configuração do nginx para produção
├── env.example               # Exemplo de variáveis de ambiente
└── README.md                 # Este arquivo
```

## Ambientes

### Desenvolvimento
```bash
# Subir ambiente de desenvolvimento
docker-compose -f deploy/docker-compose.dev.yml up -d

# Parar ambiente de desenvolvimento
docker-compose -f deploy/docker-compose.dev.yml down
```

### Produção
```bash
# 1. Copiar arquivo de ambiente
cp deploy/env.example .env

# 2. Editar variáveis de ambiente
nano .env

# 3. Gerar certificados SSL (se necessário)
mkdir -p deploy/nginx/ssl
# Colocar cert.pem e key.pem em deploy/nginx/ssl/

# 4. Subir ambiente de produção
docker-compose -f deploy/docker-compose.prod.yml up -d

# 5. Parar ambiente de produção
docker-compose -f deploy/docker-compose.prod.yml down
```

### CI/Testes
```bash
# Subir ambiente de CI
docker-compose -f deploy/docker-compose.ci.yml up -d

# Parar ambiente de CI
docker-compose -f deploy/docker-compose.ci.yml down
```

## Portas

### Desenvolvimento
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Database: localhost:5432
- Redis: localhost:6379

### Produção
- Frontend: https://localhost (porta 443)
- Backend: http://localhost:8080 (interno)
- Database: localhost:5432
- Redis: localhost:6379

### CI/Testes
- Frontend: http://localhost:5174
- Backend: http://localhost:8081
- Database: localhost:5433
- Redis: localhost:6380

## Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure as seguintes variáveis:

- `POSTGRES_PASSWORD`: Senha do banco de dados
- `REDIS_PASSWORD`: Senha do Redis
- `JWT_SECRET`: Chave secreta para JWT
- `SMTP_*`: Configurações de email (opcional)

## SSL/HTTPS

Para produção, você precisa de certificados SSL. Coloque os arquivos:
- `deploy/nginx/ssl/cert.pem`
- `deploy/nginx/ssl/key.pem`

## Logs

Os logs são salvos em volumes Docker:
- Backend: `backend_logs_prod`
- Nginx: `deploy/nginx/logs/`

## Monitoramento

Para verificar o status dos serviços:
```bash
# Ver logs
docker-compose -f deploy/docker-compose.prod.yml logs -f

# Ver status
docker-compose -f deploy/docker-compose.prod.yml ps

# Health checks
curl http://localhost:8080/actuator/health
curl https://localhost/
```

## Backup

Para fazer backup do banco de dados:
```bash
docker exec secured-guard-db-prod pg_dump -U postgres secured_guard > backup.sql
```

Para restaurar:
```bash
docker exec -i secured-guard-db-prod psql -U postgres secured_guard < backup.sql
```
