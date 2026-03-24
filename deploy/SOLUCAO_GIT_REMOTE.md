# 🔧 Solução: Remote 'origin' não configurado na VPS

## Problema
```
fatal: 'origin' does not appear to be a git repository
error: No such remote 'origin'
```

## Solução Rápida

### Opção 1: Usar script automatizado (Recomendado)

```bash
# Na VPS
cd ~/secured_guard
wget https://raw.githubusercontent.com/zmarioramos/secured-guard/ci/deploy/fix-git-remote-and-deploy.sh
chmod +x fix-git-remote-and-deploy.sh
./fix-git-remote-and-deploy.sh
```

### Opção 2: Configurar manualmente

#### Passo 1: Adicionar remote origin

**Com HTTPS (usando token):**
```bash
cd ~/secured_guard
git remote add origin https://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@github.com/zmarioramos/secured-guard.git
```

**Com SSH:**
```bash
cd ~/secured_guard
git remote add origin git@github.com:zmarioramos/secured-guard.git
```

#### Passo 2: Verificar remote
```bash
git remote -v
```

Deve mostrar:
```
origin  https://ghp_...@github.com/zmarioramos/secured-guard.git (fetch)
origin  https://ghp_...@github.com/zmarioramos/secured-guard.git (push)
```

#### Passo 3: Fazer fetch e pull
```bash
# Fazer fetch primeiro
git fetch origin ci

# Mudar para branch ci (se não estiver)
git checkout ci || git checkout -b ci origin/ci

# Fazer pull
git pull origin ci
```

#### Passo 4: Se houver conflitos, fazer reset
```bash
# ⚠️ ATENÇÃO: Isso descarta mudanças locais
git fetch origin ci
git reset --hard origin/ci
```

## Solução Completa (Passo a Passo)

```bash
# 1. Ir para o diretório
cd ~/secured_guard

# 2. Adicionar remote (escolha um método)

# Método A: HTTPS com token
git remote add origin https://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@github.com/zmarioramos/secured-guard.git

# Método B: SSH (se tiver chave configurada)
# git remote add origin git@github.com:zmarioramos/secured-guard.git

# 3. Verificar
git remote -v

# 4. Fazer fetch
git fetch origin

# 5. Verificar branches disponíveis
git branch -r

# 6. Mudar para branch ci
git checkout ci || git checkout -b ci origin/ci

# 7. Fazer pull
git pull origin ci

# 8. Se der erro, fazer reset hard
# git fetch origin ci
# git reset --hard origin/ci

# 9. Executar deploy
chmod +x deploy-vps-ci.sh
./deploy-vps-ci.sh
```

## Verificar se funcionou

```bash
# Verificar remote
git remote -v

# Verificar branch
git branch

# Verificar status
git status

# Verificar último commit
git log --oneline -5
```

## Se ainda não funcionar

### Verificar se é um repositório Git válido
```bash
cd ~/secured_guard
ls -la .git
```

Se não existir `.git`, você precisa:
1. **Clonar o repositório novamente:**
```bash
cd ~
mv secured_guard secured_guard_backup
git clone -b ci https://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@github.com/zmarioramos/secured-guard.git secured_guard
cd secured_guard
```

2. **Ou inicializar como novo repositório:**
```bash
cd ~/secured_guard
git init
git remote add origin https://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@github.com/zmarioramos/secured-guard.git
git fetch origin
git checkout -b ci origin/ci
```

## Token GitHub

Se o token expirar, gere um novo em:
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Ou use SSH em vez de HTTPS

