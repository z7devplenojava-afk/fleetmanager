# 🔧 Solução: Health Check Falhou no Deploy CI

## ❌ Problema

O deploy está falhando no health check:
```
❌ Health check falhou após 10 tentativas!
Error: Process completed with exit code 1.
```

## 🔍 Diagnóstico

Adicionei **2 novos steps** no workflow para diagnosticar automaticamente:

1. **🔍 Diagnostic - Container Status** - Verifica status e logs dos containers
2. **🌐 Diagnostic - Network Connectivity** - Testa conectividade interna

No próximo deploy, você verá:
- Status de cada container
- Logs do backend (50 linhas)
- Logs do frontend (30 linhas)
- Logs do nginx (30 linhas)
- Testes de conectividade (backend, nginx, Traefik)

## 🚀 Executar Diagnóstico Manualmente na VPS

### 1. Conectar na VPS
```bash
ssh usuario@IP_VPS
```

### 2. Executar Script de Diagnóstico

Primeiro, copie o script para a VPS:
```bash
# No seu computador local
scp diagnostico-ci-vps.sh usuario@IP_VPS:/tmp/
```

Depois execute na VPS:
```bash
ssh usuario@IP_VPS
chmod +x /tmp/diagnostico-ci-vps.sh
sudo /tmp/diagnostico-ci-vps.sh
```

### 3. Ou execute manualmente passo a passo:

```bash
# 1. Ir para o diretório CI
cd /var/www/secured_guard/ci

# 2. Ver status dos containers
docker-compose -f docker-compose.ci.yml ps

# 3. Ver logs do backend
docker logs --tail 100 secured-guard-backend-ci

# 4. Testar backend diretamente
curl http://localhost:8081/api/health

# 5. Testar via Traefik
curl https://ci.z7botsolutions.com.br/api/health

# 6. Verificar se Traefik está rodando
docker ps | grep traefik

# 7. Ver logs do Traefik (se estiver rodando)
docker logs --tail 50 traefik
```

## 🔧 Causas Comuns e Soluções

### 1️⃣ Backend não está subindo

**Sintomas:**
```bash
docker logs secured-guard-backend-ci
# Mostra erros de conexão com banco ou erro de compilação
```

**Soluções:**

a) **Problema de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do PostgreSQL
docker logs secured-guard-postgres-ci

# Reiniciar PostgreSQL
docker-compose -f docker-compose.ci.yml restart postgres-ci
```

b) **Problema com variáveis de ambiente:**
```bash
# Verificar .env
cat /var/www/secured_guard/ci/.env

# Verificar se variáveis estão corretas
docker exec secured-guard-backend-ci env | grep SPRING
```

c) **Problema de memória/recursos:**
```bash
# Ver uso de recursos
docker stats --no-stream

# Se necessário, aumentar memória no docker-compose.ci.yml
```

### 2️⃣ Traefik não está rodando

**Sintomas:**
```bash
docker ps | grep traefik
# Não retorna nada
```

**Solução:**
```bash
# Ir para diretório do Traefik
cd /var/www/secured_guard

# Iniciar Traefik
docker-compose -f docker-compose.traefik.yml up -d

# Verificar logs
docker logs traefik

# Aguardar 30 segundos e tentar novamente
sleep 30
curl https://ci.z7botsolutions.com.br/api/health
```

### 3️⃣ Traefik não está roteando corretamente

**Sintomas:**
- Backend responde em `localhost:8081`
- Mas não responde em `ci.z7botsolutions.com.br`

**Solução:**
```bash
# Verificar labels do Traefik no container
docker inspect secured-guard-nginx-ci | grep traefik

# Verificar se container está na rede z7network
docker network inspect z7network | grep secured-guard

# Reconectar na rede se necessário
docker network connect z7network secured-guard-nginx-ci
docker network connect z7network secured-guard-backend-ci

# Reiniciar Traefik para recarregar configuração
docker restart traefik
```

### 4️⃣ Certificado SSL não está configurado

**Sintomas:**
```bash
curl https://ci.z7botsolutions.com.br
# Retorna erro de certificado
```

**Solução:**
```bash
# Verificar certificados do Traefik
docker exec traefik ls -lh /letsencrypt/acme.json

# Forçar renovação
docker-compose -f /var/www/secured_guard/docker-compose.traefik.yml restart
```

### 5️⃣ Porta já está em uso

**Sintomas:**
```bash
docker logs secured-guard-backend-ci
# Error: Address already in use
```

**Solução:**
```bash
# Ver o que está usando a porta
netstat -tulpn | grep 8081

# Parar container conflitante
docker stop CONTAINER_ID

# Ou mudar a porta no docker-compose.ci.yml
```

## 🔄 Reiniciar do Zero

Se nada funcionar, reinicie tudo:

```bash
cd /var/www/secured_guard/ci

# 1. Parar todos os containers
docker-compose -f docker-compose.ci.yml down

# 2. Remover volumes (ATENÇÃO: Apaga dados!)
# sudo rm -rf postgres_data redis_data

# 3. Recriar diretórios
mkdir -p postgres_data redis_data uploads logs whatsapp_sessions

# 4. Subir novamente
docker-compose -f docker-compose.ci.yml up -d

# 5. Acompanhar logs
docker-compose -f docker-compose.ci.yml logs -f
```

## 📊 Monitoramento em Tempo Real

```bash
# Ver logs de todos os containers
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml logs -f

# Ver apenas backend
docker logs -f secured-guard-backend-ci

# Ver recursos em tempo real
docker stats
```

## ✅ Testar Manualmente Após Correção

```bash
# 1. Health check local
curl http://localhost:8081/api/health

# 2. Health check público
curl https://ci.z7botsolutions.com.br/api/health

# 3. Testar login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 4. Acessar frontend
curl -I https://ci.z7botsolutions.com.br
```

## 🎯 Próximo Deploy

Com os novos steps de diagnóstico, o próximo deploy vai mostrar:

```
✅ Deploy steps 1-14 (build, transfer, pull, start)
🔍 Step 15: Diagnostic - Container Status
   - Lista status de todos containers
   - Mostra logs do backend
   - Mostra logs do frontend
   - Mostra logs do nginx

🌐 Step 16: Diagnostic - Network Connectivity
   - Testa backend localhost:8081
   - Testa nginx localhost:8082
   - Verifica se Traefik está rodando

🏥 Step 17: Health Check
   - 10 tentativas
   - Mostra HTTP code a cada tentativa
   - Se falhar, mostra 100 linhas de log do backend
```

## 📞 Checklist de Verificação

Antes de fazer novo deploy, verifique na VPS:

- [ ] Traefik está rodando: `docker ps | grep traefik`
- [ ] PostgreSQL está rodando: `docker ps | grep postgres`
- [ ] Porta 8081 está livre: `netstat -tulpn | grep 8081`
- [ ] Diretórios existem: `ls -lh /var/www/secured_guard/ci/`
- [ ] Docker compose existe: `ls -lh /var/www/secured_guard/ci/docker-compose.ci.yml`
- [ ] Rede z7network existe: `docker network ls | grep z7network`

## 🚀 Fazer Novo Deploy

Depois de corrigir na VPS:

```bash
# No seu computador local
git add .
git commit -m "Adicionar diagnóstico ao deploy CI"
git push origin ci

# Ou executar manualmente via GitHub Actions
```

---

**💡 Dica:** Execute o script `diagnostico-ci-vps.sh` na VPS ANTES do próximo deploy para identificar problemas com antecedência!

