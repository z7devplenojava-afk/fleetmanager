# 🔧 Comandos Git para Configurar o Repositório CI

## ⚠️ Problema

Você está tentando fazer pull da branch `main`, mas a branch correta para CI é `ci`.

## ✅ Solução Rápida

Execute estes comandos **no servidor**:

```bash
# 1. Ir para o diretório do projeto
cd /root/secured_guard

# 2. Verificar remotes
git remote -v

# 3. Buscar branches remotas
git fetch origin

# 4. Ver branches disponíveis
git branch -r

# 5. Mudar para a branch 'ci'
git checkout ci

# 6. Se a branch 'ci' não existir localmente, criar baseada na remota
git checkout -b ci origin/ci

# 7. Fazer pull da branch 'ci'
git pull origin ci
```

## 🔧 Script Automático

Ou use o script automático:

```bash
cd /root/secured_guard
wget -O configurar-repositorio-ci.sh https://raw.githubusercontent.com/zmarioramos/secured-guard/ci/configurar-repositorio-ci.sh
chmod +x configurar-repositorio-ci.sh
./configurar-repositorio-ci.sh
```

## 📋 Verificação

Após configurar, verifique:

```bash
# Ver branch atual
git branch --show-current

# Ver status
git status

# Ver último commit
git log -1 --oneline
```

## 🔍 Troubleshooting

### Se o remote não estiver configurado:

```bash
# Adicionar remote
git remote add origin https://github.com/zmarioramos/secured-guard.git

# Verificar
git remote -v
```

### Se a branch 'ci' não existir no remoto:

```bash
# Criar branch 'ci' localmente
git checkout -b ci

# Fazer push
git push -u origin ci
```

### Se houver conflitos:

```bash
# Fazer stash das mudanças locais
git stash

# Fazer pull
git pull origin ci

# Aplicar mudanças locais (se necessário)
git stash pop
```

## 📝 Notas Importantes

- **Branch para CI**: `ci` (não `main` ou `master`)
- **URL do repositório**: `https://github.com/zmarioramos/secured-guard.git`
- **Diretório do projeto**: `/root/secured_guard` ou `/root/secured_guard/ci`

