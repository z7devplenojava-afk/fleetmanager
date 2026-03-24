# 📊 **ANÁLISE COMPLETA: Sistema de Envio de Documentos**

## 🔍 **O QUE JÁ ESTÁ IMPLEMENTADO:**

### ✅ **1. Estrutura de Dados:**

#### **Employee (Funcionário):**
```java
- phone: String           // Telefone no cadastro de funcionário
- email: String          // Email no cadastro de funcionário
- document (CPF): String // Identificador único
```

#### **User (Usuário do Sistema):**
```java
- whatsapp: String       // Número de WhatsApp (9-20 dígitos)
- email: String          // Email obrigatório
- username: String       // CPF do usuário
```

**📌 IMPORTANTE:** 
- `Employee.phone` ≠ `User.whatsapp`
- Para enviar WhatsApp, o sistema busca o número em `User.whatsapp`
- A relação é feita por CPF: `Employee.document` = `User.username`

---

### ✅ **2. Serviços Já Implementados:**

#### **A. EnvioService.java** (✅ Completo)
Gerencia envio de holerites por email e WhatsApp.

**Funcionalidades:**
- ✅ Envio individual
- ✅ Envio em massa
- ✅ Envio por tipo (email/whatsapp)
- ✅ Validação de dados (email, WhatsApp, CPF)
- ✅ Registro de logs de entrega
- ✅ Retry automático (5 minutos após falha)

**Validações WhatsApp:**
```java
// 1. Verifica se existe User com o CPF do Employee
Optional<User> userOpt = userRepository.findByUsername(employee.getDocument());

// 2. Verifica se User tem WhatsApp cadastrado
if (userOpt.isEmpty()) {
    erro = "CPF não cadastrado na tabela users";
}

// 3. Verifica se WhatsApp não está vazio
if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
    erro = "WhatsApp não cadastrado na tabela users para CPF";
}

// 4. Valida formato (apenas números, 10-13 dígitos)
String normalized = whatsappNumber.replaceAll("[^0-9]", "");
if (normalized.length() < 10 || normalized.length() > 13) {
    erro = "Número de WhatsApp em formato inválido";
}
```

**Endpoints Existentes:**
- `POST /api/payroll/enviar-holerite` - Envio individual/massa
- `POST /api/payroll/{employeeId}/{month}/{year}/send-email` - Envio por email

#### **B. EmailService.java** (✅ Implementado)
- ✅ Envio de emails com anexos
- ✅ Templates personalizáveis
- ✅ Suporta JavaMailSender (SMTP)

#### **C. WhatsAppService.java** (⚠️ Parcial)
- ✅ Geração de link WhatsApp
- ✅ Validação de número
- ⚠️ Envio real via API não totalmente configurado
- ⚠️ Usa BaileysRestService (não oficial - risco de bloqueio)

#### **D. NotificationService.java** (✅ Implementado)
- ✅ Sistema de notificações
- ✅ Agendamento de alertas
- ✅ Configurações por empresa/usuário

---

### ✅ **3. Tabelas no Banco de Dados:**

#### **users:**
```sql
- id: UUID
- username: String (CPF)
- email: String (obrigatório)
- whatsapp: String (opcional, 9-20 dígitos)
```

#### **employees:**
```sql
- id: UUID
- document: String (CPF)
- phone: String
- email: String
- user_id: UUID (FK para users)
```

#### **payslip_delivery_logs:**
```sql
- id: UUID
- cpf: String
- month: Integer
- year: Integer
- channel: Enum (EMAIL, WHATSAPP, SMS)
- success: Boolean
- retry_count: Integer
- error_message: String
- sent_at: Timestamp
```

#### **notification_settings:**
```sql
- id: UUID
- company_id: UUID
- user_id: UUID
- email_enabled: Boolean
- whatsapp_enabled: Boolean
- smtp_host, smtp_port, smtp_username, smtp_password
- whatsapp_contract_updates, whatsapp_payment_received
```

---

## 🎯 **FLUXO ATUAL DE ENVIO:**

### **1. Envio de Holerite por WhatsApp:**

```
1. Frontend → POST /api/payroll/enviar-holerite
   {
     "tipo": "whatsapp",
     "funcionarioId": "uuid"
   }

2. EnvioService.enviarIndividual()
   ↓
3. Busca Employee por ID
   ↓
4. Busca User por CPF (employee.document)
   ↓
5. Verifica se User.whatsapp existe e é válido
   ↓
6. Se válido:
   - Localiza último holerite do CPF
   - Envia via WhatsAppService
   - Registra log em payslip_delivery_logs
   ↓
7. Se falhar:
   - Registra erro
   - Agenda retry em 5 minutos
```

### **2. Problema Identificado:**

