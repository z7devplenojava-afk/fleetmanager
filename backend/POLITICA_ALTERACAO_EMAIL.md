# 📧 Política de Alteração de Email

## 🎯 Objetivo

Definir regras claras sobre como usuários podem alterar seus próprios emails, mantendo a segurança e integridade do sistema.

---

## ✅ **SIM, o usuário PODE alterar o próprio email**

### **Endpoint:**
```
PUT /api/profile
Authorization: Bearer {token}

{
  "email": "novo.email@exemplo.com",
  "name": "Nome Completo",
  "whatsapp": "5511999999999"
}
```

---

## 🔒 Regras de Segurança na Alteração

### **1. Email Deve Ser Único**

❌ **BLOQUEADO:** Alterar para email já cadastrado por outro usuário

```json
{
  "message": "Email já está em uso por outro usuário",
  "success": false
}
```

### **2. Padrões de Email Privilegiados São Protegidos**

❌ **BLOQUEADO:** Usuário COLABORADOR tentando usar email com padrão administrativo

**Padrões Bloqueados sem Role Correspondente:**
- `admin.*@promovervigilancia.com.br` → Requer role ADMIN ou SUPER_ADMIN
- `rh.*@promovervigilancia.com.br` → Requer role RH
- `supervisor.*@promovervigilancia.com.br` → Requer role SUPERVISOR
- `financeiro.*@promovervigilancia.com.br` → Requer role FINANCEIRO

**Exemplo de Bloqueio:**
```json
// Usuário com role COLABORADOR tenta:
{
  "email": "admin.teste@promovervigilancia.com.br"
}

// Resposta:
{
  "message": "Você não pode usar um email com padrão de role privilegiado (admin.*, rh.*, supervisor.*, financeiro.*) sem ter o role correspondente",
  "success": false
}
```

### **3. Mudança de Padrão Colaborador É Permitida (com Aviso)**

✅ **PERMITIDO:** Colaborador pode mudar de `colaborador.*@` para email pessoal

**O que acontece:**
- Email é alterado normalmente
- Role COLABORADOR é **MANTIDO** (não muda)
- Sistema registra log de aviso
- Usuário **não perderá acesso**

**Exemplo:**
```json
// Email original (criado automaticamente):
"colaborador.05986003616@promovervigilancia.com.br"

// Pode alterar para:
"joao.silva@gmail.com"
"joao.silva@outlook.com"
"joao@empresa.com.br"

// Role continua: COLABORADOR ✅
```

**Log gerado:**
```
⚠️ Usuário 05986003616 alterando email de padrão colaborador para: joao.silva@gmail.com
   Email anterior: colaborador.05986003616@promovervigilancia.com.br
   Novo email: joao.silva@gmail.com
   ATENÇÃO: Role COLABORADOR será mantido, mas email não segue mais o padrão automático
```

---

## 📋 Cenários de Uso

### **Cenário 1: Colaborador Quer Email Pessoal** ✅

**Situação:**
- Usuário criado automaticamente: `colaborador.12345678901@promovervigilancia.com.br`
- Quer usar email pessoal: `maria.santos@gmail.com`

**Resultado:**
- ✅ Alteração permitida
- ✅ Role COLABORADOR mantido
- ✅ Login continua com CPF (username)
- ✅ Emails de holerite enviados para novo email

### **Cenário 2: Colaborador Tenta Parecer Admin** ❌

**Situação:**
- Usuário com role: COLABORADOR
- Tenta alterar para: `admin.teste@promovervigilancia.com.br`

**Resultado:**
- ❌ Bloqueado!
- ❌ Erro: "Você não pode usar email com padrão privilegiado"
- ✅ Email antigo mantido
- ✅ Sistema seguro

### **Cenário 3: Email Duplicado** ❌

**Situação:**
- Usuário A: `joao@empresa.com`
- Usuário B tenta alterar para: `joao@empresa.com`

**Resultado:**
- ❌ Bloqueado!
- ❌ Erro: "Email já está em uso"
- ✅ Email antigo mantido

### **Cenário 4: Admin Alterando Email** ✅

**Situação:**
- Usuário com role: ADMIN
- Email atual: `admin.sistemas@promovervigilancia.com.br`
- Quer alterar para: `admin.ti@promovervigilancia.com.br`

**Resultado:**
- ✅ Alteração permitida
- ✅ Role ADMIN mantido
- ✅ Padrão privilegiado permitido (tem o role)

---

## 🔄 Impacto da Alteração de Email

### **O que MUDA:**

| Item | Antes | Depois |
|------|-------|--------|
| **Email para Login** | ❌ Não usado (login é CPF) | ❌ Não usado (continua CPF) |
| **Email para Comunicações** | Email antigo | ✅ Email novo |
| **Email para Holerites** | Email antigo | ✅ Email novo |
| **Email para Reset de Senha** | Email antigo | ✅ Email novo |
| **Email para 2FA** | Email antigo | ✅ Email novo |

