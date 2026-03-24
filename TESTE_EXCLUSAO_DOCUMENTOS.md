# 🧪 **TESTE: Exclusão de Documentos Unificados**

## 🔍 **Como Testar**

### **1. Preparação**

Backend deve estar rodando com logs visíveis.

### **2. Testar Exclusão Individual**

1. Selecionar 1 documento
2. Clicar "Excluir"
3. Confirmar no modal

**Logs esperados no backend:**
```
🗑️ Excluindo documento unificado: UNIFICADO_JOSE_MARIO_RAMOS_00824310608_9_2025.pdf
✅ Arquivo encontrado em: uploads\unified\expanded\UNIFICADO_JOSE_MARIO_RAMOS_00824310608_9_2025.pdf
✅ Arquivo excluído com sucesso: UNIFICADO_JOSE_MARIO_RAMOS_00824310608_9_2025.pdf
```

**Frontend deve mostrar:**
```
✅ Toast: "Documento excluído com sucesso"
✅ Documento some da lista
```

### **3. Se der erro, verificar:**

#### **Erro 1: "Arquivo não encontrado"**

**Causa:** Nome do arquivo ou caminho incorreto

**Solução:**
```java
// Verificar onde o arquivo realmente está:
dir /s /b C:\dev\secured-guard\uploads\unified\*.pdf

// Ver se o nome do arquivo no frontend é exatamente igual ao físico
```

#### **Erro 2: "Arquivo não pôde ser excluído"**

**Causa:** Arquivo pode estar aberto/bloqueado

**Solução:**
```powershell
# Fechar visualizador de PDF
# Ou executar:
Remove-Item -Force "caminho\do\arquivo.pdf"
```

#### **Erro 3: Nenhum log aparece**

**Causa:** API não está sendo chamada

**Solução:**
```
# Verificar no console do navegador (F12)
# Deve mostrar:
POST /api/unified-documents/delete-multiple
Status: 200 OK
```

### **4. Teste Via cURL (Bypass Frontend)**

```powershell
# Testar exclusão direta
curl -X DELETE http://localhost:8081/api/unified-documents/delete-multiple `
  -H "Content-Type: application/json" `
  -d '["UNIFICADO_JOSE_MARIO_RAMOS_00824310608_9_2025.pdf"]'

# Resposta esperada:
{
  "sucesso": true,
  "mensagem": "Excluídos 1 de 1 documentos",
  "deletedCount": 1,
  "totalCount": 1,
  "failedFiles": []
}
```

### **5. Verificar Permissões de Arquivo**

```powershell
# Ver permissões do arquivo
icacls "C:\dev\secured-guard\uploads\unified\expanded\UNIFICADO_*.pdf"

# Se necessário, dar permissão total:
icacls "C:\dev\secured-guard\uploads\unified" /grant Users:F /t
```

---

## 🐛 **PROBLEMAS COMUNS**

### **Problema 1: Modal fecha mas documento não some**

**Diagnóstico:**
```
✅ Modal fecha
❌ Documento continua na lista
❌ Toast não aparece
```

**Causa:** Frontend não está atualizando lista após exclusão

**Solução:** Verificar se `setUnifiedDocuments` está sendo chamado

---

### **Problema 2: Erro 403 ou 401**

**Diagnóstico:**
```
❌ Console: "403 Forbidden" ou "401 Unauthorized"
```

**Causa:** Token JWT expirado ou permissão negada

**Solução:** 
1. Fazer logout/login
2. Verificar se usuário tem permissão para excluir

---

### **Problema 3: Erro 500**

**Diagnóstico:**
```
❌ Console: "500 Internal Server Error"
❌ Backend: Stack trace
```

**Causa:** Erro no código do backend

**Solução:** Ver logs completos do backend e corrigir

---

## 📝 **CHECKLIST DE DEBUG**

Quando testar exclusão, verificar:

- [ ] Backend está rodando?
- [ ] Frontend está conectado (não há erro CORS)?
- [ ] Logs do backend aparecem quando clica excluir?
- [ ] Console do navegador (F12) mostra a requisição DELETE?
- [ ] Arquivo existe fisicamente em `uploads/unified`?
- [ ] Arquivo não está aberto/bloqueado?
- [ ] Usuário tem permissão para excluir?

---

## 🎯 **TESTE RÁPIDO**

```powershell
# 1. Ver arquivos existentes
Get-ChildItem "uploads\unified" -Recurse -File

# 2. Tentar excluir manualmente
Remove-Item "uploads\unified\expanded\UNIFICADO_*.pdf" -Verbose

# Se funcionar manualmente → problema é no código
# Se não funcionar → problema é permissão/bloqueio
```

---

## ✅ **QUANDO FUNCIONAR**

Deve ver:
1. ✅ Backend: "Arquivo excluído com sucesso"
2. ✅ Frontend: Toast verde "Documento excluído"
3. ✅ Documento some da lista
4. ✅ Arquivo físico deletado

**Se não funcionar, me mostre:**
- Console do navegador (F12 → Network → DELETE request)
- Logs do backend quando clica excluir
- Mensagem de erro exata

