# Comandos Finais para Executar na VPS

## Problema Identificado
- O `docker-compose` está mostrando ajuda ao invés de executar
- Pode ser versão antiga ou precisa usar `docker compose` (V2)

## Solução: Comandos Simples

Execute estes comandos **UM POR VEZ** na VPS:

```bash
# 1. Ir para o diretório
cd /var/www/secured_guard/ci

# 2. Verificar versão do docker-compose
docker-compose --version
# OU
docker compose version

# 3. Se docker-compose não funcionar, tentar docker compose (sem hífen)
docker compose -f docker-compose.ci.yml up -d --force-recreate

# 4. OU se for versão antiga, usar:
docker-compose -f docker-compose.ci.yml up -d

# 5. Verificar se containers estão rodando
docker ps | grep secured-guard

# 6. Se ainda não funcionar, verificar o arquivo docker-compose.ci.yml
cat docker-compose.ci.yml | head -20
```

## Comandos Alternativos (Se docker-compose não funcionar)

```bash
cd /var/www/secured_guard/ci

# Tentar com docker compose (V2 - sem hífen)
docker compose -f docker-compose.ci.yml up -d --force-recreate --pull always

# OU criar containers manualmente
docker run -d --name secured-guard-backend-ci \
  --network z7network \
  -p 8081:8080 \
  --env-file .env \
  z7design/secured-guard-backend:ci

docker run -d --name secured-guard-frontend-ci \
  --network z7network \
  -p 3000:80 \
  z7design/secured-guard-frontend:ci
```

## Verificação Rápida

```bash
# Ver containers rodando
docker ps

# Ver logs
docker logs secured-guard-backend-ci --tail 20
docker logs secured-guard-frontend-ci --tail 20

# Verificar se backend responde
curl http://localhost:8081/api/health
```
