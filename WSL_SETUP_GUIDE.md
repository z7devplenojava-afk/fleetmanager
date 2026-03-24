# 🐧 Secured Guard - Guia Completo WSL2

## 🎯 Escolha Sua Abordagem

### **Opção A: Projeto no Windows (Atual)** ⚠️
- Caminho: `C:\dev\secured-guard`
- Acesso WSL: `/mnt/c/dev/secured-guard`
- Performance: **Reduzida** (50-70% mais lento)
- Hot Reload: **Pode não funcionar**
- Recomendado para: **Desenvolvimento misto** (Windows + WSL)

### **Opção B: Projeto no WSL (Recomendado)** ✅
- Caminho WSL: `~/secured-guard` ou `/home/seu-usuario/secured-guard`
- Acesso Windows: `\\wsl$\Ubuntu\home\seu-usuario\secured-guard`
- Performance: **Máxima** (nativa Linux)
- Hot Reload: **Funciona perfeitamente**
- Recomendado para: **Desenvolvimento puro Docker**

---

## 🚀 Opção A: Usar do Windows (`/mnt/c/`)

### **Passo a Passo**

```powershell
# 1. Abrir PowerShell na pasta do projeto
cd C:\dev\secured-guard

# 2. Entrar no WSL
wsl

# 3. Você estará em /mnt/c/dev/secured-guard
pwd
# Output: /mnt/c/dev/secured-guard

# 4. Tornar script executável
chmod +x scripts/start-local.sh

# 5. Iniciar ambiente
./scripts/start-local.sh
```

### **Limitações**

⚠️ **Hot Reload pode não funcionar:**
```bash
# Backend: Maven pode não detectar mudanças
# Frontend: Vite pode não detectar mudanças
# Solução: Reiniciar manualmente os containers
docker-compose -f docker-compose.local.yml restart backend
docker-compose -f docker-compose.local.yml restart frontend
```

⚠️ **Performance reduzida:**
- Build Docker: 2-3x mais lento
- NPM install: 3-4x mais lento
- Maven build: 2x mais lento

⚠️ **Problemas de permissão:**
```bash
# Pode precisar ajustar permissões
sudo chown -R $(whoami):$(whoami) .
```

### **Quando Usar Esta Opção**

✅ Você usa IDE no Windows (IntelliJ, VS Code)  
✅ Precisa acessar arquivos do Windows  
✅ Não se importa com performance reduzida  
✅ Não precisa de hot reload  

---

## ⚡ Opção B: Mover para Dentro do WSL (Recomendado)

### **Migração Completa**

```bash
# 1. Abrir WSL
wsl

# 2. Ir para home
cd ~

# 3. Criar pasta de projetos
mkdir -p ~/projects
cd ~/projects

# 4. Copiar projeto do Windows
cp -r /mnt/c/dev/secured-guard ~/projects/secured-guard

# 5. Entrar no projeto
cd ~/projects/secured-guard

# 6. Ajustar permissões
chmod +x scripts/start-local.sh

# 7. Iniciar ambiente
./scripts/start-local.sh
```

### **Ou Clonar Direto do Git**

```bash
# 1. No WSL
cd ~/projects

# 2. Clonar repositório
git clone https://github.com/your-org/secured-guard.git

# 3. Entrar e iniciar
cd secured-guard
./scripts/start-local.sh
```

### **Acessar do Windows (Explorer)**

Você pode acessar os arquivos WSL pelo Windows:

```
\\wsl$\Ubuntu\home\seu-usuario\projects\secured-guard
```

Ou no Explorer:
1. Barra de endereços: `\\wsl$`
2. Navegar: `Ubuntu` → `home` → `seu-usuario` → `projects` → `secured-guard`

### **Abrir no VS Code**

```bash
# De dentro da pasta no WSL
cd ~/projects/secured-guard
code .

# Ou do Windows
wsl -d Ubuntu -e code ~/projects/secured-guard
```

### **Vantagens**

✅ **Performance máxima** (nativa Linux)  
✅ **Hot reload funciona** perfeitamente  
✅ **Docker otimizado** (layers cache funcionam melhor)  
✅ **Sem problemas de permissão**  
✅ **Build 2-3x mais rápido**  

### **Quando Usar Esta Opção**

✅ Quer máxima performance  
✅ Precisa de hot reload funcionando  
✅ Trabalha principalmente com Docker  
✅ Não precisa acessar frequentemente do Windows  

---

## 🔧 Configuração do WSL2

### **Verificar Versão do WSL**

