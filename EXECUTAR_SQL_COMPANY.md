# 🚨 URGENTE - Adicionar coluna company_id

## 📅 Data: 17/10/2025

---

## ❌ **ERRO ATUAL**

```
ERRO: coluna "company_id" da relação "employees" não existe
```

---

## ✅ **SOLUÇÃO**

Execute o arquivo: **`adicionar_company_id.sql`** no DBeaver

---

## 📋 **PASSO A PASSO**

### **1. Abra o DBeaver**

### **2. Conecte no banco `secured_guard_test`**

### **3. Abra o arquivo**
- `File` → `Open File`  
- Selecione: `adicionar_company_id.sql`

### **4. Execute**
- Clique em **"Execute SQL Script"**
- OU pressione `Ctrl + X`

### **5. Verifique se funcionou**

Deve retornar:
```
company_id | uuid
```

---

## 🚀 **APÓS EXECUTAR**

1. **Reinicie o backend**:
   ```powershell
   java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
   ```

2. **Aguarde 30 segundos**

3. **Teste no Postman** com `POSTMAN_MARIA_SEM_IDS.json`

---

## ✅ **AGORA VAI FUNCIONAR!**

Após adicionar `company_id`, todas as colunas estarão completas! 🎉

**Execute o SQL e me avise! 🚀**
