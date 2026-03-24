# 🔄 Como Mudar de Repositório Git

## 📋 Situações Comuns

### 1. Mudar para um Novo Repositório (Mantendo o Nome "origin")

#### Usando HTTPS:
```bash
git remote set-url origin https://github.com/USUARIO/NOVO-REPOSITORIO.git
```

#### Usando SSH:
```bash
git remote set-url origin git@github.com:USUARIO/NOVO-REPOSITORIO.git
```

### 2. Adicionar um Novo Remote (Sem Remover o Atual)

#### Adicionar um segundo remote:
```bash
# Adicionar como "upstream" ou outro nome
git remote add upstream https://github.com/USUARIO/OUTRO-REPOSITORIO.git

# Ou adicionar como "backup"
git remote add backup https://github.com/USUARIO/BACKUP-REPO.git
```

### 3. Remover um Remote

```bash
git remote remove origin
```

### 4. Renomear um Remote

```bash
git remote rename origin antigo-nome
```

## 🔍 Verificar Configuração Atual

### Ver todos os remotes:
```bash
git remote -v
```

### Ver detalhes de um remote específico:
```bash
git remote show origin
```

## 📤 Fazer Push para o Novo Repositório

Após mudar o remote:

```bash
# Verificar qual branch está ativa
git branch

# Fazer push da branch atual
git push -u origin nome-da-branch

# Exemplo: push da branch ci
git push -u origin ci

# Exemplo: push da branch main
git push -u origin main
```

## ⚠️ Importante

1. **Backup antes de mudar:**
   - Certifique-se de ter um backup do código
   - Ou faça um fork/clone do repositório atual

2. **Se mudar o remote:**
   - O histórico de commits será mantido
   - Mas o novo repositório precisa estar vazio ou você precisa fazer force push

3. **Se o novo repositório já tem código:**
   - Você pode precisar fazer merge ou rebase
   - Ou usar `--force` (cuidado!)

## 🎯 Exemplos Práticos

### Exemplo 1: Mudar para Repositório HTTPS
```bash
# Remover remote atual
git remote remove origin

# Adicionar novo remote
git remote add origin https://github.com/novo-usuario/novo-repo.git

# Verificar
git remote -v

# Fazer push
git push -u origin ci
```

### Exemplo 2: Mudar para Repositório SSH
```bash
# Mudar URL do remote existente
git remote set-url origin git@github.com:novo-usuario/novo-repo.git

# Verificar
git remote -v

# Fazer push
git push -u origin ci
```

### Exemplo 3: Adicionar Múltiplos Remotes
```bash
# Manter origin atual
# Adicionar backup
git remote add backup https://github.com/usuario/backup-repo.git

# Adicionar upstream (fork original)
git remote add upstream https://github.com/original/autor-repo.git

# Ver todos
git remote -v

# Fazer push para backup
git push backup ci
```

## 🔐 Configurar SSH (Se Usar SSH)

Se você mudar para SSH e não tiver chave configurada:

1. **Gerar chave SSH:**
```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

2. **Adicionar chave ao ssh-agent:**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

3. **Copiar chave pública:**
```bash
# Windows
cat ~/.ssh/id_ed25519.pub | clip

# Linux/Mac
cat ~/.ssh/id_ed25519.pub
```

4. **Adicionar no GitHub:**
   - Settings → SSH and GPG keys → New SSH key
   - Colar a chave pública

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
**Solução:**
```bash
# Remover primeiro
git remote remove origin

# Adicionar novo
git remote add origin NOVA-URL
```

### Erro: "permission denied"
**Solução:**
- Verificar se tem permissão no novo repositório
- Verificar se a chave SSH está configurada (se usar SSH)
- Verificar se o token de acesso está correto (se usar HTTPS)

### Erro: "repository not found"
**Solução:**
- Verificar se o repositório existe
- Verificar se você tem acesso ao repositório
- Verificar se a URL está correta

