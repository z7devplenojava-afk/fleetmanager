# 🔧 Corrigir WhatsApp no Ambiente CI

## Problema
O serviço WhatsApp não está disponível no ambiente CI, mesmo com a configuração aparentemente correta.

## Diagnóstico Rápido

Execute na VPS:

```bash
cd /var/www/secured_guard/ci

# 1. Verificar se o container está rodando
docker ps | grep whatsapp

# 2. Verificar logs do container
docker logs secured-guard-whatsapp-ci --tail 50

# 3. Verificar se o container está acessível do backend
docker exec secured-guard-backend-ci curl -f http://whatsapp-service-ci:3333/health

# 4. Verificar variáveis de ambiente
docker exec secured-guard-backend-ci env | grep BAILEYS
```

## Soluções

### Solução 1: Reiniciar o container WhatsApp

```bash
cd /var/www/secured_guard/ci

# Parar o container
docker-compose -f docker-compose.ci.yml stop whatsapp-service-ci

# Remover o container (não remove volumes)
docker-compose -f docker-compose.ci.yml rm -f whatsapp-service-ci

# Recriar e iniciar
docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci

# Verificar logs
docker logs secured-guard-whatsapp-ci --tail 50 -f
```

### Solução 2: Verificar se a imagem existe

```bash
# Verificar se a imagem está disponível
docker images | grep secured-guard-whatsapp

# Se não existir, fazer pull
docker pull z7design/secured-guard-whatsapp:ci

# Recriar o container
docker-compose -f docker-compose.ci.yml up -d --force-recreate whatsapp-service-ci
```

### Solução 3: Verificar conectividade de rede

```bash
# Verificar se o backend consegue acessar o WhatsApp
docker exec secured-guard-backend-ci ping -c 3 whatsapp-service-ci

# Verificar se o WhatsApp está escutando na porta 3333
docker exec secured-guard-whatsapp-ci netstat -tlnp | grep 3333
# OU
docker exec secured-guard-whatsapp-ci ss -tlnp | grep 3333
```

### Solução 4: Verificar variáveis de ambiente do backend

```bash
# Verificar variáveis BAILEYS no backend
docker exec secured-guard-backend-ci env | grep BAILEYS

# Se não estiverem definidas, verificar o arquivo .env
cat .env | grep BAILEYS

# Se o .env não tiver, adicionar ao docker-compose.ci.yml ou .env
```

### Solução 5: Recriar todos os containers (último recurso)

```bash
cd /var/www/secured_guard/ci

# Parar todos os containers
docker-compose -f docker-compose.ci.yml down

# Limpar volumes (CUIDADO: isso apaga dados)
# docker volume rm secured_guard_ci_whatsapp_sessions_ci

# Recriar todos os containers
docker-compose -f docker-compose.ci.yml up -d

# Verificar status
docker-compose -f docker-compose.ci.yml ps

# Verificar logs do WhatsApp
docker logs secured-guard-whatsapp-ci --tail 50 -f
```

## Verificação Final

Após aplicar uma solução, verifique:

1. **Container está rodando:**
   ```bash
   docker ps | grep whatsapp
   ```

2. **Health check está OK:**
   ```bash
   docker exec secured-guard-whatsapp-ci curl -f http://localhost:3333/health
   ```

3. **Backend consegue acessar:**
   ```bash
   docker exec secured-guard-backend-ci curl -f http://whatsapp-service-ci:3333/health
   ```

4. **Testar no frontend:**
   - Acesse a interface do WhatsApp
   - Tente gerar um QR Code
   - Verifique os logs do backend: `docker logs secured-guard-backend-ci --tail 50 -f`

## Logs Importantes

### Backend
```bash
docker logs secured-guard-backend-ci --tail 100 | grep -i whatsapp
docker logs secured-guard-backend-ci --tail 100 | grep -i baileys
```

### WhatsApp Service
```bash
docker logs secured-guard-whatsapp-ci --tail 100
```

## Configuração Esperada

### Variáveis de Ambiente do Backend (CI)
- `BAILEYS_REST_URL=http://whatsapp-service-ci:3333`
- `BAILEYS_ENABLED=true`
- `BAILEYS_INSTANCE_KEY=securedguard_ci`

### Container WhatsApp
- **Nome:** `secured-guard-whatsapp-ci`
- **Porta:** `3333:3333`
- **Rede:** `secured-guard-ci-network` e `z7network`
- **Health Check:** `http://localhost:3333/health`

## Se Nada Funcionar

1. Verificar se a imagem `z7design/secured-guard-whatsapp:ci` existe no Docker Hub
2. Verificar se o GitHub Actions está buildando e fazendo push da imagem
3. Verificar se há problemas de rede/firewall na VPS
4. Verificar logs completos do sistema: `journalctl -u docker -n 100`
