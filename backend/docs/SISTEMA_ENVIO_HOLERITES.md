# 📄 SISTEMA DE ENVIO DE HOLERITES - SECURED GUARD

## 🎯 **VISÃO GERAL**

Sistema completo para processamento, organização e envio automático de holerites por **Email** e **WhatsApp**.

---

## 🏗️ **ARQUITETURA IMPLEMENTADA**

### **Backend (Spring Boot)**

#### **📁 Modelos**
- `Funcionario.java` - Dados de funcionários com contatos
- `Payslip.java` - Holerites processados (existente)

#### **🗄️ Repositórios**
- `FuncionarioRepository.java` - Operações de banco para funcionários
- `PayslipRepository.java` - Operações de banco para holerites (existente)

#### **⚙️ Serviços**
- `PayslipService.java` - Processamento de PDFs e organização em pastas
- `FuncionarioService.java` - Gestão de dados de funcionários
- `EnvioService.java` - Coordenação de envios (email + WhatsApp)
- `EmailService.java` - Envio de emails com anexos
- `WhatsAppService.java` - Envio via WhatsApp (placeholder)

#### **🌐 Controllers**
- `EnvioController.java` - Endpoints de envio
- `FuncionarioController.java` - Gestão de funcionários

#### **📊 Banco de Dados**
- Tabela `funcionarios` - Dados de contato e caminhos dos PDFs
- Tabela `payslips` - Holerites processados (existente)

---

## 📂 **ESTRUTURA DE PASTAS**

```
/backend/holerites/
└── MM-YYYY/
    ├── CPF-Nome_Funcionario/
    │   └── holerite.pdf
    └── CPF-Nome_Funcionario/
        └── holerite.pdf
```

**Exemplo:**
```
/backend/holerites/
└── 06-2025/
    ├── 12345678900-Joao_Silva/
    │   └── holerite.pdf
    └── 98765432100-Maria_Souza/
        └── holerite.pdf
```

---

## 🚀 **ENDPOINTS DA API**

### **📤 Envio de Holerites**

#### **Envio Individual**
```http
POST /api/envio/individual
Content-Type: application/json

{
  "tipo": "email",
  "funcionarioId": 1,
  "assunto": "Holerite - Janeiro 2025",
  "mensagem": "Segue em anexo seu holerite."
}
```

#### **Envio em Massa**
```http
POST /api/envio/massa
Content-Type: application/json

{
  "tipo": "whatsapp",
  "funcionarioIds": [1, 2, 3],
  "mensagem": "Seu holerite está disponível."
}
```

#### **Envio para Todos**
```http
POST /api/envio/todos
Content-Type: application/json

{
  "tipo": "email",
  "assunto": "Holerite - Janeiro 2025",
  "mensagem": "Segue em anexo seu holerite."
}
```

### **👥 Gestão de Funcionários**

#### **Listar Todos**
```http
GET /api/funcionarios
```

#### **Buscar por CPF**
```http
GET /api/funcionarios/cpf/12345678900
```

#### **Criar Funcionário**
```http
POST /api/funcionarios
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "12345678900",
  "email": "joao.silva@email.com",
  "telefone": "11987654321",
  "possuiWhatsapp": true
}
```

#### **Atualizar Funcionário**
```http
PUT /api/funcionarios/1
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "12345678900",
  "email": "joao.silva@email.com",
  "telefone": "11987654321",
  "possuiWhatsapp": true
}
```

---

## ⚙️ **CONFIGURAÇÃO**

### **1. Configuração de Email**

Edite o arquivo `application-dev.properties`:

```properties
# Configuração Gmail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu-email@gmail.com
spring.mail.password=sua-senha-de-app
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.from=SecuredGuard <seu-email@gmail.com>
```

**⚠️ IMPORTANTE:** Para Gmail, use **Senha de App** (não a senha normal).

### **2. Configuração de WhatsApp**