### **O que NÃO MUDA:**

| Item | Permanece Igual |
|------|----------------|
| **Username (CPF)** | ✅ Mesmo |
| **Senha** | ✅ Mesma |
| **Roles** | ✅ Mesmos |
| **Permissões** | ✅ Mesmas |
| **Histórico** | ✅ Preservado |
| **Holerites Antigos** | ✅ Preservados |

---

## 🎯 Recomendações

### **Para Colaboradores:**

1. ✅ **Use email pessoal se preferir** - Você receberá holerites e comunicados
2. ✅ **Mantenha email atualizado** - Para receber notificações importantes
3. ❌ **Não tente usar padrões administrativos** - Será bloqueado
4. ℹ️ **Login continua com CPF** - Email não é usado para login

### **Para Administradores:**

1. ⚠️ **Monitore mudanças de email** - Logs são gerados automaticamente
2. 🔍 **Verifique relatórios de auditoria** - Para detectar tentativas suspeitas
3. 🔒 **Roles não mudam automaticamente** - Mesmo se email mudar
4. 📧 **Comunique a política** - Usuários devem saber as regras

---

## 🛡️ Segurança

### **Logs de Auditoria:**

Todas as alterações de email geram logs:

```
📧 Email atualizado: colaborador.12345678901@promovervigilancia.com.br -> maria.santos@gmail.com
👤 Perfil atualizado com sucesso para: 12345678901
📝 Log de atividade: PROFILE_UPDATE - Perfil atualizado
```

### **Validações Aplicadas:**

1. ✅ Email único no sistema
2. ✅ Formato de email válido
3. ✅ Padrões privilegiados bloqueados sem role
4. ✅ Logs de todas as alterações
5. ✅ Verificação de duplicatas

---

## 📊 Matriz de Permissões

| Usuário | Email Atual | Pode Alterar Para | Resultado |
|---------|-------------|-------------------|-----------|
| **COLABORADOR** | `colaborador.123@promover...` | `joao@gmail.com` | ✅ PERMITIDO |
| **COLABORADOR** | `colaborador.123@promover...` | `admin.teste@promover...` | ❌ BLOQUEADO |
| **COLABORADOR** | `colaborador.123@promover...` | `outro.colaborador@promover...` | ✅ PERMITIDO |
| **ADMIN** | `admin.ti@promover...` | `admin.sistemas@promover...` | ✅ PERMITIDO |
| **ADMIN** | `admin.ti@promover...` | `joao@gmail.com` | ✅ PERMITIDO |
| **RH** | `rh.depto@promover...` | `rh.pessoal@promover...` | ✅ PERMITIDO |
| **SUPER_ADMIN** | Qualquer | Qualquer (exceto duplicado) | ✅ PERMITIDO |

---

## 🔧 Alteração Manual (Admin)

**SUPER_ADMIN pode alterar email de qualquer usuário via:**

### **1. Interface Administrativa:**
```
Menu: Usuários → Selecionar Usuário → Editar
Campo: Email → Alterar → Salvar
```

### **2. SQL Direto:**
```sql
UPDATE users
SET email = 'novo.email@exemplo.com'
WHERE username = '12345678901';
```

### **3. API (como SUPER_ADMIN):**
```bash
PUT /api/users/{userId}
Authorization: Bearer {SUPER_ADMIN_TOKEN}

{
  "email": "novo.email@exemplo.com"
}
```

---

## ⚠️ Importante

### **Usuários Criados Automaticamente:**

- ✅ Podem alterar email livremente (respeitando regras)
- ✅ Role não muda automaticamente
- ⚠️ Se voltarem ao padrão `colaborador.*@`, continuarão com role atual
- ℹ️ Não há re-atribuição automática de role ao alterar email

### **Exemplo:**

```
1. Usuário criado automaticamente:
   Email: colaborador.123@promovervigilancia.com.br
   Role: COLABORADOR

2. Usuário altera para:
   Email: joao@gmail.com
   Role: COLABORADOR (mantido)

3. Se usuário alterar novamente para:
   Email: colaborador.456@promovervigilancia.com.br
   Role: COLABORADOR (mantido - não muda automaticamente)
```

---

## 📝 Resumo

| Pergunta | Resposta |
|----------|----------|
| **Posso alterar meu email?** | ✅ Sim |
| **Meu role vai mudar?** | ❌ Não, role é mantido |
| **Preciso usar email da empresa?** | ❌ Não, pode ser pessoal |
| **Posso usar email de admin?** | ❌ Só se tiver role de admin |
| **Email duplicado é permitido?** | ❌ Não |
| **Login muda?** | ❌ Não, login continua sendo CPF |
| **Vou perder meus holerites?** | ❌ Não, histórico é preservado |

---

**POLÍTICA DOCUMENTADA E IMPLEMENTADA!** ✅📧🔒

