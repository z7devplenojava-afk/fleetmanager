# 🧹 Limpar Service Worker e Cache do PWA

## 🎯 **PROBLEMA:**

O PWA (Progressive Web App) está **cacheando a versão antiga** com encoding corrompido!

---

## ✅ **SOLUÇÃO (Executar no navegador):**

### **1. Abrir DevTools:**
- Pressione **F12**

### **2. Ir para Application (ou Aplicativo):**
- Clique na aba **"Application"** (Chrome/Edge)
- OU **"Armazenamento"** (Firefox)

### **3. Limpar Service Workers:**
- **Service Workers** (menu esquerdo)
- Encontre `http://localhost:3000`
- Clique em **"Unregister"** ou **"Cancelar registro"**

### **4. Limpar todo o cache:**
- **Storage** → **Clear site data**
- OU **Armazenamento** → **Limpar dados do site**
- Marcar:
  - ✅ Local Storage
  - ✅ Session Storage
  - ✅ Cookies
  - ✅ Cache Storage
- Clicar em **"Clear data"**

### **5. Recarregar:**
- Feche o DevTools
- Pressione **Ctrl+Shift+R** (hard reload)

---

## 🔧 **OU MANEIRA RÁPIDA:**

### **No Chrome/Edge:**
1. **F12** (DevTools)
2. **Clique e SEGURE** no botão de reload (🔄)
3. Selecione: **"Empty Cache and Hard Reload"**

---

## ⚠️ **SE AINDA NÃO FUNCIONAR:**

### **Limpar TUDO do navegador:**

1. **Ctrl+Shift+Delete**
2. Selecione:
   - ✅ Cookies
   - ✅ Cache
   - ✅ Dados de aplicativos
3. Período: **"Todo o tempo"**
4. **Limpar dados**
5. **Fechar e reabrir o navegador**

---

**SERVICE WORKER DESABILITADO E INSTRUÇÕES CRIADAS!** 🧹✅

