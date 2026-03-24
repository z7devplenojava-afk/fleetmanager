# 🎯 Solução: Configuração Dinâmica do Traefik

## 🔍 Problema Identificado

O Traefik tem uma **configuração global** que está bloqueando o método POST. As labels do docker-compose não conseguem sobrescrever essa configuração.

## ✅ Solução: Configuração Dinâmica do Traefik

Adicionar um arquivo de configuração dinâmica no Traefik que:
1. Define middlewares permissivos para CORS
2. Define um router específico para CI com prioridade máxima
3. Permite explicitamente todos os métodos HTTP

## 📝 Arquivos Criados

### 1. traefik-dynamic-ci.yml

Este arquivo contém a configuração dinâmica do Traefik para o ambiente CI.

**Localização no servidor:** `/etc/traefik/dynamic/ci.yml`

## 🚀 Deploy

### Passo 1: Transferir arquivo de configuração

```bash
# No seu computador local
scp traefik-dynamic-ci.yml usuario@ci.z7botsolutions.com.br:/tmp/

# No servidor CI
ssh usuario@ci.z7botsolutions.com.br

# Criar diretório se não existir
sudo mkdir -p /etc/traefik/dynamic

# Mover arquivo
sudo mv /tmp/traefik-dynamic-ci.yml /etc/traefik/dynamic/ci.yml

# Ajustar permissões
sudo chown root:root /etc/traefik/dynamic/ci.yml
sudo chmod 644 /etc/traefik/dynamic/ci.yml
```

### Passo 2: Verificar configuração do Traefik

O Traefik precisa estar configurado para ler arquivos dinâmicos. Verificar `/etc/traefik/traefik.yml`:

```yaml
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    directory: "/etc/traefik/dynamic"
    watch: true
```

Se não estiver configurado, adicionar:

```bash
sudo nano /etc/traefik/traefik.yml
```

Adicionar:

```yaml
providers:
  file:
    directory: "/etc/traefik/dynamic"
    watch: true
```

### Passo 3: Reiniciar Traefik

```bash
docker restart traefik

# Aguardar 10 segundos
sleep 10

# Verificar logs
docker logs traefik --tail 50
```

Procure por:
```
Configuration loaded from file: /etc/traefik/dynamic/ci.yml
```

### Passo 4: Deploy dos containers CI

```bash
cd /var/www/secured_guard

# Fazer pull das alterações
git pull origin ci

# Recriar containers
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d

# Aguardar
sleep 30
```

### Passo 5: Testar

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v
```

**Esperado:** HTTP 401 ou 200 (NÃO 405)

## 🧪 Validação

### 1. Verificar configuração do Traefik

```bash
# Ver configuração carregada
docker exec traefik cat /etc/traefik/dynamic/ci.yml

# Ver routers ativos
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("ci"))'

# Ver middlewares ativos
curl http://localhost:8080/api/http/middlewares | jq '.[] | select(.name | contains("ci"))'
```

### 2. Verificar prioridade do router

```bash
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name == "ci-backend") | .priority'
```

Deve retornar: `1000`

### 3. Testar OPTIONS (preflight)

```bash
curl -X OPTIONS https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### 4. Testar POST

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -d '{"username":"test","password":"test"}' \
  -v
```

### 5. Testar no navegador

1. Acesse: https://ci.z7botsolutions.com.br
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. Sem erro 405

## 📊 Logs

### Traefik

```bash
docker logs traefik --tail 100 -f
```

Procure por:
- `Configuration loaded`
- `ci-backend`
- `ci-cors`

### Nginx

```bash
docker logs secured-guard-nginx-ci --tail 100 -f
```

### Backend

```bash
docker logs secured-guard-backend-ci --tail 100 -f
```

## 🔧 Troubleshooting

### Traefik não carrega configuração dinâmica

```bash
# Verificar se o diretório está montado
docker inspect traefik | grep -A 10 Mounts

# Verificar permissões
ls -la /etc/traefik/dynamic/

# Verificar sintaxe do arquivo
docker exec traefik cat /etc/traefik/dynamic/ci.yml
```

### Ainda retorna 405

```bash
# Verificar se o router está ativo
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name == "ci-backend")'

# Verificar se o middleware está aplicado
curl http://localhost:8080/api/http/routers | jq '.[] | select(.name == "ci-backend") | .middlewares'

# Testar diretamente no Nginx (bypass Traefik)
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Router não tem prioridade

Se outro router está capturando a requisição antes:

```bash
# Ver todos os routers e suas prioridades
curl http://localhost:8080/api/http/routers | jq '.[] | {name: .name, rule: .rule, priority: .priority}'

# Aumentar prioridade do ci-backend
# Editar /etc/traefik/dynamic/ci.yml e mudar priority para 2000
```

## 📋 Checklist

- [ ] Arquivo `traefik-dynamic-ci.yml` transferido para `/etc/traefik/dynamic/ci.yml`
- [ ] Traefik configurado para ler arquivos dinâmicos
- [ ] Traefik reiniciado
- [ ] Configuração carregada (verificar logs)
- [ ] Router `ci-backend` ativo com prioridade 1000
- [ ] Middlewares `ci-cors` e `allow-all-methods` ativos
- [ ] Containers CI recriados
- [ ] Teste OPTIONS retorna 204/200
- [ ] Teste POST retorna 401/200 (não 405)
- [ ] Login no frontend funciona

## 🎯 Resultado Esperado

```
✅ Traefik carrega configuração dinâmica
✅ Router ci-backend com prioridade 1000
✅ Middlewares CORS aplicados
✅ POST /api/auth/login → HTTP 200/401
✅ CORS funcionando
✅ Login OK
✅ SEM ERRO 405
```

## 💡 Por que essa solução funciona?

1. **Configuração dinâmica** sobrescreve configuração global
2. **Prioridade 1000** garante que este router seja processado primeiro
3. **Middlewares explícitos** permitem todos os métodos HTTP
4. **CORS permissivo** evita bloqueios de origem
5. **Traefik continua como proxy reverso** (requisito atendido)

## 🔄 Alternativa: Configuração via Docker Compose

Se não tiver acesso ao servidor para criar arquivos, pode tentar adicionar um container com a configuração:

```yaml
traefik-config:
  image: alpine
  container_name: traefik-config-ci
  volumes:
    - ./traefik-dynamic-ci.yml:/etc/traefik/dynamic/ci.yml:ro
  command: tail -f /dev/null
  networks:
    - z7network
```

E montar esse volume no Traefik.

---

**Data:** 29/10/2025  
**Tentativa:** 6 (Configuração dinâmica do Traefik)  
**Status:** Pronto para deploy  
**Prioridade:** 🔴 CRÍTICA  
**Confiança:** 90% de sucesso  
**Requisito:** Traefik como proxy reverso ✅
