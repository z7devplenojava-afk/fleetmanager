# 🔧 Resolver Erro 521 no CI

## 📋 **O que é o Erro 521?**

O erro **521** é um erro do **Cloudflare** que indica que o servidor de origem não está respondendo. Isso significa que o Cloudflare conseguiu se conectar ao servidor, mas o servidor não respondeu.

## 🔍 **Causas Comuns:**

1. **Backend não está rodando** - O container do backend não iniciou ou caiu
2. **Nginx não está rodando** - O container do nginx não iniciou ou caiu
3. **Problema de rede Docker** - Containers não conseguem se comunicar
4. **Backend travado** - Backend iniciou mas travou durante a inicialização
5. **Porta não está escutando** - Backend não está escutando na porta 8081

## ✅ **Soluções:**

### **1. Verificar se os containers estão rodando:**

```bash
# SSH na VPS
ssh securedguard@185.225.233.18

# Verificar containers
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps

# Verificar logs do backend
docker logs --tail 100 secured-guard-backend-ci

# Verificar logs do nginx
docker logs --tail 100 secured-guard-nginx-ci
```

### **2. Reiniciar containers que não estão rodando:**

```bash
cd /var/www/secured_guard/ci

# Parar todos os containers
docker-compose -f docker-compose.ci.yml down

# Iniciar novamente
docker-compose -f docker-compose.ci.yml up -d

# Aguardar 60 segundos
sleep 60

# Verificar status
docker-compose -f docker-compose.ci.yml ps
```

### **3. Verificar se o backend está respondendo localmente:**

```bash
# Testar backend diretamente (dentro da VPS)
curl http://localhost:8081/api/health

# Testar nginx diretamente
curl http://localhost:8082/api/health
```

### **4. Verificar logs de erro do backend:**

```bash
# Ver últimas 100 linhas dos logs
docker logs --tail 100 secured-guard-backend-ci

# Procurar por erros específicos
docker logs secured-guard-backend-ci 2>&1 | grep -i "error\|exception\|failed"
```

### **5. Verificar se o JWT_SECRET está configurado corretamente:**

```bash
# Verificar JWT_SECRET no .env
cd /var/www/secured_guard/ci
grep JWT_SECRET .env

# Verificar JWT_SECRET no container
docker exec secured-guard-backend-ci printenv JWT_SECRET
```

### **6. Verificar conectividade entre containers:**

```bash
# Testar se nginx consegue conectar ao backend
docker exec secured-guard-nginx-ci curl http://secured-guard-backend-ci:8081/api/health
```

### **7. Verificar configuração do Cloudflare:**

1. Acesse o painel do Cloudflare
2. Vá em **DNS** → Verifique se o registro A está apontando para o IP correto
3. Vá em **SSL/TLS** → Verifique se está em modo **Full** ou **Full (strict)**
4. Vá em **Speed** → Verifique se o **Auto Minify** não está causando problemas

### **8. Reiniciar o workflow do GitHub Actions:**

1. Vá para **Actions** no GitHub
2. Selecione o workflow **Deploy CI Environment (Docker Compose)**
3. Clique em **Run workflow**
4. Selecione a branch **ci**
5. Clique em **Run workflow**

## 🚨 **Solução Rápida (Emergency Fix):**

```bash
# SSH na VPS
ssh securedguard@185.225.233.18

# Ir para o diretório CI
cd /var/www/secured_guard/ci

# Parar tudo
docker-compose -f docker-compose.ci.yml down

# Limpar containers órfãos
docker container prune -f

# Verificar e corrigir JWT_SECRET no .env
# (garantir que tem pelo menos 64 caracteres)
echo "JWT_SECRET=jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key" > .env.tmp
cat .env | grep -v "^JWT_SECRET=" >> .env.tmp
mv .env.tmp .env

# Iniciar novamente
docker-compose -f docker-compose.ci.yml up -d

# Aguardar 60 segundos
sleep 60

# Verificar status
docker-compose -f docker-compose.ci.yml ps

# Verificar logs
docker logs --tail 50 secured-guard-backend-ci
```

## 📊 **Monitoramento:**

Após aplicar as correções, monitore:

1. **Status dos containers**: `docker-compose -f docker-compose.ci.yml ps`
2. **Logs do backend**: `docker logs -f secured-guard-backend-ci`
3. **Health check**: `curl https://ci.z7botsolutions.com.br/api/health`
4. **Cloudflare Analytics**: Verifique se há mais erros 521

## 🔄 **Prevenção:**

Para evitar erros 521 no futuro:

1. ✅ Garantir que o workflow do GitHub Actions sempre verifica o health check
2. ✅ Configurar alertas no Cloudflare para erros 521
3. ✅ Adicionar health checks mais robustos no backend
4. ✅ Configurar auto-restart dos containers no docker-compose
5. ✅ Monitorar logs regularmente

## 📝 **Notas:**

- O erro 521 é específico do Cloudflare
- Se o servidor estiver offline, o Cloudflare retornará 521
- O erro 502 (Bad Gateway) é diferente - indica que o nginx não conseguiu conectar ao backend
- O erro 503 (Service Unavailable) indica que o serviço está temporariamente indisponível

