# ✅ **BOTÃO DE FICHA CONTABILIDADE IMPLEMENTADO**

## 📍 **Localização:**
O botão **"GERAR FICHA DE CONTABILIDADE"** agora está implementado no modal de cadastro/edição de funcionários.

### **Arquivo Modificado:**
```
frontend/src/components/funcionarios/FuncionarioNovoModal.tsx
```

## 🔍 **Onde Aparece?**

O botão aparecerá **APENAS quando**:
- ✅ Você está **EDITANDO** um funcionário existente (não em modo de criação)
- ✅ O funcionário já foi salvo e tem um ID válido

### **Posição:**
O botão aparece no **canto esquerdo inferior** do rodapé do modal, antes dos botões "Limpar Formulário", "Cancelar" e "Cadastrar Funcionário".

## 🎨 **Visual:**
```tsx
<AccountingFormButton
  employeeId={employeeToEdit.id}
  employeeName={employeeToEdit.name || 'Funcionário'}
  variant="outline"
  className="border-red-500 text-red-400 hover:bg-red-500/10"
/>
```

## 🧪 **Como Testar:**

### **1. Acesse o Sistema:**
- Local: `http://localhost:3000`
- CI: `https://ci.z7botsolutions.com.br`

### **2. Navegue até Funcionários:**
- Menu **"Gestão de Funcionários"** → **"Funcionários"**

### **3. Clique em EDITAR um funcionário existente:**
- Não crie um novo, apenas **edite um existente**

### **4. Role até o final do formulário:**
- Você verá o botão **"GERAR FICHA DE CONTABILIDADE"** à esquerda

### **5. Clique no botão:**
- Um dropdown aparecerá com 3 opções:
  - 👁️ **Visualizar** - Abre em nova aba
  - 💾 **Baixar** - Download do PDF
  - 🖨️ **Imprimir** - Abre caixa de impressão

## 📝 **O Que Foi Implementado:**

### **Backend:**
- ✅ `AccountingFormService.java` - Gera PDF com dados do funcionário
- ✅ `AccountingFormController.java` - Endpoint REST `/api/accounting/form/{id}/pdf`
- ✅ Template HTML profissional com seções:
  - Dados Pessoais
  - Documentos (PIS, CTPS, CNH, etc.)
  - Dados Profissionais
  - Dados Familiares
  - FGTS e PIS/PASEP
  - Assinaturas

### **Frontend:**
- ✅ `accountingFormService.ts` - Serviço para chamar backend
- ✅ `AccountingFormButton.tsx` - Componente reutilizável
- ✅ Integrado no `FuncionarioNovoModal.tsx`

## 🚀 **Próximos Passos:**

1. **Faça o commit manualmente:**
   ```bash
   git add .
   git commit -m "feat: Adiciona botão de Ficha Contabilidade no modal de funcionário"
   git push origin ci
   ```

2. **Aguarde o deploy (5-10 minutos)**

3. **Teste no ambiente CI:**
   - Edite um funcionário
   - Clique no botão de Ficha Contabilidade
   - Teste as 3 opções (Visualizar, Baixar, Imprimir)

## 📸 **Como Aparecerá:**

Quando você estiver **EDITANDO** um funcionário, o rodapé do modal ficará assim:

```
┌────────────────────────────────────────────────┐
│  [GERAR FICHA DE CONTABILIDADE]  Limpar  Cancelar  [Cadastrar] │
└────────────────────────────────────────────────┘
```

**O botão só aparece quando você ESTÁ EDITANDO um funcionário já salvo!** ✅

