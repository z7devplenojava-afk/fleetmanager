# 🔍 Diagnóstico: Backend CI não está respondendo

## Problema Identificado

O nginx está retornando **502 Bad Gateway** porque não consegue conectar ao backend:
```
Error: connect() failed (111: Connection refused) while connecting to upstream
upstream: "http://172.20.0.5:8080/api/v1/messages/received"
```

## Possíveis Causas

### 1. Backend não terminou de inicializar
Os logs mostram apenas o início da inicialização do Tomcat, mas não confirmam que terminou:
```
2025-12-24 14:02:48 [main] INFO  o.s.b.w.e.tomcat.TomcatWebServer - Tomcat initialized with port 8080 (http)
2025-12-24 14:02:48 [main] INFO  o.a.catalina.core.StandardService - Starting service [Tomcat]
```

**Solução:** Aguardar mais tempo ou verificar se há erros de inicialização.

### 2. Backend falhou silenciosamente
O backend pode ter falhado após a inicialização do Tomcat.

**Solução:** Verificar logs completos do backend.

### 3. Problema de rede Docker
O nginx pode não estar conseguindo resolver o nome do container ou a rede pode estar incorreta.

**Solução:** Verificar se os containers estão na mesma rede.

### 4. Healthcheck falhando
O healthcheck pode estar falhando e o container pode estar sendo reiniciado.

**Solução:** Verificar status do healthcheck.

## 🔧 Soluções Imediatas

### 1. Verificar Status dos Containers

```bash
# Verificar se o backend está rodando
docker ps | grep backend-ci

# Verificar logs completos do backend
docker logs secured-guard-backend-ci --tail 100

# Verificar se o backend está respondendo internamente
docker exec secured-guard-backend-ci curl -f http://localhost:8080/api/health
```

### 2. Verificar Rede Docker

```bash
# Verificar se os containers estão na mesma rede
docker network inspect secured-guard-ci-network | grep -A 5 backend-ci
docker network inspect secured-guard-ci-network | grep -A 5 nginx-ci

# Testar conectividade entre containers
docker exec secured-guard-nginx-ci ping -c 3 secured-guard-backend-ci
```

### 3. Verificar Healthcheck

```bash
# Verificar status do healthcheck
docker inspect secured-guard-backend-ci | grep -A 10 Health

# Verificar se o endpoint de health está funcionando
docker exec secured-guard-backend-ci curl -v http://localhost:8080/api/health
```

### 4. Reiniciar o Backend

```bash
# Parar o backend
docker stop secured-guard-backend-ci

# Remover o container (se necessário)
docker rm secured-guard-backend-ci

# Reiniciar o serviço
docker-compose -f docker-compose.ci.yml up -d backend-ci

# Acompanhar logs em tempo real
docker logs -f secured-guard-backend-ci
```

### 5. Verificar Configuração do Nginx

```bash
# Verificar se o nginx consegue resolver o nome do backend
docker exec secured-guard-nginx-ci nslookup secured-guard-backend-ci

# Testar conexão direta do nginx ao backend
docker exec secured-guard-nginx-ci wget -O- http://secured-guard-backend-ci:8080/api/health
```

## 🚨 Ações Urgentes

1. **Verificar logs completos do backend:**
   ```bash
   docker logs secured-guard-backend-ci --tail 200
   ```

2. **Verificar se há erros de inicialização:**
   ```bash
   docker logs secured-guard-backend-ci 2>&1 | grep -i error
   ```

3. **Verificar se o backend está realmente escutando na porta 8080:**
   ```bash
   docker exec secured-guard-backend-ci netstat -tulpn | grep 8080
   ```

4. **Verificar memória/disco:**
   ```bash
   docker stats secured-guard-backend-ci
   df -h
   free -h
   ```

## 📋 Checklist de Diagnóstico

- [ ] Backend está rodando (`docker ps | grep backend-ci`)
- [ ] Backend está na mesma rede que o nginx
- [ ] Backend está escutando na porta 8080 internamente
- [ ] Healthcheck está passando
- [ ] Não há erros nos logs do backend
- [ ] Nginx consegue resolver o nome do backend
- [ ] Nginx consegue conectar ao backend
- [ ] Não há problemas de memória/disco

## 🔄 Próximos Passos

1. Executar os comandos de diagnóstico acima
2. Verificar os logs completos do backend
3. Se necessário, reiniciar o backend
4. Se o problema persistir, verificar configuração do docker-compose

