# 🔍 VALIDAÇÃO DE WHATSAPP POR CPF

## 📋 **VISÃO GERAL**

O sistema agora implementa uma validação robusta para garantir que o envio de holerites via WhatsApp só aconteça quando:

1. ✅ **O funcionário existe na tabela `employees`**
2. ✅ **Existe um usuário correspondente na tabela `users` com o mesmo CPF**
3. ✅ **O campo `whatsapp` na tabela `users` está preenchido**

---

## 🏗️ **ARQUITETURA DA VALIDAÇÃO**

### **Fluxo de Validação:**

```
Frontend (Holerites) 
    ↓
EnvioController (/api/envio/individual)
    ↓
EnvioService.processarEnvio()
    ↓
🔍 VALIDAÇÃO: Employee.document (CPF) → User.username (CPF)
    ↓
✅ Se encontrado: User.whatsapp → WhatsAppService
❌ Se não encontrado: Erro "Usuário não encontrado na tabela users"
```

### **Estrutura das Tabelas:**

#### **Tabela `employees`:**
- `id` (UUID)
- `document` (CPF do funcionário)
- `name` (Nome do funcionário)
- `phone` (Telefone - **NÃO usado para WhatsApp**)
- `caminho_pdf` (Caminho do holerite processado)

#### **Tabela `users`:**
- `id` (UUID)
- `username` (CPF do usuário - **CHAVE DE LIGAÇÃO**)
- `name` (Nome do usuário)
- `whatsapp` (Número do WhatsApp - **USADO PARA ENVIO**)

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **1. EnvioService.java - Validação Principal:**

```java
private EnvioResponse.DetalheEnvio processarEnvio(Employee employee, EnvioRequest request) {
    // ... código existente ...
    
    if ("whatsapp".equals(request.getTipo())) {
        // 🔍 VALIDAÇÃO: Verificar se existe User com CPF correspondente
        String cpf = employee.getDocument();
        Optional<User> userOpt = userRepository.findByUsername(cpf);
        
        if (userOpt.isEmpty()) {
            detalhe.setErro("Usuário não encontrado na tabela users para CPF: " + cpf);
            return detalhe;
        }
        
        User user = userOpt.get();
        String whatsappNumber = user.getWhatsapp();
        
        if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
            detalhe.setErro("WhatsApp não cadastrado na tabela users para CPF: " + cpf);
            return detalhe;
        }
        
        // ✅ WhatsApp encontrado - prosseguir com envio
        whatsAppService.enviarHolerite(whatsappNumber, request.getMensagem(), employee.getCaminhoPdf());
    }
}
```

### **2. EnvioController.java - Endpoint de Verificação:**

```java
@GetMapping("/verificar-whatsapp/{cpf}")
public ResponseEntity<WhatsAppVerificacaoResponse> verificarWhatsApp(@PathVariable String cpf) {
    boolean temWhatsApp = envioService.funcionarioTemWhatsApp(cpf);
    String numeroWhatsApp = envioService.obterWhatsAppFuncionario(cpf);
    
    return ResponseEntity.ok(new WhatsAppVerificacaoResponse(cpf, temWhatsApp, numeroWhatsApp));
}
```

---

## 🧪 **TESTES DE VALIDAÇÃO**

### **1. Testar Verificação de WhatsApp:**

```bash
curl -X GET http://localhost:8081/api/envio/verificar-whatsapp/02047566690
```

**Resposta Esperada:**
```json
{
  "cpf": "02047566690",
  "temWhatsApp": true,
  "numeroWhatsApp": "+55 31 9361-2546"
}
```

### **2. Testar Envio Individual:**

```bash
curl -X POST http://localhost:8081/api/envio/individual \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "funcionarioId": "uuid-do-funcionario",
    "mensagem": "Seu holerite está disponível!"
  }'
```

