# 🚀 CI/CD - SecuredGuard

Sistema completo de CI/CD para deploy automático nos ambientes CI, DEV e PROD.

## 📋 **Ambientes Configurados**

### **1. CI (Testes)**
- **URL**: `https://ci.z7botsolutions.com.br`
- **Branch**: `ci`
- **Trigger**: Push na branch `ci`
- **Banco**: `secured_guard_test`

### **2. DEV (Desenvolvimento)**
- **URL**: `https://dev.z7botsolutions.com.br`
- **Branch**: `develop` ou `dev`
- **Trigger**: Push na branch `develop`
- **Banco**: `secured_guard_dev`
- **Backup**: Automático antes do deploy

### **3. PROD (Produção)**
- **URL**: `https://prod.z7botsolutions.com.br`
- **Branch**: `main`, `master` ou `production`
- **Trigger**: Push na branch `main` (com confirmação manual)
- **Banco**: `secured_guard`
- **Backup**: Automático antes do deploy

## 🔧 **Configuração Inicial**

### **1. Configurar GitHub Secrets**

Vá para `Settings > Secrets and variables > Actions` e adicione:

```
VPS_SSH_KEY: [chave privada SSH]
VPS_HOST: 185.225.233.18
VPS_USER: securedguard
VPS_PORT: 22
```

### **2. Gerar Chave SSH**

```bash
# Executar no WSL
./deploy/setup-github-actions.sh
```

### **3. Adicionar Chave na VPS**

```bash
# Na VPS
echo "CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
```

### **4. Criar Branches**

```bash
git checkout -b ci
git push origin ci

git checkout -b develop
git push origin develop

git checkout -b production
git push origin production
```

## 🚀 **Como Usar**

### **Deploy Automático**

#### **CI (Testes)**
```bash
git checkout ci
# Fazer alterações
git add .
git commit -m "Teste CI"
git push origin ci
# Deploy automático para https://ci.z7botsolutions.com.br
```

#### **DEV (Desenvolvimento)**
```bash
git checkout develop
# Fazer alterações
git add .
git commit -m "Feature desenvolvimento"
git push origin develop
# Deploy automático para https://dev.z7botsolutions.com.br
```

#### **PROD (Produção)**
```bash
git checkout main
# Fazer alterações
git add .
git commit -m "Release produção"
git push origin main
# Deploy automático para https://prod.z7botsolutions.com.br
```

### **Deploy Manual**

1. Vá para `Actions` no GitHub
2. Selecione o workflow desejado
3. Clique em `Run workflow`
4. Escolha o ambiente
5. Para PROD, digite `DEPLOY` para confirmar

## 🔄 **Sistema de Backup**

### **Backup Automático**
- **Antes de cada deploy** em DEV e PROD
- **Localização**: `/opt/secured-guard/backups/`
- **Retenção**: 7 dias

### **Espelhamento PROD → DEV**
- **Automático** após backup
- **Sincroniza** dados de produção para desenvolvimento
- **Permite** testes com dados reais

### **Backup Manual**
```bash
# Na VPS
./deploy/backup-database.sh
```

## 📊 **Monitoramento**

### **Portainer**
- **URL**: `https://portainer2.z7botsolutions.com.br`
- **Função**: Gerenciar containers Docker

### **Traefik Dashboard**
- **URL**: `https://185.225.233.18:8080`
- **Função**: Monitorar proxy reverso e SSL

### **Logs dos Serviços**
```bash
# Produção
docker-compose -f deploy/docker-compose.prod-final.yml logs -f

# Desenvolvimento
docker-compose -f deploy/docker-compose.dev-domains.yml logs -f

# CI
docker-compose -f deploy/docker-compose.ci-domains.yml logs -f
```

## 🛠️ **Comandos Úteis**

### **Status dos Serviços**
```bash
# Ver containers rodando
docker ps --filter "name=secured-guard"

# Status por ambiente
docker-compose -f deploy/docker-compose.prod-final.yml ps
docker-compose -f deploy/docker-compose.dev-domains.yml ps
docker-compose -f deploy/docker-compose.ci-domains.yml ps
```

### **Restart de Serviços**
```bash
# Restart produção
docker-compose -f deploy/docker-compose.prod-final.yml restart

# Restart desenvolvimento
docker-compose -f deploy/docker-compose.dev-domains.yml restart

# Restart CI
docker-compose -f deploy/docker-compose.ci-domains.yml restart
```

### **Verificar Saúde**
```bash
# Produção
curl https://prod.z7botsolutions.com.br/api/actuator/health

# Desenvolvimento
curl https://dev.z7botsolutions.com.br/api/actuator/health

# CI
curl https://ci.z7botsolutions.com.br/api/actuator/health
```

## 🔒 **Segurança**

### **SSL/TLS**
- **Let's Encrypt** automático via Traefik
- **Renovação** automática
- **HTTPS** obrigatório

### **Firewall**
- **UFW** configurado
- **Portas** abertas apenas necessárias
- **Fail2Ban** para proteção SSH

### **Backup**
- **Criptografia** dos backups
- **Retenção** automática
- **Teste** de restauração

## 🆘 **Solução de Problemas**

### **Deploy Falhou**
1. Verificar logs no GitHub Actions
2. Verificar status dos containers
3. Verificar logs da aplicação

### **SSL Não Funciona**
1. Verificar DNS
2. Verificar Traefik
3. Verificar Let's Encrypt

### **Banco de Dados**
1. Verificar backup
2. Restaurar se necessário
3. Verificar logs do PostgreSQL

## 📞 **Suporte**

Para problemas:
1. Verificar logs do GitHub Actions
2. Verificar status dos containers
3. Verificar logs da aplicação
4. Restaurar backup se necessário