O `WhatsAppService` está configurado como **placeholder**. Para integração real:

1. **Twilio WhatsApp API**
2. **WhatsApp Business API**
3. **Outras APIs de terceiros**

### **3. Executar Migration**

```bash
# A migration V101__create_funcionarios_table.sql será executada automaticamente
# ao iniciar a aplicação
```

---

## 🔄 **FLUXO DE PROCESSAMENTO**

### **1. Upload de PDF**
```
PDF Original → PayslipService → Extração de Dados → Organização em Pastas → 
Registro no Banco → Interface de Envio
```

### **2. Organização Automática**
- **Pasta por período:** `/MM-YYYY/`
- **Subpasta por funcionário:** `/CPF-Nome/`
- **Arquivo:** `holerite.pdf`

### **3. Registro no Banco**
- **Tabela `payslips`:** Holerites processados
- **Tabela `funcionarios`:** Dados de contato e caminhos

### **4. Envio Automático**
- **Email:** Com anexo PDF
- **WhatsApp:** Com arquivo PDF (quando implementado)

---

## 🛡️ **SEGURANÇA**

### **Permissões por Endpoint**

| **Endpoint** | **ADMIN** | **RH** | **SUPERVISOR** |
|--------------|-----------|--------|----------------|
| `/api/envio/individual` | ✅ | ✅ | ✅ |
| `/api/envio/massa` | ✅ | ✅ | ❌ |
| `/api/envio/todos` | ✅ | ✅ | ❌ |
| `/api/funcionarios` | ✅ | ✅ | ✅ |
| `/api/funcionarios/{id}` | ✅ | ✅ | ❌ |

---

## 📊 **BANCO DE DADOS**

### **Tabela `funcionarios`**

```sql
CREATE TABLE funcionarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    possui_whatsapp BOOLEAN DEFAULT false,
    caminho_pdf VARCHAR(512),
    mes_referencia VARCHAR(10),
    ano_referencia VARCHAR(4),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### **Índices**
- `idx_funcionarios_cpf` - Busca por CPF
- `idx_funcionarios_email` - Busca por email
- `idx_funcionarios_whatsapp` - Funcionários com WhatsApp
- `idx_funcionarios_periodo` - Busca por período

---

## 🧪 **TESTES**

### **1. Testar Upload de PDF**
```bash
curl -X POST http://localhost:8080/api/payslips/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@holerites.pdf"
```

### **2. Testar Envio Individual**
```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "tipo": "email",
    "funcionarioId": 1,
    "assunto": "Teste",
    "mensagem": "Teste de envio"
  }'
```

### **3. Testar Listagem de Funcionários**
```bash
curl -X GET http://localhost:8080/api/funcionarios \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🚀 **PRÓXIMOS PASSOS**

### **Fase 2: Frontend React**
- [ ] Interface de listagem de funcionários
- [ ] Botões de envio individual e em massa
- [ ] Modais de configuração de envio
- [ ] Feedback visual de status

### **Fase 3: Integração WhatsApp**
- [ ] Implementar API real de WhatsApp
- [ ] Configuração de credenciais
- [ ] Testes de envio

### **Fase 4: Melhorias**
- [ ] Templates de email personalizáveis
- [ ] Relatórios de envio
- [ ] Agendamento de envios
- [ ] Notificações de falha

---

## 📝 **NOTAS IMPORTANTES**

1. **Configuração de Email:** Configure corretamente as credenciais SMTP
2. **Senha de App:** Para Gmail, gere uma senha de app específica
3. **Permissões:** Verifique as permissões de usuário antes de usar
4. **WhatsApp:** Implementação atual é simulada
5. **Backup:** Mantenha backup dos PDFs organizados

---

## 🆘 **SUPORTE**

Para dúvidas ou problemas:
1. Verifique os logs da aplicação
2. Confirme as configurações de email
3. Teste os endpoints individualmente
4. Verifique as permissões de usuário 