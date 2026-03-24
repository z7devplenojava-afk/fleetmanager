# 🔧 Troubleshooting - Deploy na VPS

## Problema: Não consegue fazer git pull

### Solução 1: Verificar autenticação

```bash
# Na VPS, verificar se o Git está configurado
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Verificar remote
git remote -v

# Se usar HTTPS com token, pode precisar atualizar
git remote set-url origin https://ghp_TOKEN@github.com/zmarioramos/secured-guard.git
```

### Solução 2: Usar SSH em vez de HTTPS

```bash
# Na VPS, mudar remote para SSH
git remote set-url origin git@github.com:zmarioramos/secured-guard.git

# Verificar se a chave SSH está configurada
ssh -T git@github.com
```

### Solução 3: Reset hard (descarta mudanças locais)

```bash
# ⚠️ ATENÇÃO: Isso descarta todas as mudanças locais não commitadas!

# Na VPS
cd /opt/secured-guard
git fetch origin ci
git reset --hard origin/ci
git clean -fd  # Remove arquivos não rastreados
```

### Solução 4: Usar script automatizado

```bash
# Na VPS
cd /opt/secured-guard
chmod +x deploy/pull-and-deploy-ci.sh
./deploy/pull-and-deploy-ci.sh
```

### Solução 5: Clonar novamente (último recurso)

```bash
# ⚠️ ATENÇÃO: Isso remove o diretório atual!

# Na VPS
cd /opt
mv secured-guard secured-guard-backup-$(date +%Y%m%d)
git clone -b ci https://github.com/zmarioramos/secured-guard.git
cd secured-guard
# Copiar arquivos importantes do backup (como .env)
cp ../secured-guard-backup-*/env* . 2>/dev/null || true
```

## Problema: Erro de permissões

```bash
# Verificar permissões
ls -la /opt/secured-guard

# Corrigir permissões
sudo chown -R $USER:$USER /opt/secured-guard
chmod -R 755 /opt/secured-guard
```

## Problema: Branch diferente

```bash
# Verificar branch atual
git branch

# Mudar para branch ci
git checkout ci

# Se a branch não existir localmente
git checkout -b ci origin/ci
```

## Problema: Conflitos de merge

```bash
# Abortar merge em andamento
git merge --abort

# Fazer pull com rebase
git pull --rebase origin ci

# Se ainda houver problemas, fazer reset
git reset --hard origin/ci
```

## Comandos úteis

```bash
# Ver status do repositório
git status

# Ver últimas mudanças
git log --oneline -10

# Ver diferenças
git diff

# Verificar se está atualizado
git fetch origin ci
git log HEAD..origin/ci --oneline

# Forçar pull (descarta mudanças locais)
git fetch origin ci
git reset --hard origin/ci
```