❌ **Quando selecionar documento para envio, o sistema deve:**
1. Verificar se o funcionário tem `User` correspondente (por CPF)
2. Verificar se esse `User` tem WhatsApp cadastrado
3. **Se não tiver**, solicitar ao usuário:
   - Cadastrar novo usuário com WhatsApp
   - OU atualizar usuário existente adicionando WhatsApp

---

## 💡 **SOLUÇÃO PROPOSTA:**

### **Fase 1: Validação Pré-Envio (Frontend + Backend)**

#### **A. Novo Endpoint de Validação:**

```java
@PostMapping("/validate-contacts")
public ResponseEntity<ContactValidationResponse> validateContactsForSending(
    @RequestBody ContactValidationRequest request
) {
    // request.employeeIds: List<UUID>
    // request.type: "email" | "whatsapp" | "both"
    
    List<ContactValidationDetail> details = new ArrayList<>();
    
    for (UUID empId : request.getEmployeeIds()) {
        Employee emp = employeeRepository.findById(empId).orElse(null);
        if (emp == null) continue;
        
        ContactValidationDetail detail = new ContactValidationDetail();
        detail.setEmployeeId(empId);
        detail.setEmployeeName(emp.getName());
        detail.setEmployeeCpf(emp.getDocument());
        detail.setEmployeeEmail(emp.getEmail());
        detail.setEmployeePhone(emp.getPhone());
        
        // Buscar User correspondente
        Optional<User> userOpt = userRepository.findByUsername(emp.getDocument());
        
        if (userOpt.isEmpty()) {
            detail.setHasUser(false);
            detail.setUserEmail(null);
            detail.setUserWhatsapp(null);
            detail.setNeedsUserCreation(true);
        } else {
            User user = userOpt.get();
            detail.setHasUser(true);
            detail.setUserId(user.getId());
            detail.setUserEmail(user.getEmail());
            detail.setUserWhatsapp(user.getWhatsapp());
            detail.setNeedsWhatsappUpdate(user.getWhatsapp() == null || user.getWhatsapp().trim().isEmpty());
        }
        
        // Validar de acordo com o tipo de envio
        if ("email".equals(request.getType())) {
            detail.setCanSendEmail(emp.getEmail() != null && !emp.getEmail().trim().isEmpty());
        } else if ("whatsapp".equals(request.getType())) {
            detail.setCanSendWhatsapp(
                userOpt.isPresent() && 
                userOpt.get().getWhatsapp() != null && 
                !userOpt.get().getWhatsapp().trim().isEmpty()
            );
        } else { // both
            detail.setCanSendEmail(emp.getEmail() != null && !emp.getEmail().trim().isEmpty());
            detail.setCanSendWhatsapp(
                userOpt.isPresent() && 
                userOpt.get().getWhatsapp() != null && 
                !userOpt.get().getWhatsapp().trim().isEmpty()
            );
        }
        
        details.add(detail);
    }
    
    ContactValidationResponse response = new ContactValidationResponse();
    response.setDetails(details);
    response.setTotalEmployees(details.size());
    response.setReadyToSend(details.stream().filter(d -> d.isCanSendEmail() || d.isCanSendWhatsapp()).count());
    response.setNeedingAction(details.stream().filter(d -> d.isNeedsUserCreation() || d.isNeedsWhatsappUpdate()).count());
    
    return ResponseEntity.ok(response);
}
```

---

### **Fase 2: Interface de Correção (Frontend)**

#### **Modal de Validação de Contatos:**

```tsx
// Componente: ContactValidationModal.tsx

interface ContactValidationModalProps {
  open: boolean;
  onClose: () => void;
  employeeIds: string[];
  documentType: 'holerite' | 'comprovante' | 'unificado';
  sendType: 'email' | 'whatsapp' | 'both';
  onValidated: (validatedIds: string[]) => void;
}

// Fluxo:
// 1. Chama /validate-contacts
// 2. Mostra lista de funcionários:
//    ✅ Verde: Pronto para enviar
//    ⚠️ Amarelo: Falta WhatsApp (botão "Adicionar WhatsApp")
//    ❌ Vermelho: Sem usuário (botão "Criar Usuário")
//
// 3. Para cada problema:
//    - Botão inline para corrigir
//    - Abre mini-modal com formulário
//    - Após salvar, re-valida
//
// 4. Quando todos estão ✅, habilita botão "Enviar Agora"
```

