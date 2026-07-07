# 🚀 Guia de Deploy Automático para CI (ci.fluxbus.com.br)

---

## 🔐 Passo 1: Adicionar as Secrets no GitHub

1. Vá para seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret** para cada uma das secrets abaixo:

| Secret | Valor |
|---|---|
| `DOCKER_USERNAME` | `z7design` |
| `DOCKER_PASSWORD` | `M@rio335544` |
| `VPS_HOST_CI` | `198.7.116.227` |
| `VPS_USER_CI` | `root` |
| `VPS_PASSWORD_CI` | `4KaCiJc6an@7sg@2026` |
| `POSTGRES_PASSWORD_CI` | `4KaCiJc6an@7sgbdcid2026` |
| `REDIS_PASSWORD_CI` | `redis_ci_2026` |
| `JWT_SECRET_CI` | `z7_Secure_Guard_Prod_2026_High_Security_Key_Minimum_64_Bytes_JWT_Secret_!!!` |
| `MAIL_PASSWORD` | `D8rKeqSFZfaS$(y7` |

---

## 🌿 Passo 2: Criar a Branch `ci` (se não existir)

```bash
# Certifique-se que está na main
git checkout main
git pull origin main

# Criar a branch ci
git checkout -b ci
git push -u origin ci
```

---

## 🚀 Passo 3: Testar o Deploy

1. Vá para seu repositório no GitHub → **Actions**
2. Selecione o workflow **"Deploy Automático para CI"**
3. Clique em **Run workflow** → Escolha a branch `ci` → Clique em **Run workflow**
4. Acompanhe o progresso!

---

## 📋 Arquivos Criados

- `github/workflows/deploy-ci-vps.yml`: Workflow principal de deploy
- `docker-compose.fluxbus.ci.yml`: Docker Compose para o ambiente CI
- `GUIA_DEPLOY_CI.md`: Este guia!
