# 🚀 EXECUTAR DEPLOY CI AGORA

## ✅ Alterações Prontas

### Arquivos Modificados:
1. `docker-compose.ci.yml` - Evolution API + Correção Traefik 405
2. `backend/src/main/resources/application-ci.properties` - Configuração Evolution API
3. `deploy-evolution-ci.sh` - Script de deploy automatizado
4. `DEPLOY_EVOLUTION_CI.md` - Documentação completa

---

## 📋 PASSO 1: Commit e Push

### Opção A: Via GitHub Desktop
1. Abra GitHub Desktop
2. Veja as alterações nos 4 arquivos acima
3. Commit message:
```
feat: Evolution API + Correção erro 405 login no CI

EVOLUTION API:
- Adicionar serviço evolution-api-ci ao docker-compose.ci.yml
- Configurar Evolution API com PostgreSQL e Redis
- Expor via Traefik em evolution.z7botsolutions.com.br

CORREÇÃO 405:
- Corrigir middlewares Traefik do backend-ci
- Adicionar CORS headers completos
- Resolver erro 405 Not Allowed no /auth/login
```
4. Push para branch `ci`

### Opção B: Via Git Bash
```bash
git add docker-compose.ci.yml backend/src/main/resources/application-ci.properties deploy-evolution-ci.sh DEPLOY_EVOLUTION_CI.md
git commit -m "feat: Evolution API + Correção 405 no CI"
git push origin ci
```

---

## 📋 PASSO 2: Deploy no Servidor CI

### Conectar ao servidor:
```bash
ssh root@ci.z7botsolutions.com.br
```

### Executar deploy:
```bash
# 1. Ir para o diretório
cd /var/www/secured_guard/ci

# 2. Pull das alterações
git pull origin ci

# 3. Criar banco Evolution
docker exec secured-guard-db-ci psql -U secured_guard_ci -c "CREATE DATABASE evolution_ci;"

# 4. Criar diretórios
mkdir -p /var/www/secured_guard/ci/evolution_instances
mkdir -p /var/www/secured_guard/ci/holerites
chmod -R 755 /var/www/secured_guard/ci/evolution_instances
chmod -R 755 /var/www/secured_guard/ci/holerites

# 5. Recriar containers (backend + evolution)
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci evolution-api-ci

# 6. Aguardar 40 segundos
sleep 40

# 7. Verificar status
docker logs evolution-api-ci --tail 30
docker logs secured-guard-backend-ci --tail 30

# 8. Testar Evolution API
curl https://evolution.z7botsolutions.com.br

# 9. Testar login (deve funcionar sem 405)
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'
```

---

## 📋 PASSO 3: Obter QR Code Evolution API

```bash
# 1. Criar instância
curl -X POST https://evolution.z7botsolutions.com.br/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"securedguard","integration":"WHATSAPP-BAILEYS"}'

# 2. Aguardar 10 segundos
sleep 10

# 3. Obter QR Code
curl -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  https://evolution.z7botsolutions.com.br/instance/connect/securedguard
```

### Ou acessar pelo navegador:
1. Abra: `https://evolution.z7botsolutions.com.br/instance/connect/securedguard`
2. Use extensão ModHeader para adicionar header: `apikey: B6D711FCDE4D4FD5936544120E713976`
3. Escaneie com WhatsApp: **31971731747**

---

## ✅ Checklist de Validação

- [ ] Commit feito com sucesso
- [ ] Push para branch `ci` realizado
- [ ] Conectado ao servidor CI
- [ ] Git pull executado
- [ ] Banco `evolution_ci` criado
- [ ] Diretórios criados
- [ ] Containers recriados (backend + evolution)
- [ ] Evolution API responde em `https://evolution.z7botsolutions.com.br`
- [ ] Login funciona sem erro 405
- [ ] Instância Evolution criada
- [ ] QR Code gerado (sem loop!)
- [ ] WhatsApp conectado
- [ ] Teste de mensagem bem-sucedido

---

## 🎯 URLs Finais

- **Evolution API:** https://evolution.z7botsolutions.com.br
- **Backend CI:** https://ci.z7botsolutions.com.br/api
- **Frontend CI:** https://ci.z7botsolutions.com.br

---

## 🔑 Credenciais

- **Evolution API Key:** `B6D711FCDE4D4FD5936544120E713976`
- **Instance Name:** `securedguard`
- **WhatsApp Number:** `31971731747`
- **User Login:** `jose.ramos` / `Admin1234`

