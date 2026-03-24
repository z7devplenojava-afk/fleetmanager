# 🚨 Diagnóstico Urgente: CI Não Responde

## ❌ Problema

Health check falhou - aplicação CI não está respondendo em `https://ci.z7botsolutions.com.br/api/health`

## 🔍 Diagnóstico Rápido

Execute estes comandos no servidor CI para identificar o problema:

```bash
# SSH no servidor
ssh usuario@ci.z7botsolutions.com.br

# 1. Verificar containers rodando
docker ps | grep -E "traefik|nginx-ci|backend-ci|frontend-ci"
```

### Resultado esperado:
```
traefik                  ← Deve estar UP
secured-guard-nginx-ci   ← Deve estar UP
secured-guard-backend-ci ← Deve estar UP
secured-guard-frontend-ci ← Deve estar UP
```

## 🔧 Correções por Cenário

### Cenário 1: Traefik não está rodando

```bash
cd /var/www/secured_guard
docker-compose -f docker-compose.traefik.yml up -d
sleep 10
docker logs traefik --tail 50
```

### Cenário 2: Nginx-ci não está rodando

```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d nginx-ci
sleep 5
docker logs secured-guard-nginx-ci --tail 50
```

### Cenário 3: Backend-ci não está rodando

```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d backend-ci
sleep 30
docker logs secured-guard-backend-ci --tail 100
```

### Cenário 4: Todos rodando mas não respondem

```bash
# Testar diretamente no backend (bypass tudo)
docker exec secured-guard-backend-ci curl -f http://localhost:8081/api/health

# Se funcionar, testar Nginx
curl -f http://localhost:8082/api/health

# Se funcionar, problema está no Traefik
docker logs traefik --tail 100 | grep -i error
```

## 🎯 Teste Rápido de Conectividade

```bash
# 1. Backend direto
docker exec secured-guard-backend-ci curl http://localhost:8081/api/health
# Esperado: {"status":"UP"}

# 2. Nginx (bypass Traefik)
curl http://localhost:8082/api/health
# Esperado: {"status":"UP"}

# 3. Traefik (HTTPS)
curl https://ci.z7botsolutions.com.br/api/health
# Esperado: {"status":"UP"}
```

## 🔍 Verificar Configuração do Traefik

```bash
# Ver se configuração dinâmica foi carregada
docker logs traefik --tail 100 | grep "Configuration loaded"

# Ver routers ativos
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("ci")) | {name: .name, rule: .rule, service: .service}'

# Ver se nginx-ci está registrado
curl http://localhost:8080/api/http/services | jq '.[] | select(.name | contains("ci"))'
```

## 🔧 Correção Completa (Se nada funcionar)

```bash
cd /var/www/secured_guard

# 1. Parar tudo
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.traefik.yml down

# 2. Verificar se arquivos existem
ls -la traefik/dynamic/ci.yml
ls -la ci/nginx/ci.conf
ls -la ci/docker-compose.ci.yml

# 3. Iniciar Traefik primeiro
docker-compose -f docker-compose.traefik.yml up -d
sleep 10
docker logs traefik --tail 50

# 4. Iniciar CI
cd ci
docker-compose up -d
sleep 30

# 5. Verificar logs
docker logs secured-guard-backend-ci --tail 100
docker logs secured-guard-nginx-ci --tail 50
docker logs traefik --tail 50

# 6. Testar
curl https://ci.z7botsolutions.com.br/api/health
```

## 📊 Logs Importantes

### Backend

```bash
docker logs secured-guard-backend-ci --tail 200
```

Procure por:
- `Started SecuredGuardApplication` ← Backend iniciou
- `Tomcat started on port 8081` ← Porta correta
- Erros de conexão com banco de dados
- Erros de JWT ou configuração

### Nginx

```bash
docker logs secured-guard-nginx-ci --tail 100
```

Procure por:
- Erros de configuração
- `upstream` errors
- `connection refused`

### Traefik

```bash
docker logs traefik --tail 100
```

Procure por:
- `Configuration loaded from file`
- Erros de roteamento
- Certificado SSL

## 🚨 Solução de Emergência

Se nada funcionar, voltar para configuração anterior (sem Nginx):

```bash
cd /var/www/secured_guard/ci

# Editar docker-compose.ci.yml
nano docker-compose.ci.yml
```

Remover serviço `nginx-ci` e mudar labels do backend para:

```yaml
backend-ci:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.backend-ci.rule=Host(`ci.z7botsolutions.com.br`) && PathPrefix(`/api`)"
    - "traefik.http.routers.backend-ci.entrypoints=websecure"
    - "traefik.http.routers.backend-ci.tls.certresolver=letsencryptresolver"
    - "traefik.http.services.backend-ci.loadbalancer.server.port=8081"
```

Depois:

```bash
docker-compose down
docker-compose up -d
```

## 📞 Próximos Passos

1. Execute o diagnóstico rápido
2. Identifique qual container não está funcionando
3. Aplique a correção específica
4. Teste novamente
5. Se não funcionar, use a solução de emergência

---

**Prioridade:** 🔴 URGENTE  
**Tempo estimado:** 10-15 minutos
