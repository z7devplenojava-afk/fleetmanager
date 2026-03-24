# 🚀 GitHub Actions - Deploy Automático para VPS

Guia completo para configurar deploy automático via GitHub Actions para sua VPS.

## 📋 Pré-requisitos

- ✅ **Repositório GitHub** com o código
- ✅ **VPS Ubuntu** com Docker instalado
- ✅ **Chave SSH** configurada entre GitHub e VPS
- ✅ **Domínio** apontado para IP da VPS (opcional)

## 🔧 Configuração dos Secrets

### 1. Acessar Configurações do Repositório

1. Vá para seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### 2. Adicionar Secrets Necessários

Clique em **New repository secret** e adicione:

#### 🔐 **VPS_SSH_PRIVATE_KEY**
```
-----BEGIN OPENSSH PRIVATE KEY-----
[SUA CHAVE SSH PRIVADA COMPLETA]
-----END OPENSSH PRIVATE KEY-----
```

#### 🏠 **VPS_HOST**
```
185.225.233.18
```
*Ou seu IP da VPS*

#### 👤 **VPS_USER**
```
root
```
*Ou seu usuário SSH*

## 🗂️ Estrutura dos Workflows

### 📁 `.github/workflows/`

```
.github/workflows/
├── deploy-vps.yml      # Deploy para produção (main/master)
├── dev-deploy.yml      # Deploy para desenvolvimento (develop/dev)
└── ci-tests.yml        # Testes contínuos (opcional)
```

## 🚀 Workflows Criados

### 1. **deploy-vps.yml** - Produção
- ✅ **Trigger**: Push para `main` ou `master`
- ✅ **Testes**: CI completo com PostgreSQL e Redis
- ✅ **Build**: Imagens Docker otimizadas
- ✅ **Deploy**: VPS com verificação de saúde
- ✅ **Health Check**: Verificação pós-deploy

### 2. **dev-deploy.yml** - Desenvolvimento
- ✅ **Trigger**: Push para `develop` ou `dev`
- ✅ **Testes**: Testes rápidos
- ✅ **Deploy**: Ambiente de desenvolvimento
- ✅ **Portas**: Diferentes das de produção

## 🎯 Como Funciona

### 🔄 **Fluxo Automático**

1. **Push para `main`** → Deploy automático para produção
2. **Push para `develop`** → Deploy automático para desenvolvimento
3. **Pull Request** → Executa testes, mas não faz deploy

### 📊 **Jobs do Workflow**

#### **Produção (deploy-vps.yml)**
```
🧪 CI Tests → 🐳 Build Images → ☁️ Deploy VPS → 🏥 Health Check
```

#### **Desenvolvimento (dev-deploy.yml)**
```
🧪 Quick Tests → 🛠️ Deploy Dev
```

## 🔍 Monitoramento

### **GitHub Actions**
- Acesse **Actions** no seu repositório
- Veja o status de cada workflow
- Clique em um job para ver logs detalhados

### **VPS**
```bash
# Ver logs do deploy
ssh usuario@IP_VPS 'docker-compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f'

# Status dos containers
ssh usuario@IP_VPS 'docker-compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps'

# Reiniciar se necessário
ssh usuario@IP_VPS 'cd /opt/secured-guard && docker-compose -f deploy/docker-compose.prod.yml restart'
```

## 🌐 URLs de Acesso

### **Produção**
- 🌐 **Frontend**: `http://IP_VPS/` ou `https://seudominio.com`
- 🔧 **Backend**: `http://IP_VPS:8080/actuator/health`
- 📊 **Logs**: Via GitHub Actions ou SSH

### **Desenvolvimento**
- 🛠️ **Frontend**: `http://IP_VPS:3001`
- 🔧 **Backend**: `http://IP_VPS:8082/actuator/health`

## 🛠️ Configuração da VPS

### 1. **Preparar VPS**
```bash
# Conectar na VPS
ssh usuario@IP_VPS

# Criar diretórios
sudo mkdir -p /opt/secured-guard
sudo mkdir -p /opt/secured-guard-dev
sudo chown -R $USER:$USER /opt/secured-guard*
```

### 2. **Configurar SSH**
```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Copiar chave pública para VPS
ssh-copy-id usuario@IP_VPS

# Copiar chave privada para GitHub Secrets
cat ~/.ssh/id_rsa
```

### 3. **Instalar Docker na VPS**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

## 🎮 Execução Manual

### **Via GitHub Interface**
1. Vá para **Actions** no repositório
2. Clique em **Deploy para VPS - SecuredGuard**
3. Clique em **Run workflow**
4. Selecione a branch e clique em **Run workflow**

### **Via Git**
```bash
# Deploy para produção
git checkout main
git push origin main

# Deploy para desenvolvimento
git checkout develop
git push origin develop
```

## 🔧 Personalização

### **Modificar Portas**
Edite os arquivos `docker-compose.*.yml`:
```yaml
ports:
  - "8080:8080"  # Altere conforme necessário
```

### **Adicionar Variáveis de Ambiente**
Adicione no workflow:
```yaml
env:
  CUSTOM_VAR: ${{ secrets.CUSTOM_VAR }}
```

### **Modificar Triggers**
```yaml
on:
  push:
    branches: [ main, production ]  # Adicione suas branches
  schedule:
    - cron: '0 2 * * *'  # Deploy diário às 2h
```

## 🆘 Solução de Problemas

### **Erro de SSH**
```bash
# Testar conexão
ssh -T git@github.com
ssh usuario@IP_VPS

# Verificar chaves
ls -la ~/.ssh/
```

### **Erro de Docker**
```bash
# Verificar Docker na VPS
ssh usuario@IP_VPS 'docker --version'
ssh usuario@IP_VPS 'docker-compose --version'

# Reiniciar Docker
ssh usuario@IP_VPS 'sudo systemctl restart docker'
```

### **Erro de Permissões**
```bash
# Corrigir permissões na VPS
ssh usuario@IP_VPS 'sudo chown -R $USER:$USER /opt/secured-guard'
```

### **Logs Detalhados**
- GitHub Actions: Clique no job falhado
- VPS: `docker-compose logs -f`
- Aplicação: `docker logs container_name`

## 🎉 Pronto!

Agora você tem:

- ✅ **Deploy automático** via GitHub Actions
- ✅ **Testes automatizados** antes do deploy
- ✅ **Ambientes separados** (dev/prod)
- ✅ **Verificação de saúde** pós-deploy
- ✅ **Rollback automático** em caso de falha
- ✅ **Logs centralizados** no GitHub

**Faça um push para `main` e veja a mágica acontecer!** 🚀