**Resposta de Sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Envio realizado com sucesso",
  "detalhes": [
    {
      "funcionarioId": "uuid",
      "nome": "ABNER ISAIAS GOMES",
      "cpf": "02047566690",
      "telefone": "+55 31 9361-2546",
      "enviado": true,
      "erro": null
    }
  ]
}
```

**Resposta de Erro (CPF não encontrado):**
```json
{
  "sucesso": false,
  "mensagem": "Falha no envio: Usuário não encontrado na tabela users para CPF: 12345678900",
  "detalhes": [
    {
      "funcionarioId": "uuid",
      "nome": "FUNCIONARIO TESTE",
      "cpf": "12345678900",
      "telefone": null,
      "enviado": false,
      "erro": "Usuário não encontrado na tabela users para CPF: 12345678900"
    }
  ]
}
```

---

## 📊 **CENÁRIOS DE VALIDAÇÃO**

### **✅ Cenário de Sucesso:**
1. Funcionário existe em `employees` com CPF: `02047566690`
2. Usuário existe em `users` com `username`: `02047566690`
3. Campo `whatsapp` em `users` está preenchido: `+55 31 9361-2546`
4. **Resultado:** Envio realizado com sucesso

### **❌ Cenário de Falha - CPF não encontrado:**
1. Funcionário existe em `employees` com CPF: `12345678900`
2. **Usuário NÃO existe em `users` com `username`: `12345678900`**
3. **Resultado:** Erro "Usuário não encontrado na tabela users"

### **❌ Cenário de Falha - WhatsApp não cadastrado:**
1. Funcionário existe em `employees` com CPF: `02047566690`
2. Usuário existe em `users` com `username`: `02047566690`
3. **Campo `whatsapp` em `users` está vazio ou NULL**
4. **Resultado:** Erro "WhatsApp não cadastrado na tabela users"

---

## 🚀 **COMO USAR**

### **1. Verificar WhatsApp de um Funcionário:**
```bash
# Via curl
curl http://localhost:8081/api/envio/verificar-whatsapp/02047566690

# Via PowerShell
.\teste_validacao_whatsapp.ps1
```

### **2. Enviar Holerite via Interface Web:**
1. Acesse: `http://localhost:3000`
2. Vá para a seção **Holerites**
3. Selecione um holerite
4. Clique em **"WhatsApp"**
5. O sistema automaticamente:
   - ✅ Verifica se o CPF existe na tabela `users`
   - ✅ Verifica se o WhatsApp está cadastrado
   - ✅ Envia a mensagem se tudo estiver correto
   - ❌ Mostra erro específico se algo estiver faltando

---

## 🔧 **MANUTENÇÃO**

### **Para Adicionar WhatsApp a um Funcionário:**
1. Verificar se o CPF existe na tabela `users`
2. Se não existir, criar o usuário primeiro
3. Atualizar o campo `whatsapp` na tabela `users`

```sql
-- Exemplo de atualização
UPDATE users 
SET whatsapp = '+55 31 99999-9999' 
WHERE username = '02047566690';
```

### **Para Verificar Dados:**
```sql
-- Verificar funcionários com WhatsApp
SELECT e.document, e.name, u.whatsapp
FROM employees e
JOIN users u ON e.document = u.username
WHERE u.whatsapp IS NOT NULL AND u.whatsapp != '';

-- Verificar funcionários SEM WhatsApp
SELECT e.document, e.name, u.whatsapp
FROM employees e
LEFT JOIN users u ON e.document = u.username
WHERE u.whatsapp IS NULL OR u.whatsapp = '';
```

---

## ✅ **BENEFÍCIOS DA VALIDAÇÃO**

1. **🔒 Segurança:** Garante que só funcionários cadastrados recebam holerites
2. **📊 Rastreabilidade:** Logs detalhados de cada tentativa de envio
3. **🛡️ Prevenção de Erros:** Evita envios para números incorretos
4. **📈 Relatórios:** Permite gerar relatórios de sucesso/falha
5. **🔧 Manutenibilidade:** Fácil identificação de problemas 