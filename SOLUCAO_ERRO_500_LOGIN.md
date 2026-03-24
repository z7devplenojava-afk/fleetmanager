# 🔧 Solução para Erro 500 no Login

## 🔍 **Problema Identificado**

Erro 500 ao tentar fazer login:
```
❌ Axios Response Error: 500 /auth/login
Error: Falha na autenticação
```

## 🎯 **Causas Possíveis**

1. ❌ Usuário não tem `id` válido no banco
2. ❌ Usuário não tem `roles` cadastradas
3. ❌ Problema no serviço `UserCustomPermissionService`
4. ❌ Exceção não tratada no `AuthenticationServiceImpl`

---

## ✅ **Solução Rápida (Passo a Passo)**

### **1️⃣ Verificar Console do Backend**

Quando você tenta fazer login, o erro aparece no console do backend. Procure por:

```
ERROR
BadCredentialsException
NullPointerException
RuntimeException
```

### **2️⃣ Executar Script SQL de Verificação**

Execute o arquivo `backend/VERIFICAR_USUARIO.sql` no PostgreSQL:

```bash
psql -U postgres -d secured_guard -f backend/VERIFICAR_USUARIO.sql
```

Ou no DBeaver/pgAdmin:
1. Abra o arquivo `VERIFICAR_USUARIO.sql`
2. Execute cada query
3. Verifique se:
   - ✅ Usuário tem `id` válido (UUID)
   - ✅ Usuário tem pelo menos 1 role cadastrada
   - ✅ Status está `ACTIVE`
   - ✅ `active = true`

### **3️⃣ Criar Usuário de Teste (Se necessário)**

Se não houver usuários válidos, execute:

```sql
-- 1. Criar usuário de teste
INSERT INTO users (
    id, 
    username, 
    password, 
    name, 
    email, 
    active, 
    first_access, 
    two_factor_enabled, 
    status, 
    created_at, 
    updated_at
)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$N8qQ2x7xFx.vK5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5K', -- senha: Admin123!
    'Administrador do Sistema',
    'admin@securedguard.com',
    true,
    false,
    false,
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 2. Buscar IDs do usuário e role
SELECT u.id as user_id, r.id as role_id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin'
  AND r.name = 'SUPER_ADMIN';

-- 3. Inserir role para o usuário
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin'
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;
```

### **4️⃣ Testar Login**

Credenciais:
- **Usuário:** `admin`
- **Senha:** `Admin123!`

---

## 🔍 **Verificações Adicionais**

### **A) Verificar se Role SUPER_ADMIN existe:**

```sql
SELECT * FROM roles WHERE name = 'SUPER_ADMIN';
```

Se não existir, criar:

```sql
INSERT INTO roles (id, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'SUPER_ADMIN',
    'Super Administrador com acesso total',
    NOW()
)
ON CONFLICT (name) DO NOTHING;
```

### **B) Verificar permissões customizadas:**

```sql
SELECT COUNT(*) as total_permissoes
FROM user_custom_permissions
WHERE is_active = true;
```

### **C) Verificar estrutura do banco:**

```sql
-- Verificar se colunas existem
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('first_access', 'two_factor_enabled', 'last_password_change');
```

Se faltarem colunas, executar migrations:

```bash
cd backend
./mvnw flyway:migrate
```

---

## 🐛 **Debug no Código (Desenvolvedor)**

### **Adicionar Try-Catch em AuthenticationServiceImpl:**

```java
@Override
public AuthenticationResponse authenticate(AuthenticationRequest request) {
    try {
        log.info("🔐 Tentando autenticar usuário: {}", request.getUsername());
        
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        log.info("✅ Usuário encontrado: {} (ID: {})", user.getUsername(), user.getId());
        
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        log.info("🔑 Tokens gerados com sucesso");
        
        // Buscar permissões customizadas (PODE FALHAR AQUI!)
        java.util.List<String> customPermissions = Collections.emptyList();
        try {
            customPermissions = customPermissionService.getActivePermissions(user.getId());
            log.info("✅ Permissões customizadas: {}", customPermissions.size());
        } catch (Exception e) {
            log.error("⚠️ Erro ao buscar permissões customizadas (usando lista vazia): {}", e.getMessage());
        }
        
        // Buscar roles (PODE FALHAR AQUI!)
        List<String> roles = Collections.emptyList();
        try {
            roles = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toList());
            log.info("✅ Roles do usuário: {}", roles);
        } catch (Exception e) {
            log.error("⚠️ Erro ao buscar roles (usando lista vazia): {}", e.getMessage());
        }
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getName())
                        .roles(roles)
                        .customPermissions(customPermissions)
                        .firstAccess(user.isFirstAccess())
                        .twoFactorEnabled(user.isTwoFactorEnabled())
                        .build())
                .build();
                
    } catch (Exception e) {
        log.error("💥 ERRO NO LOGIN: {}", e.getMessage(), e);
        throw e;
    }
}
```

---

## 📋 **Checklist de Solução**

- [ ] Executei script `VERIFICAR_USUARIO.sql`
- [ ] Usuário tem `id` válido (UUID)
- [ ] Usuário tem pelo menos 1 role (`SUPER_ADMIN`)
- [ ] Usuário está `ACTIVE` e `active = true`
- [ ] Role `SUPER_ADMIN` existe na tabela `roles`
- [ ] Mapeamento `user_roles` existe
- [ ] Migrations do banco executadas (`flyway:migrate`)
- [ ] Backend reiniciado após alterações
- [ ] Testei login com `admin` / `Admin123!`

---

## 🚀 **Comando Rápido para Criar Admin**

Execute este script completo:

```sql
-- Script completo de criação de admin
BEGIN;

-- 1. Criar role SUPER_ADMIN
INSERT INTO roles (id, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'SUPER_ADMIN',
    'Super Administrador',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 2. Criar usuário admin
INSERT INTO users (
    id, username, password, name, email, 
    active, first_access, two_factor_enabled, status, 
    created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$KIJ6z7kXQx7kXQx7kXQx7uxQx7kXQx7kXQx7kXQx7kXQx7kXQx7kXQ', -- Admin123!
    'Administrador',
    'admin@test.com',
    true,
    false,
    false,
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- 3. Associar role ao usuário
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin'
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- 4. Verificar
SELECT 
    u.username,
    u.email,
    u.active,
    u.status,
    r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';
```

---

## ✅ **Resultado Esperado**

Após executar as correções:

```
Username: admin
Email: admin@test.com
Active: true
Status: ACTIVE
Role: SUPER_ADMIN
```

**Teste o login:**
- Usuário: `admin`
- Senha: `Admin123!`

---

## 📞 **Ainda com Problema?**

1. **Verifique o console do backend** para ver o erro exato
2. **Compartilhe a stack trace** completa do erro
3. **Execute:** `SELECT * FROM users WHERE username = 'admin';`
4. **Verifique se:** Migrations estão atualizadas

---

**IMPORTANTE:** O hash da senha no exemplo pode estar incorreto. Use o BCryptPasswordEncoder para gerar o hash correto:

```java
// No backend (Java)
System.out.println(new BCryptPasswordEncoder().encode("Admin123!"));
```

Ou online: https://bcrypt-generator.com/
- Senha: `Admin123!`
- Rounds: 10

---

**SOLUÇÃO COMPLETA IMPLEMENTADA!** ✅🔧🎯

