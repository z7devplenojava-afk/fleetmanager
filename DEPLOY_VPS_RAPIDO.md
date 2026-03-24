# ⚡ Deploy Rápido na VPS via GitHub Actions

## 🚀 SETUP EM 3 PASSOS

### 1️⃣ **Gerar Secrets** (5 minutos)

```powershell
# No PowerShell
.\setup-github-secrets.ps1
```

Este script vai:
- ✅ Gerar todas as senhas necessárias
- ✅ Criar arquivo `github-secrets.txt` com os valores
- ✅ Criar arquivo `github-secrets-gh-cli.sh` com comandos prontos

### 2️⃣ **Configurar no GitHub** (5 minutos)

**Opção A: Manual (Interface Web)**
1. Vá para: https://github.com/zemarioramos/secured-guard/settings/secrets/actions
2. Clique em **New repository secret**
3. Copie e cole cada secret do arquivo `github-secrets.txt`
4. Repita para todos os 11 secrets

**Opção B: Automático (GitHub CLI)**
```bash
# Instalar GitHub CLI: https://cli.github.com/
# No Git Bash ou WSL:
gh auth login
bash github-secrets-gh-cli.sh
```

### 3️⃣ **Deploy!** (1 minuto)

```bash
# Fazer push para disparar o deploy
git add .
git commit -m "feat: configurar GitHub Actions deploy"
git push origin main

# Acompanhar em:
# https://github.com/zemarioramos/secured-guard/actions
```

---

## 📋 SECRETS NECESSÁRIOS (11 no total)

| # | Secret | Descrição | Como Obter |
|---|--------|-----------|------------|
| 1 | `VPS_HOST` | IP da VPS | Fornecido pelo provedor VPS |
| 2 | `VPS_USER` | Usuário SSH | `root` ou `ubuntu` |
| 3 | `VPS_SSH_KEY` | Chave SSH | `cat ~/.ssh/id_rsa` |
| 4 | `VPS_PORT` | Porta SSH | `22` (padrão) |
| 5 | `VPS_URL` | URL pública | `https://seu-dominio.com` |
| 6 | `POSTGRES_DB` | Nome do banco | Gerado pelo script |
| 7 | `POSTGRES_USER` | Usuário do banco | Gerado pelo script |
| 8 | `POSTGRES_PASSWORD` | Senha do banco | Gerado pelo script |
| 9 | `REDIS_PASSWORD` | Senha do Redis | Gerado pelo script |
| 10 | `JWT_SECRET` | Secret JWT | Gerado pelo script (64 bytes) |
| 11 | `VITE_API_URL` | URL da API | `http://seu-ip:8080/api` |
| 12 | `VITE_WS_URL` | URL WebSocket | `ws://seu-ip:8080/ws` |

---

## 🎯 COMO FUNCIONA

### Fluxo Automático:

```
1. Desenvolvedor faz push na branch main
   ↓
2. GitHub Actions é disparado automaticamente
   ↓
3. Compila Backend (Maven) + Frontend (Vite)
   ↓
4. Conecta na VPS via SSH
   ↓
5. Transfere arquivos via SCP
   ↓
6. Executa Docker Compose na VPS
   ↓
7. Sistema está online!
```

**Tempo total:** ~5-10 minutos (dependendo da VPS)

---

## 🔧 PREPARAR VPS (Uma Vez Apenas)

Execute estes comandos **NA VPS** (via SSH):

```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose Plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin

# IMPORTANTE: Fazer logout e login novamente
exit
ssh usuario@ip-da-vps

# Criar network Docker
docker network create secured-guard

# Criar diretório de deploy
mkdir -p ~/secured-guard-deploy

# Verificar instalação
docker --version
docker compose version

# Abrir portas no firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (se usar SSL)
sudo ufw enable
```

---

## ✅ TESTAR

### Após o deploy automático:

```bash
# 1. Ver status do workflow
# Vá para: https://github.com/zemarioramos/secured-guard/actions

# 2. Conectar na VPS e verificar
ssh usuario@vps-ip
cd ~/secured-guard-deploy
docker ps

# 3. Ver logs
docker compose -f docker-compose.prod.yml logs -f backend

# 4. Acessar o sistema
# No navegador: http://seu-ip
```

---

## 🐛 TROUBLESHOOTING

### ❌ Erro: "Host key verification failed"
**Solução:** Adicionar VPS aos known_hosts do GitHub Actions
```yaml
# No workflow, antes do SSH:
- name: Add VPS to known_hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts
```

### ❌ Erro: "Permission denied (publickey)"
**Solução:** 
1. Verificar se a chave SSH está correta no secret `VPS_SSH_KEY`
2. Testar localmente: `ssh -i ~/.ssh/id_rsa usuario@vps-ip`

### ❌ Erro: "Docker daemon not running"
**Solução:** Na VPS:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### ❌ Erro: "Port already in use"
**Solução:** Na VPS:
```bash
# Parar containers antigos
docker compose -f ~/secured-guard-deploy/docker-compose.prod.yml down

# Verificar portas
sudo netstat -tulpn | grep :8080
```

---

## 📂 ARQUIVOS CRIADOS

```
.github/workflows/deploy-vps.yml  ← Workflow do GitHub Actions
backend/Dockerfile.prod           ← Dockerfile de produção do backend
setup-github-secrets.ps1          ← Script para gerar secrets
GITHUB_ACTIONS_VPS_SETUP.md       ← Guia completo
DEPLOY_VPS_RAPIDO.md              ← Este arquivo
```

---

## 🎯 CHECKLIST COMPLETO

### Pré-requisitos:
- [ ] VPS contratada (Ubuntu/Debian recomendado)
- [ ] IP da VPS conhecido
- [ ] Acesso SSH à VPS configurado
- [ ] Docker instalado na VPS
- [ ] Portas abertas (22, 80, 443)

### Configuração GitHub:
- [ ] Script `setup-github-secrets.ps1` executado
- [ ] 11 secrets configurados no GitHub
- [ ] Workflow criado em `.github/workflows/deploy-vps.yml`
- [ ] Código commitado e pushed

### Primeira Execução:
- [ ] Push na branch main realizado
- [ ] Workflow executado sem erros
- [ ] Containers rodando na VPS
- [ ] Sistema acessível via navegador
- [ ] Login funcionando

### Validação:
- [ ] Dashboard SUPER_ADMIN acessível
- [ ] Dashboard COLABORADOR acessível
- [ ] Dashboard VIGILANTE acessível
- [ ] Download de holerites funcionando
- [ ] Relatórios de equipamentos funcionando
- [ ] Comunicação interna funcionando

---

## 🎉 RESULTADO FINAL

Depois da configuração inicial, **TODOS OS DEPLOYS SERÃO AUTOMÁTICOS!**

```
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

→ GitHub Actions compila tudo
→ Envia para VPS
→ Executa deploy
→ Sistema atualizado! ✅
```

**Zero intervenção manual! 🚀**

---

**Criado em:** 23/10/2025  
**Tempo de Setup:** ~15 minutos  
**Deploy Automático:** ✅ Sim  
**Status:** ✅ Pronto para uso

