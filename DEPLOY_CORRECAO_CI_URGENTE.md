# 🚨 DEPLOY URGENTE - Correção Erro 405 no CI

## ⚠️ SITUAÇÃO ATUAL
O erro 405 ainda está ocorrendo porque a configuração do NGINX no servidor CI **NÃO FOI ATUALIZADA**.

## 📋 CHECKLIST DE DEPLOY IMEDIATO

### 1️⃣ Conectar ao Servidor CI

```bash
# SSH no servidor CI
ssh usuario@ci.z7botsolutions.com.br

# Ou se usar Docker Machine
docker-machine ssh ci-server
```

### 2️⃣ Localizar o Arquivo de Configuração Ativo

```bash
# Verificar qual configuração o NGINX está usando
docker exec secured-guard-nginx-ci cat /etc/nginx/nginx.conf

# Ou se estiver em um volume
docker volume inspect secured-guard-nginx-config
```

### 3️⃣ Fazer Backup da Configuração Atual

```bash
# Backup do arquivo atual
docker exec secured-guard-nginx-ci cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup-$(date +%Y%m%d-%H%M%S)
```

### 4️⃣ Atualizar a Configuração

**Opção A: Via Docker Exec (Mais Rápido)**

```bash
# Criar arquivo temporário com a nova configuração
cat > /tmp/nginx-ci-new.conf << 'EOF'
# Cole aqui o conteúdo do arquivo nginx-ci.conf atualizado
EOF

# Copiar para o container
docker cp /tmp/nginx-ci-new.conf secured-guard-nginx-ci:/etc/nginx/nginx.conf

# Testar a configuração
docker exec secured-guard-nginx-ci nginx -t

# Se OK, recarregar
docker exec secured-guard-nginx-ci nginx -s reload
```

**Opção B: Via Docker Compose (Recomendado)**

```bash
# Ir para o diretório do projeto
cd /path/to/secured-guard/deploy

# Atualizar o arquivo nginx-ci.conf com o conteúdo corrigido

# Rebuild apenas o NGINX
docker-compose -f docker-compose.ci.yml up -d --no-deps --build nginx

# Verificar logs
docker-compose -f docker-compose.ci.yml logs -f nginx
```

### 5️⃣ Verificar se a Correção Foi Aplicada

```bash
# Testar o endpoint diretamente
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"sua-senha"}' \
  -v

# Deve retornar 200 OK, não 405
```

## 🔍 DIAGNÓSTICO ADICIONAL

### Verificar se o Backend Está Rodando

```bash
# Verificar containers ativos
docker ps | grep secured-guard

# Verificar logs do backend
docker logs secured-guard-backend-ci --tail 100

# Testar health do backend diretamente
docker exec secured-guard-nginx-ci curl http://secured-guard-backend-ci:8080/api/actuator/health
```

### Verificar Configuração Atual do NGINX

```bash
# Ver configuração ativa
docker exec secured-guard-nginx-ci cat /etc/nginx/nginx.conf | grep -A 20 "location /api/"

# Deve mostrar:
# location /api/ {
#     proxy_pass http://backend_ci/api/;  <-- IMPORTANTE: deve ter /api/ no final
# }
```

## 🛠️ CORREÇÃO MANUAL RÁPIDA

Se você tem acesso ao servidor, execute este script:

```bash
#!/bin/bash
# Script de correção rápida

echo "🔧 Iniciando correção do NGINX CI..."

# 1. Backup
echo "📦 Fazendo backup..."
docker exec secured-guard-nginx-ci cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 2. Criar nova configuração
echo "📝 Criando nova configuração..."
cat > /tmp/nginx-fix.conf << 'NGINX_CONFIG'
# Adicione aqui a seção location /api/ corrigida:
location /api/ {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://backend_ci/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
NGINX_CONFIG

# 3. Aplicar correção (você precisa editar o arquivo completo)
echo "⚠️  ATENÇÃO: Você precisa editar manualmente o arquivo nginx.conf"
echo "   Substitua a seção 'location /api/' pela configuração acima"
echo ""
echo "   Comando: docker exec -it secured-guard-nginx-ci vi /etc/nginx/nginx.conf"

# 4. Testar
echo "🧪 Testando configuração..."
docker exec secured-guard-nginx-ci nginx -t

# 5. Recarregar
if [ $? -eq 0 ]; then
    echo "✅ Configuração válida! Recarregando..."
    docker exec secured-guard-nginx-ci nginx -s reload
    echo "✅ NGINX recarregado com sucesso!"
else
    echo "❌ Erro na configuração! Restaurando backup..."
    docker exec secured-guard-nginx-ci cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    docker exec secured-guard-nginx-ci nginx -s reload
fi

# 6. Testar endpoint
echo "🧪 Testando endpoint de login..."
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"123456"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo "✅ Correção concluída!"
```

## 🔄 ALTERNATIVA: Reiniciar Tudo

Se nada funcionar, reinicie os serviços:

```bash
cd /path/to/secured-guard/deploy

# Parar tudo
docker-compose -f docker-compose.ci.yml down

# Atualizar configuração
# (certifique-se que o arquivo nginx-ci.conf está correto)

# Subir tudo novamente
docker-compose -f docker-compose.ci.yml up -d

# Verificar logs
docker-compose -f docker-compose.ci.yml logs -f
```

## 📞 SUPORTE EMERGENCIAL

Se o problema persistir:

1. **Verificar se o backend está acessível:**
   ```bash
   curl http://localhost:8080/api/actuator/health
   ```

2. **Verificar logs do backend:**
   ```bash
   docker logs secured-guard-backend-ci --tail 200
   ```

3. **Verificar se a porta 8080 está aberta:**
   ```bash
   netstat -tulpn | grep 8080
   ```

4. **Verificar DNS:**
   ```bash
   nslookup ci.z7botsolutions.com.br
   ```

## ✅ VALIDAÇÃO FINAL

Após aplicar a correção, execute:

```bash
# 1. Teste via cURL
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"123456"}' \
  -v 2>&1 | grep "< HTTP"

# Deve mostrar: < HTTP/2 200

# 2. Teste via navegador
# Acesse: https://ci.z7botsolutions.com.br
# Tente fazer login
# Verifique o console: deve mostrar status 200

# 3. Verificar logs
docker logs secured-guard-nginx-ci --tail 50 | grep "POST /api/auth/login"
```

## 📝 NOTAS IMPORTANTES

- ⚠️ A configuração local (neste repositório) já está correta
- ⚠️ O problema é que o servidor CI ainda está usando a configuração antiga
- ⚠️ É necessário fazer deploy da nova configuração no servidor
- ⚠️ Após o deploy, o NGINX precisa ser recarregado

---

**URGENTE:** Esta correção precisa ser aplicada no servidor CI o mais rápido possível!