#### **Exemplo de UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  📤 Validar Contatos para Envio                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tipo de Envio: [📧 Email] [📱 WhatsApp] [✓ Ambos]         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ ABRAAO MALDONADO                                   │ │
│  │    Email: abraao@example.com                         │ │
│  │    WhatsApp: (11) 99999-9999                         │ │
│  │    Status: Pronto para enviar                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ⚠️ ALINE GONCALVES PEREIRA                           │ │
│  │    Email: aline@example.com                          │ │
│  │    WhatsApp: Não cadastrado                          │ │
│  │    [➕ Adicionar WhatsApp]                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ❌ CARLOS SILVA                                       │ │
│  │    CPF: 123.456.789-00                               │ │
│  │    Usuário não cadastrado no sistema                 │ │
│  │    [➕ Criar Usuário]                                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  ───────────────────────────────────────────────────────   │
│  Total: 3 funcionários                                      │
│  ✅ Prontos: 1   ⚠️ Ação necessária: 2                    │
│                                                              │
│  [Cancelar]                    [Enviar Agora] (desabilitado)│
└─────────────────────────────────────────────────────────────┘
```

---

### **Fase 3: Endpoints de Correção Rápida**

#### **A. Criar Usuário Mínimo:**

```java
@PostMapping("/quick-create-user")
public ResponseEntity<User> quickCreateUserForEmployee(@RequestBody QuickUserRequest request) {
    // request.employeeId, request.whatsapp, request.email (opcional)
    
    Employee emp = employeeRepository.findById(request.getEmployeeId()).orElseThrow();
    
    User user = User.builder()
        .username(emp.getDocument()) // CPF
        .password(passwordEncoder.encode(emp.getDocument() + "@2025")) // Senha padrão
        .email(request.getEmail() != null ? request.getEmail() : emp.getEmail())
        .name(emp.getName())
        .whatsapp(request.getWhatsapp())
        .status(UserStatus.ACTIVE)
        .active(true)
        .roles(Set.of(roleRepository.findByName("ROLE_COLABORADOR").orElseThrow()))
        .build();
    
    User saved = userRepository.save(user);
    
    // Atualizar Employee.user_id
    emp.setUser(saved);
    employeeRepository.save(emp);
    
    return ResponseEntity.ok(saved);
}
```

#### **B. Atualizar WhatsApp de Usuário:**

```java
@PatchMapping("/users/{userId}/whatsapp")
public ResponseEntity<User> updateUserWhatsApp(
    @PathVariable UUID userId,
    @RequestBody UpdateWhatsAppRequest request
) {
    User user = userRepository.findById(userId).orElseThrow();
    
    // Validar formato
    String normalized = request.getWhatsapp().replaceAll("[^0-9]", "");
    if (normalized.length() < 10 || normalized.length() > 13) {
        throw new BadRequestException("Número de WhatsApp inválido");
    }
    
    user.setWhatsapp(normalized);
    User updated = userRepository.save(user);
    
    return ResponseEntity.ok(updated);
}
```

---

## 📋 **IMPLEMENTAÇÃO RECOMENDADA:**

### **Fase 1: Backend (3-4 horas)**
1. ✅ Criar DTOs (ContactValidationRequest, Response, Detail)
2. ✅ Criar endpoint `/validate-contacts`
3. ✅ Criar endpoint `/quick-create-user`
4. ✅ Criar endpoint `/users/{id}/whatsapp` (PATCH)
5. ✅ Testes unitários

### **Fase 2: Frontend (4-5 horas)**
1. ✅ Criar `ContactValidationModal.tsx`
2. ✅ Criar `QuickUserFormModal.tsx`
3. ✅ Criar `WhatsAppUpdateModal.tsx`
4. ✅ Integrar em `Holerites.tsx`, `DocumentosUnificados.tsx`
5. ✅ Adicionar botão "Enviar Selecionados" com validação

### **Fase 3: Melhorias (2-3 horas)**
1. ✅ Adicionar preview da mensagem
2. ✅ Permitir editar mensagem antes do envio
3. ✅ Dashboard de status de envio
4. ✅ Histórico de envios

---

## 🚀 **PRÓXIMOS PASSOS:**

**1. Confirmar Abordagem:**
   - Validação pré-envio com modal de correção?
   - Criar usuários automaticamente ou pedir confirmação?

**2. Iniciar Implementação:**
   - Fase 1: Backend (validação + endpoints de correção)
   - Fase 2: Frontend (modais de validação)
   - Fase 3: Integração completa

**3. Decidir sobre WhatsApp API:**
   - Trocar BaileysRestService por API oficial (Twilio/Meta)?
   - Configurar credenciais de produção?

---

## ❓ **PERGUNTAS PARA O USUÁRIO:**

1. **Deseja que eu implemente a Fase 1 (Backend) agora?**
2. **Criar usuário automaticamente ou pedir confirmação?**
3. **Já tem conta Twilio/Meta para WhatsApp oficial?**
4. **Quer preview da mensagem antes do envio?**
5. **Envio deve ser imediato ou em fila (background)?**

**Confirme e eu começo a implementação! 💪**

