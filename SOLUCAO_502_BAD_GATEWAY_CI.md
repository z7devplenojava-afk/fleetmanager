# 🔧 Solução para Erro 502 Bad Gateway no CI

## 📋 Diagnóstico do Problema

O erro **502 Bad Gateway** indica que o Nginx não consegue se conectar ao backend. Isso pode acontecer por vários motivos:

### Possíveis Causas:
1. **Backend não está rodando ou travou**
2. **Backend não está respondendo no tempo esperado**
3. **Problema de rede entre Nginx e Backend**
4. **Backend está com erro e não inicia corretamente**
5. **Problema de DNS/resolução de nomes no Docker**

## 🔍 Passos para Diagnosticar

### 1. Verificar se o Backend está rodando

```bash
# Conectar ao servidor CI
ssh usuario@servidor

# Verificar status dos containers
docker ps -a | grep backend-ci

# Verificar logs do backend
docker logs secured-guard-backend-ci --tail 100

# Verificar se o backend está respondendo
docker exec secured-guard-backend-ci curl -f http://localhost:8081/api/health
```

### 2. Verificar se o Nginx consegue resolver o nome do backend

```bash
# Testar resolução DNS dentro do container Nginx
docker exec secured-guard-nginx-ci nslookup secured-guard-backend-ci

# Testar conexão do Nginx ao backend
docker exec secured-guard-nginx-ci wget -O- http://secured-guard-backend-ci:8081/api/health
```

### 3. Verificar logs do Nginx

```bash
# Ver logs de erro do Nginx
docker logs secured-guard-nginx-ci --tail 50

# Ver logs de acesso
docker exec secured-guard-nginx-ci tail -f /var/log/nginx/error.log
```

### 4. Verificar saúde do backend

```bash
# Verificar healthcheck do backend
docker inspect secured-guard-backend-ci | grep -A 10 Health

# Testar endpoint de health diretamente
curl http://localhost:8081/api/health
```

## 🛠️ Soluções

### Solução 1: Reiniciar o Backend

```bash
# Parar o backend
docker stop secured-guard-backend-ci

# Remover o container (se necessário)
docker rm secured-guard-backend-ci

# Reiniciar todos os serviços
cd /caminho/para/docker-compose.ci.yml
docker-compose -f docker-compose.ci.yml restart backend-ci

# Ou recriar o container
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci
```

### Solução 2: Verificar e Ajustar Timeouts do Nginx

O Nginx pode estar com timeouts muito curtos. Verifique o arquivo `nginx/ci.conf`:

```nginx
# Aumentar timeouts para /api/auth/
location /api/auth/ {
    proxy_connect_timeout 60s;  # Aumentado de 30s
    proxy_send_timeout 120s;    # Aumentado de 60s
    proxy_read_timeout 120s;    # Aumentado de 60s
}
```

### Solução 3: Adicionar Fallback e Melhor Tratamento de Erro

Adicionar configuração mais robusta no Nginx:

```nginx
upstream backend {
    server secured-guard-backend-ci:8081 max_fails=3 fail_timeout=30s;
    keepalive 32;
    resolver 127.0.0.11 valid=10s;
    # Adicionar backup server (opcional)
    # server 127.0.0.1:8081 backup;
}
```

### Solução 4: Verificar Memória e Recursos

O backend pode estar sem memória:

```bash
# Verificar uso de memória
docker stats secured-guard-backend-ci

# Verificar logs de OOM (Out of Memory)
dmesg | grep -i "killed process"
docker logs secured-guard-backend-ci | grep -i "outofmemory"
```

### Solução 5: Verificar Dependências do Backend

O backend pode estar esperando por serviços que não estão prontos:

```bash
# Verificar se PostgreSQL está saudável
docker exec secured-guard-db-ci pg_isready -U secured_guard_ci

# Verificar se Redis está saudável
docker exec secured-guard-redis-ci redis-cli -a redis_ci_2025 ping

# Verificar logs de conexão do backend
docker logs secured-guard-backend-ci | grep -i "database\|redis\|connection"
```