```powershell
# No PowerShell (Windows)
wsl --list --verbose

# Deve mostrar:
# NAME      STATE           VERSION
# Ubuntu    Running         2       ← Deve ser versão 2!
```

### **Atualizar para WSL2 (se necessário)**

```powershell
# Definir WSL2 como padrão
wsl --set-default-version 2

# Converter distro existente para WSL2
wsl --set-version Ubuntu 2
```

### **Instalar Docker no WSL**

```bash
# 1. Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# 4. Reiniciar WSL
exit
# No PowerShell:
wsl --shutdown
wsl

# 5. Verificar Docker
docker --version
docker-compose --version
```

### **Configurar Recursos do WSL**

Criar/editar: `C:\Users\SeuUsuario\.wslconfig`

```ini
[wsl2]
# Memória (ajuste conforme seu PC)
memory=8GB

# CPUs (ajuste conforme seu PC)
processors=4

# Swap
swap=2GB

# Localização do swap
swapFile=C:\\temp\\wsl-swap.vhdx
```

Reiniciar WSL:
```powershell
wsl --shutdown
wsl
```

---

## 📊 Comparação de Performance

### **Build Docker (primeira vez)**

| Localização | Backend | Frontend | Total |
|-------------|---------|----------|-------|
| `/mnt/c/` (Windows) | ~3-4 min | ~2-3 min | ~6-7 min |
| `~/` (WSL) | ~1-2 min | ~1 min | ~2-3 min |

### **Hot Reload**

| Localização | Backend | Frontend |
|-------------|---------|----------|
| `/mnt/c/` | ❌ Não funciona ou demora | ❌ Não funciona ou demora |
| `~/` (WSL) | ✅ Instantâneo | ✅ Instantâneo |

---

## 🎯 Recomendação Final

### **Se você está começando:**
➡️ Use **Opção B** (dentro do WSL)

### **Se já tem projeto no Windows e não quer mover:**
➡️ Use **Opção A** (aceite performance reduzida)

### **Setup Ideal:**

1. **Código no WSL** (`~/projects/secured-guard`)
2. **Docker Desktop** com integração WSL2
3. **VS Code** com extensão "Remote - WSL"
4. **Git** configurado no WSL

---

## 💡 Dicas Avançadas

### **Sincronizar apenas o necessário**

Se quiser o melhor dos dois mundos:

```bash
# Código no WSL (performance)
~/projects/secured-guard/

# Backups/Documentos no Windows (segurança)
/mnt/c/dev/backups/

# Usar symlinks para acessar
ln -s /mnt/c/dev/backups ~/backups
```

### **Alias úteis**

Adicionar ao `~/.bashrc` ou `~/.zshrc`:

```bash
# Aliases Secured Guard
alias sg-start='cd ~/projects/secured-guard && ./scripts/start-local.sh'
alias sg-stop='cd ~/projects/secured-guard && docker-compose -f docker-compose.local.yml down'
alias sg-logs='cd ~/projects/secured-guard && docker-compose -f docker-compose.local.yml logs -f'
alias sg-ps='cd ~/projects/secured-guard && docker-compose -f docker-compose.local.yml ps'
```

Recarregar:
```bash
source ~/.bashrc
```

Usar:
```bash
sg-start    # Inicia tudo
sg-logs     # Ver logs
sg-stop     # Para tudo
```

---

## 🆘 Troubleshooting

### **"Permission denied" ao executar scripts**

```bash
chmod +x scripts/*.sh
```

### **Docker não inicia**

```bash
# Verificar se Docker está rodando
docker ps

# Se não, iniciar Docker
sudo service docker start

# Ou usar Docker Desktop (recomendado)
```

### **Hot reload não funciona em `/mnt/c/`**

**Solução 1:** Mover para WSL
```bash
cp -r /mnt/c/dev/secured-guard ~/projects/
```

**Solução 2:** Usar polling (mais lento)
```yaml
# Em docker-compose.local.yml
volumes:
  - ./backend/src:/app/src:ro,consistency=delegated
```

### **Performance muito lenta**

1. Verificar versão WSL2: `wsl --list --verbose`
2. Aumentar recursos em `.wslconfig`
3. Mover projeto para dentro do WSL

---

## 📚 Recursos Adicionais

- [WSL2 Official Docs](https://docs.microsoft.com/windows/wsl/)
- [Docker Desktop WSL2](https://docs.docker.com/desktop/windows/wsl/)
- [VS Code Remote WSL](https://code.visualstudio.com/docs/remote/wsl)

---

**Última atualização:** 03/12/2025  
**Versão:** 1.0.0





























