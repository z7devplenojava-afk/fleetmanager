# 🔐 Configuração GitHub Actions com Senha

Como você usa senha da Contabo, vamos configurar o CI/CD usando `sshpass` para automatizar a senha.

## 📋 **Configuração GitHub Secrets**

Vá para: `https://github.com/zemarioramos/secured-guard/settings/secrets/actions`

Adicione estes secrets:

```
VPS_HOST: 185.225.233.18
VPS_USER: securedguard
VPS_PORT: 22
VPS_PASSWORD: 7CRM#km6t3nexvqu
```

## 🚀 **Workflows Criados**

### **1. CI Environment**
- **Arquivo**: `.github/workflows/deploy-ci-password.yml`
- **Trigger**: Push na branch `ci` ou `develop`
- **URL**: `https://ci.z7botsolutions.com.br`

### **2. DEV Environment**
- **Arquivo**: `.github/workflows/deploy-dev-password.yml`
- **Trigger**: Push na branch `develop` ou `dev`
- **URL**: `https://dev.z7botsolutions.com.br`

### **3. PROD Environment**
- **Arquivo**: `.github/workflows/deploy-prod-password.yml`
- **Trigger**: Push na branch `main`, `master` ou `production`
- **URL**: `https://prod.z7botsolutions.com.br`

## 🛠️ **Como Usar**

### **Deploy Automático por Branch**

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

## 🔄 **Recursos Incluídos**

- ✅ **Deploy automático** por branch
- ✅ **Backup automático** antes do deploy (DEV e PROD)
- ✅ **Espelhamento** PROD → DEV
- ✅ **SSL automático** com Let's Encrypt
- ✅ **Health checks** e monitoramento
- ✅ **Logs** centralizados no GitHub Actions

## 📊 **Monitoramento**

### **GitHub Actions**
- Vá para `Actions` no repositório
- Veja logs detalhados de cada deploy
- Histórico de todos os deployments

### **Portainer**
- **URL**: `https://portainer2.z7botsolutions.com.br`
- **Função**: Gerenciar containers Docker

### **Traefik Dashboard**
- **URL**: `https://185.225.233.18:8080`
- **Função**: Monitorar proxy reverso e SSL

## 🆘 **Solução de Problemas**

### **Deploy Falhou**
1. Verificar logs no GitHub Actions
2. Verificar se a senha está correta
3. Verificar se a VPS está acessível

### **SSL Não Funciona**
1. Verificar DNS dos domínios
2. Verificar Traefik
3. Verificar Let's Encrypt

### **Banco de Dados**
1. Verificar backup automático
2. Restaurar se necessário
3. Verificar logs do PostgreSQL

## 🔒 **Segurança**

- **Senha** armazenada como secret do GitHub
- **SSL/TLS** automático via Traefik
- **Backup** automático antes de cada deploy
- **Firewall** configurado na VPS

## ✅ **Próximos Passos**

1. **Configure** os secrets no GitHub
2. **Crie** as branches (`ci`, `develop`, `production`)
3. **Teste** o deploy automático
4. **Configure** DNS dos domínios

**Sistema CI/CD pronto para usar com senha da Contabo!** 🎯
