# 🔧 Configurar UTF-8 no Windows

## 🎯 **PROBLEMA IDENTIFICADO:**

O Windows estava usando **Code Page 850** (encoding antigo) ao invés de **UTF-8 (65001)**.

Isso causava corrupção de caracteres acentuados em todo o sistema!

---

## ✅ **SOLUÇÃO PERMANENTE:**

### **1. Configurar PowerShell para UTF-8:**

Adicione ao seu perfil do PowerShell:

```powershell
# Abrir perfil do PowerShell
notepad $PROFILE
```

**Adicione esta linha no início do arquivo:**
```powershell
chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

Salve e feche.

---

### **2. Configurar VS Code para UTF-8:**

**Arquivo:** `.vscode/settings.json`

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[typescript]": {
    "files.encoding": "utf8"
  },
  "[typescriptreact]": {
    "files.encoding": "utf8"
  },
  "[javascript]": {
    "files.encoding": "utf8"
  },
  "[json]": {
    "files.encoding": "utf8"
  }
}
```

---

### **3. Configurar IntelliJ IDEA para UTF-8:**

1. **File → Settings**
2. **Editor → File Encodings**
3. Definir:
   - **Global Encoding**: UTF-8
   - **Project Encoding**: UTF-8
   - **Default encoding for properties files**: UTF-8
4. **Marcar:** "Transparent native-to-ascii conversion"
5. **Apply → OK**

---

### **4. Configurar Git para UTF-8:**

```bash
git config --global core.quotepath false
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

---

### **5. Variável de Ambiente (Windows 10/11):**

1. **Painel de Controle → Sistema → Configurações avançadas**
2. **Variáveis de Ambiente**
3. **Adicionar nova variável de sistema:**
   - Nome: `PYTHONIOENCODING`
   - Valor: `utf-8`

---

## ✅ **VERIFICAR SE FUNCIONOU:**

### **No PowerShell:**
```powershell
chcp
# Deve mostrar: Página de código ativa: 65001
```

### **No Git Bash:**
```bash
locale
# Deve mostrar: LC_ALL=C.UTF-8
```

---

## 🔄 **DEPOIS DE CONFIGURAR:**

1. **Feche TODOS os terminais**
2. **Feche VS Code/IntelliJ**
3. **Abra novamente**
4. **Verifique:** `chcp` deve mostrar `65001`

---

**UTF-8 CONFIGURADO PERMANENTEMENTE!** ✅🔤

