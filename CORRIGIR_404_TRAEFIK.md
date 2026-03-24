# 🔧 Como Corrigir Erro 404 no Traefik

## 🔍 Problema

A aplicação funciona internamente (health check retorna 200), mas retorna **404** quando acessada externamente via Cloudflare/Traefik.

## ✅ Solução Rápida

### Opção 1: Script Automático (Recomendado)

Execute na VPS:

```bash
cd /var/www/secured_guard/ci
chmod +x scripts/fix-404-traefik.sh
./scripts/fix-404-traefik.sh
```

O script vai:
- ✅ Verificar se Traefik está rodando
- ✅ Verificar se configuração dinâmica existe
- ✅ Conectar Nginx à rede z7network
- ✅ Reiniciar Traefik para carregar configuração
- ✅ Verificar se router foi carregado
- ✅ Testar acesso

### Opção 2: Manual

Execute na VPS:

```bash
cd /var/www/secured_guard

# 1. Verificar se configuração dinâmica existe
ls -la traefik/dynamic/ci.yml

# 2. Se não existir, criar diretório e copiar arquivo
mkdir -p traefik/dynamic
# (O arquivo deve ser transferido pelo GitHub Actions, mas se não estiver, copie manualmente)

# 3. Verificar se Traefik está rodando
docker ps | grep traefik

# 4. Reiniciar Traefik para carregar configuração dinâmica
docker restart traefik
sleep 15

# 5. Verificar se router foi carregado
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | grep -i "ci-backend"

# 6. Verificar se Nginx está na mesma rede do Traefik
docker network inspect z7network | grep -E "(traefik|nginx-ci)"

# 7. Se Nginx não estiver na rede, conectar
docker network connect z7network secured-guard-nginx-ci 2>/dev/null || echo "Já está conectado"

# 8. Testar acesso
curl -H "Host: ci.z7botsolutions.com.br" http://localhost/api/health
```

## 🔍 Diagnóstico Completo

Execute o script de diagnóstico:

```bash
cd /var/www/secured_guard/ci
chmod +x scripts/diagnose-404-traefik.sh
./scripts/diagnose-404-traefik.sh
```

## 📋 Verificações Importantes

### 1. Configuração Dinâmica do Traefik

O arquivo `/var/www/secured_guard/traefik/dynamic/ci.yml` deve existir e conter:

```yaml
http:
  routers:
    ci-backend:
      rule: "Host(`ci.z7botsolutions.com.br`)"
      entryPoints:
        - websecure
      service: ci-backend-service
      tls:
        certResolver: letsencryptresolver
      priority: 1000

  services:
    ci-backend-service:
      loadBalancer:
        servers:
          - url: "http://secured-guard-nginx-ci:80"
```

### 2. Rede Docker

O Traefik e o Nginx devem estar na mesma rede (`z7network`):

```bash
# Verificar redes do Traefik
docker inspect traefik | jq '.[0].NetworkSettings.Networks | keys'

# Verificar redes do Nginx
docker inspect secured-guard-nginx-ci | jq '.[0].NetworkSettings.Networks | keys'

# Ambos devem ter "z7network"
```

### 3. Router do Traefik

Verificar se o router foi carregado:

```bash
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("ci"))'
```

### 4. Conectividade Traefik → Nginx

Testar se o Traefik consegue acessar o Nginx:

```bash
docker exec traefik wget -qO- --timeout=5 http://secured-guard-nginx-ci:80/health
```

## 🚨 Problemas Comuns

### Problema 1: Router não encontrado

**Sintoma:** `docker exec traefik wget -qO- http://localhost:8080/api/http/routers` não mostra `ci-backend`

**Solução:**
```bash
# 1. Verificar se arquivo existe
ls -la /var/www/secured_guard/traefik/dynamic/ci.yml

# 2. Reiniciar Traefik
docker restart traefik
sleep 10

# 3. Verificar logs do Traefik
docker logs traefik --tail 50 | grep -i "error\|dynamic\|ci"
```

### Problema 2: Nginx não acessível pelo Traefik

**Sintoma:** `docker exec traefik wget http://secured-guard-nginx-ci:80/health` falha

**Solução:**
```bash
# Conectar Nginx à rede z7network
docker network connect z7network secured-guard-nginx-ci

# Verificar
docker network inspect z7network | grep -E "(traefik|nginx)"
```

### Problema 3: Configuração dinâmica não carregada

**Sintoma:** Arquivo existe mas router não aparece

**Solução:**
```bash
# 1. Verificar se docker-compose.traefik.yml monta o volume
grep -A 5 "dynamic" docker-compose.traefik.yml

# 2. Verificar se volume está montado
docker inspect traefik | jq '.[0].Mounts[] | select(.Destination | contains("dynamic"))'

# 3. Reiniciar Traefik
docker restart traefik
```

## 📝 Nota

O GitHub Actions agora transfere automaticamente o arquivo `traefik-dynamic-ci.yml` para `/var/www/secured_guard/traefik/dynamic/ci.yml` durante o deploy. Se o problema persistir após o deploy, execute os passos acima manualmente.

