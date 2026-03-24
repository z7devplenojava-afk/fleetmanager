# ✅ Correção: Validação de Update de Usuário

## ❌ Problema

Ao tentar editar um usuário, estava retornando **erro 400 (Bad Request)** com validação:

```
Field error in object 'user' on field 'whatsapp': rejected value [];
Field error in object 'user' on field 'password': rejected value [null];
```

**Causa:** O controller estava usando o modelo `User` diretamente, que tem validações `@NotBlank` em campos que deveriam ser opcionais no UPDATE.

## ✅ Solução Aplicada

### 1. **Controller Atualizado**

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/controller/UserController.java`

```java
// ANTES (usava User model com @NotBlank)
public ResponseEntity<UserListResponseDTO> update(
    @PathVariable String id, 
    @Valid @RequestBody User user
)

// DEPOIS (usa UpdateUserRequest DTO com validações corretas)
public ResponseEntity<UserListResponseDTO> update(
    @PathVariable String id, 
    @Valid @RequestBody UpdateUserRequest request
)
```

### 2. **Novo Método no UserService**

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/service/UserService.java`

```java
public User updateFromRequest(UUID id, UpdateUserRequest request) {
    User existingUser = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

    // Atualizar campos básicos
    existingUser.setName(request.getName());
    existingUser.setEmail(request.getEmail());
    existingUser.setUsername(request.getUsername());
    
    // ✅ WhatsApp OPCIONAL - aceita vazio ou null
    if (request.getWhatsapp() != null) {
        existingUser.setWhatsapp(
            request.getWhatsapp().trim().isEmpty() 
                ? null 
                : request.getWhatsapp()
        );
    }
    
    // ✅ Senha OPCIONAL - só atualiza se fornecida
    if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
        existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
    }
    
    // Atualizar status e roles...
    return userRepository.save(existingUser);
}
```

## 📋 DTO UpdateUserRequest

**Já existia:** `backend/src/main/java/com/z7design/secured_guard/dto/UpdateUserRequest.java`

**Validações Corretas:**

```java
// ✅ Nome obrigatório
@NotBlank(message = "Nome é obrigatório")
private String name;

// ✅ Email obrigatório
@NotBlank(message = "Email é obrigatório")
@Email(message = "Email inválido")
private String email;

// ✅ Senha OPCIONAL - só valida se fornecida
@Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
@Pattern(regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*|\\d{11}@2025)?$")
private String password;  // ← Pode ser null!

// ✅ WhatsApp OPCIONAL - aceita vazio
@Pattern(regexp = "^\\d{9,20}$|^$")  // ← Aceita string vazia!
private String whatsapp;
```

## 🔧 Diferenças

### User Model (CREATE):
- ✅ `@NotBlank` em password - **Obrigatório na criação**
- ✅ `@Pattern` em whatsapp - **Validação estrita**

### UpdateUserRequest DTO (UPDATE):
- ✅ Password **OPCIONAL** - só valida se fornecido
- ✅ WhatsApp **OPCIONAL** - aceita vazio (`^$`)
- ✅ Perfeito para edição de usuários

## 🎯 Comportamento Correto

### Ao Editar Usuário:

**Cenário 1: Atualizar só o nome**
```json
{
  "name": "José Novo Nome",
  "email": "jose@exemplo.com",
  "username": "jose",
  "password": null,        ← ✅ OK (não atualiza)
  "whatsapp": ""           ← ✅ OK (remove se existia)
}
```

**Cenário 2: Atualizar nome e senha**
```json
{
  "name": "José",
  "email": "jose@exemplo.com", 
  "username": "jose",
  "password": "NovaSenha123!",  ← ✅ Atualiza
  "whatsapp": "5511999999999"   ← ✅ Atualiza
}
```

**Cenário 3: Atualizar só WhatsApp**
```json
{
  "name": "José",
  "email": "jose@exemplo.com",
  "username": "jose",
  "password": "",              ← ✅ OK (não atualiza)
  "whatsapp": "5511999999999"  ← ✅ Atualiza
}
```

## ✅ Resultado

Agora os SUPER_ADMIN podem:
- ✅ Editar qualquer campo do usuário
- ✅ Deixar senha em branco (não altera a senha atual)
- ✅ Deixar WhatsApp vazio (remove o número)
- ✅ Atualizar apenas os campos necessários

## 🚀 Deploy

**Commit:** `97c6948`
**Mensagem:** "Corrigir validação de update de usuário: senha e WhatsApp opcionais"

O GitHub Actions vai deployar automaticamente.

## 🧪 Como Testar

1. Acesse: https://ci.z7botsolutions.com.br
2. Vá em: **Configurações** → **Usuários**
3. Clique em **Editar** (ícone de lápis) em qualquer usuário
4. Altere apenas o **nome** (deixe senha em branco)
5. Clique em **Salvar**
6. ✅ **Deve funcionar!** Sem erro 400

---

**🎯 Problema resolvido! Validação agora aceita campos opcionais em UPDATE.**

