# 🚀 Guia de Configuração do Pipeline Profissional CI/CD

Este guia explica como configurar o pipeline completo com ambientes CI → Dev → Prod e gates de aprovação.

## 📋 Estrutura dos Ambientes

| Ambiente | URL Frontend | URL Backend | Branch | Aprovação Obrigatória |
|----------|--------------|-------------|--------|------------------------|
| **CI** | https://ci.fluxbus.com.br | https://api.ci.fluxbus.com.br | `ci` | Não |
| **Dev** | https://dev.fluxbus.com.br | https://api.dev.fluxbus.com.br | `dev` | Sim |
| **Produção** | https://www.fluxbus.com.br | https://api.fluxbus.com.br | `main` | Sim |

---

## 🔧 Passo 1: Criar Branches no Git

Primeiro, crie as branches necessárias (se não existirem):

```bash
# Criar branch dev a partir de main
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev

# Criar branch ci a partir de main
git checkout main
git checkout -b ci
git push -u origin ci
```

---

## 🔐 Passo 2: Configurar Secrets no GitHub

Vá para seu repositório → **Settings** → **Secrets and variables** → **Actions** e adicione as seguintes secrets:

### Secrets para Webhooks do Coolify
| Secret | Descrição | Onde Pegar? |
|--------|-----------|-------------|
| `COOLIFY_WEBHOOK_CI` | URL do webhook do ambiente CI | Coolify → Projeto CI → Settings → Webhooks |
| `COOLIFY_WEBHOOK_DEV` | URL do webhook do ambiente Dev | Coolify → Projeto Dev → Settings → Webhooks |
| `COOLIFY_WEBHOOK_PROD` | URL do webhook do ambiente Prod | Coolify → Projeto Prod → Settings → Webhooks |

### Secrets Opcionais (para Deploy via SSH)
| Secret | Descrição |
|--------|-----------|
| `VPS_HOST_CI` | IP/domínio da VPS para CI |
| `VPS_USER_CI` | Usuário SSH da VPS para CI |
| `VPS_PASSWORD_CI` | Senha SSH da VPS para CI |
| `VPS_HOST_DEV` | IP/domínio da VPS para Dev |
| `VPS_USER_DEV` | Usuário SSH da VPS para Dev |
| `VPS_PASSWORD_DEV` | Senha SSH da VPS para Dev |

---

## 🏗️ Passo 3: Configurar Projetos no Coolify

Você precisará de **3 projetos separados no Coolify** (um para cada ambiente):

### Projeto 1: CI (ci.fluxbus.com.br)

1. Crie um novo projeto no Coolify chamado "Fluxbus - CI"
2. Adicione os serviços usando o arquivo `docker-compose.coolify.ci.yml`
3. Configure as variáveis de ambiente:
   - `DB_NAME=fluxbus_ci`
   - `DB_USER=fluxbus`
   - `DB_PASSWORD=[senha segura]`
   - `REDIS_PASSWORD=[senha segura]`
   - `JWT_SECRET=[senha JWT]`
4. Configure os domínios:
   - Frontend: `ci.fluxbus.com.br`
   - Backend: `api.ci.fluxbus.com.br`
5. Crie um webhook e copie a URL para a secret `COOLIFY_WEBHOOK_CI`

### Projeto 2: Dev (dev.fluxbus.com.br)

1. Crie um novo projeto no Coolify chamado "Fluxbus - Dev"
2. Adicione os serviços usando o arquivo `docker-compose.coolify.dev.yml`
3. Configure as variáveis de ambiente (valores diferentes do CI!)
4. Configure os domínios:
   - Frontend: `dev.fluxbus.com.br`
   - Backend: `api.dev.fluxbus.com.br`
5. Crie um webhook e copie a URL para a secret `COOLIFY_WEBHOOK_DEV`

### Projeto 3: Produção (www.fluxbus.com.br)

1. Crie um novo projeto no Coolify chamado "Fluxbus - Produção"
2. Adicione os serviços usando o arquivo `docker-compose.coolify.prod.yml`
3. Configure as variáveis de ambiente (valores diferentes!)
4. Configure os domínios:
   - Frontend: `www.fluxbus.com.br` (e `fluxbus.com.br` com redirect)
   - Backend: `api.fluxbus.com.br`
5. Crie um webhook e copie a URL para a secret `COOLIFY_WEBHOOK_PROD`

---

## ⚙️ Passo 4: Configurar Ambientes no GitHub

Vá para seu repositório → **Settings** → **Environments** e crie:

### 1. Environment: `ci`
- **Environment URL**: `https://ci.fluxbus.com.br`
- (Não precisa de aprovação)

### 2. Environment: `approve-dev`
- **Environment URL**: (deixar vazio)
- **Required reviewers**: Adicione os usuários que precisam aprovar o deploy para Dev
- **Deployment branches**: Somente `dev`

### 3. Environment: `dev`
- **Environment URL**: `https://dev.fluxbus.com.br`

### 4. Environment: `approve-prod`
- **Environment URL**: (deixar vazio)
- **Required reviewers**: Adicione os usuários que precisam aprovar o deploy para Produção
- **Deployment branches**: Somente `main`

### 5. Environment: `prod`
- **Environment URL**: `https://www.fluxbus.com.br`

---

## 🚀 Passo 5: Testar o Pipeline

### Fluxo Normal:
1. Desenvolva em branches feature (ex: `feature/nova-funcionalidade`)
2. Merge para a branch `ci` para testar no ambiente CI
3. Quando CI estiver ok, merge para a branch `dev` e aguarde aprovação
4. Quando Dev estiver ok, merge para a branch `main` e aguarde aprovação final
5. Deploy automático para Produção após aprovação

### Execução Manual:
1. Vá para seu repositório → **Actions** → **Pipeline Profissional CI/CD**
2. Clique em **Run workflow**
3. Escolha o ambiente que quer deployar
4. Clique em **Run workflow**

---

## 📝 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `.github/workflows/pipeline-profissional.yml` | O workflow principal do pipeline |
| `docker-compose.coolify.ci.yml` | Docker Compose para ambiente CI |
| `docker-compose.coolify.dev.yml` | Docker Compose para ambiente Dev |
| `docker-compose.coolify.prod.yml` | Docker Compose para ambiente Produção |

---

## 🔍 Troubleshooting

### Problema: Build falha
- Verifique os logs do workflow no GitHub Actions
- Certifique-se que todas as dependências estão corretas

### Problema: Deploy não acontece
- Verifique se as secrets `COOLIFY_WEBHOOK_*` estão configuradas
- Verifique os logs do Coolify

### Problema: Health check falha
- Verifique os logs do container backend no Coolify
- Certifique-se que o banco de dados está conectado corretamente

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do GitHub Actions
2. Verifique os logs do Coolify
3. Verifique o status dos containers
4. Contate o time de infraestrutura
