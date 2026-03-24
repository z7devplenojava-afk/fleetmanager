# 🎨 Como Usar Cursor com WSL - Secured Guard

## 🚀 Método 1: Abrir Pasta WSL no Cursor (Recomendado)

### **Passo a Passo:**

1. **Abrir Cursor**

2. **File → Open Folder** (ou `Ctrl+K Ctrl+O`)

3. **Na barra de endereço, digitar:**
   ```
   \\wsl$\Ubuntu\home\josemarioramos\secured-guard
   ```

4. **Clicar em "Select Folder"**

5. **✅ Pronto!** Cursor está acessando o projeto no WSL

### **Vantagens:**
- ✅ Edita arquivos diretamente no WSL
- ✅ Terminal integrado já em WSL bash
- ✅ Hot reload funciona perfeitamente
- ✅ Performance máxima

---

## 🔄 Método 2: Trabalhar no Windows + Sincronizar

### **Workflow:**

1. **Editar no Windows** (Cursor abre `C:\dev\secured-guard`)
2. **Sincronizar para WSL** quando quiser testar:
   ```powershell
   .\sync-to-wsl.ps1
   ```
3. **Rodar no WSL:**
   ```bash
   wsl
   cd ~/secured-guard
   ./scripts/start-local.sh
   ```

### **Quando Usar:**
- ✅ Prefere trabalhar em `C:\dev\`
- ✅ Usa outras ferramentas Windows
- ✅ Faz commits pelo Windows

---

## 🎯 Configuração do Terminal Integrado

### **Cursor com Terminal WSL:**

Quando abrir a pasta WSL, o terminal integrado (`Ctrl+``) já abre em **bash do WSL** automaticamente!

```bash
# Terminal integrado já está em WSL
josemarioramos@NOTESONY:~/secured-guard$ 

# Pode executar comandos diretamente:
./scripts/start-local.sh
docker-compose -f docker-compose.local.yml ps
```

---

## 📁 Acessar Arquivos WSL do Windows

### **Via Explorer:**

1. **Abrir Windows Explorer**
2. **Barra de endereços:**
   ```
   \\wsl$\Ubuntu\home\josemarioramos\secured-guard
   ```
3. **Adicionar aos favoritos** (arrastar para Quick Access)

### **Atalho de Teclado:**

`Win + R` → Digitar:
```
\\wsl$\Ubuntu\home\josemarioramos
```

---

## 🔄 Workflow Recomendado

### **Setup Inicial (Uma Vez):**

```powershell
# No Windows (PowerShell)
cd C:\dev\secured-guard
.\sync-to-wsl.ps1
```

### **Dia a Dia:**

**Opção A - Trabalhar no WSL (Recomendado):**
```
1. Abrir Cursor → File → Open Folder
2. Digitar: \\wsl$\Ubuntu\home\josemarioramos\secured-guard
3. Terminal integrado (Ctrl+`): ./scripts/start-local.sh
4. Editar arquivos normalmente
5. Hot reload automático ✅
```

**Opção B - Trabalhar no Windows:**
```
1. Editar arquivos em C:\dev\secured-guard no Cursor
2. Quando quiser testar: .\sync-to-wsl.ps1
3. No WSL: cd ~/secured-guard && ./scripts/start-local.sh
```

---

## 🎨 Extensões Úteis do Cursor/VS Code

### **Para WSL:**

- **WSL** (oficial Microsoft) - Abre projetos no WSL
- **Remote Development** - Suite completa
- **Docker** - Gerenciar containers
- **GitLens** - Git enhanced

### **Instalar Extensão:**

1. Abrir pasta WSL no Cursor
2. Extensions → Pesquisar "WSL"
3. Instalar

---

## 💡 Dicas Avançadas

### **Configurar Git no WSL:**

```bash
# No WSL
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Usar mesmas credenciais do Windows
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

### **Alias Úteis:**

Adicionar ao `~/.bashrc` no WSL:

```bash
# Aliases Secured Guard
alias sg='cd ~/secured-guard'
alias sg-start='cd ~/secured-guard && ./scripts/start-local.sh'
alias sg-stop='cd ~/secured-guard && docker-compose -f docker-compose.local.yml down'
alias sg-logs='cd ~/secured-guard && docker-compose -f docker-compose.local.yml logs -f'
alias sg-sync='cd /mnt/c/dev/secured-guard && ./sync-to-wsl.ps1'
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

## 🎯 Resumo Rápido

### **Para Abrir Projeto no Cursor:**

```
File → Open Folder → \\wsl$\Ubuntu\home\josemarioramos\secured-guard
```

### **Para Sincronizar (Windows → WSL):**

```powershell
.\sync-to-wsl.ps1
```

### **Para Rodar Docker (WSL):**

```bash
cd ~/secured-guard && ./scripts/start-local.sh
```

---

## ✅ AGORA EXECUTE NO WSL:

```bash
cd ~/secured-guard && ./scripts/start-local.sh
```

**Tudo vai funcionar!** 🚀

---

**Última atualização:** 03/12/2025





























