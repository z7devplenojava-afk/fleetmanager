# 🔧 CORREÇÃO URGENTE - JWT_SECRET

## Problema Identificado
O JWT_SECRET no container tem apenas **18 caracteres**, mas precisa de **pelo menos 64 caracteres** para o algoritmo HS512.

## Solução Imediata

Execute estes comandos na VPS:

```bash
cd /var/www/secured_guard/ci

# 1. Verificar JWT_SECRET atual
docker exec secured-guard-backend-ci printenv JWT_SECRET | wc -c

# 2. Parar containers
docker-compose -f docker-compose.ci.yml down

# 3. Remover JWT_SECRET do ambiente do host (se existir)
unset JWT_SECRET

# 4. Verificar docker-compose.ci.yml
grep JWT_SECRET docker-compose.ci.yml

# 5. Se a linha não tiver o valor padrão correto, editar manualmente:
# A linha deve ser:
# JWT_SECRET: ${JWT_SECRET:-jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key}

# 6. Reiniciar containers
docker-compose -f docker-compose.ci.yml up -d

# 7. Aguardar 40 segundos
sleep 40

# 8. Verificar JWT_SECRET no novo container
docker exec secured-guard-backend-ci printenv JWT_SECRET | wc -c
# Deve retornar 81 (80 caracteres + 1 newline)

# 9. Verificar logs
docker logs --tail=50 secured-guard-backend-ci | grep -i jwt
```

## Comando Rápido (Tudo em Um)

```bash
cd /var/www/secured_guard/ci && \
unset JWT_SECRET && \
docker-compose -f docker-compose.ci.yml down && \
sed -i 's|JWT_SECRET:.*|JWT_SECRET: ${JWT_SECRET:-jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key}|g' docker-compose.ci.yml && \
docker-compose -f docker-compose.ci.yml up -d && \
sleep 40 && \
echo "Verificando JWT_SECRET:" && \
docker exec secured-guard-backend-ci printenv JWT_SECRET | wc -c
```

## Verificação Final

```bash
# Verificar tamanho (deve ser 81)
docker exec secured-guard-backend-ci printenv JWT_SECRET | wc -c

# Verificar logs para confirmar que não há mais erro de JWT
docker logs --tail=50 secured-guard-backend-ci | grep -i "jwt\|token\|chave"
```

## Se Ainda Não Funcionar

1. Verificar se há arquivo .env sobrescrevendo:
   ```bash
   cat /var/www/secured_guard/ci/.env | grep JWT_SECRET
   ```

2. Se existir, editar ou remover:
   ```bash
   # Editar .env e garantir que JWT_SECRET tenha pelo menos 64 caracteres
   # OU remover a linha JWT_SECRET do .env para usar o valor do docker-compose
   ```

3. Verificar variáveis de ambiente do container:
   ```bash
   docker exec secured-guard-backend-ci printenv | grep JWT
   ```