### Solução 6: Adicionar Retry Logic no Nginx

Melhorar a configuração de retry no Nginx:

```nginx
location /api/auth/ {
    # ... outras configurações ...
    
    # Retry logic melhorado
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    proxy_next_upstream_tries 3;  # Aumentado de 2
    proxy_next_upstream_timeout 10s;  # Aumentado de 5s
    
    # Timeouts aumentados
    proxy_connect_timeout 60s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

### Solução 7: Verificar Variáveis de Ambiente

Verificar se todas as variáveis de ambiente estão corretas:

```bash
# Verificar variáveis do backend
docker exec secured-guard-backend-ci env | grep -E "SPRING|JWT|DATABASE|REDIS"

# Verificar se o JWT_SECRET está definido
docker exec secured-guard-backend-ci env | grep JWT_SECRET
```

### Solução 8: Rebuild e Redeploy

Se nada funcionar, fazer rebuild completo:

```bash
# Parar todos os serviços
docker-compose -f docker-compose.ci.yml down

# Rebuild das imagens
docker-compose -f docker-compose.ci.yml build --no-cache backend-ci

# Subir novamente
docker-compose -f docker-compose.ci.yml up -d

# Acompanhar logs
docker-compose -f docker-compose.ci.yml logs -f backend-ci
```

## 🚀 Solução Rápida (Script)

Criar um script de diagnóstico rápido:

```bash
#!/bin/bash
# diagnose-502.sh

echo "🔍 Diagnosticando erro 502 Bad Gateway..."

echo "1. Verificando containers..."
docker ps -a | grep -E "backend-ci|nginx-ci"

echo "2. Verificando saúde do backend..."
docker exec secured-guard-backend-ci curl -f http://localhost:8081/api/health || echo "❌ Backend não responde"

echo "3. Verificando logs do backend (últimas 20 linhas)..."
docker logs secured-guard-backend-ci --tail 20

echo "4. Verificando logs do Nginx (últimas 20 linhas)..."
docker logs secured-guard-nginx-ci --tail 20

echo "5. Verificando resolução DNS..."
docker exec secured-guard-nginx-ci nslookup secured-guard-backend-ci || echo "❌ DNS não resolve"

echo "6. Verificando conectividade..."
docker exec secured-guard-nginx-ci wget -O- --timeout=5 http://secured-guard-backend-ci:8081/api/health || echo "❌ Não consegue conectar"

echo "✅ Diagnóstico completo!"
```

## 📝 Checklist de Verificação

- [ ] Backend está rodando (`docker ps | grep backend-ci`)
- [ ] Backend responde ao healthcheck (`curl http://localhost:8081/api/health`)
- [ ] Nginx consegue resolver o nome do backend (`nslookup`)
- [ ] Nginx consegue conectar ao backend (`wget`)
- [ ] PostgreSQL está saudável
- [ ] Redis está saudável
- [ ] Não há erros de memória (OOM)
- [ ] Variáveis de ambiente estão corretas
- [ ] Logs não mostram erros críticos
- [ ] Timeouts do Nginx são suficientes

## 🎯 Próximos Passos

1. **Executar o diagnóstico** usando os comandos acima
2. **Identificar a causa raiz** baseado nos resultados
3. **Aplicar a solução apropriada** da lista acima
4. **Monitorar** após aplicar a solução
5. **Documentar** a solução que funcionou

## 📞 Se Nada Funcionar

1. Verificar logs completos do backend: `docker logs secured-guard-backend-ci`
2. Verificar logs do sistema: `journalctl -u docker` ou `dmesg`
3. Verificar recursos do servidor: `free -h`, `df -h`, `top`
4. Considerar aumentar recursos (memória, CPU) se necessário
5. Verificar se há atualizações pendentes do Docker/Docker Compose

