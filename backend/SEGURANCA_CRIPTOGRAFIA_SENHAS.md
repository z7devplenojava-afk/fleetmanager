# 🔒 Segurança - Criptografia de Senhas

## 🎯 REGRA CRÍTICA

**TODAS as senhas DEVEM ser criptografadas com BCrypt ANTES de gravar no banco de dados!**

---

## ✅ **Status de Implementação**

### **Verificado e Corrigido:**

| Arquivo/Serviço | Método | Status | Criptografia |
|----------------|--------|--------|--------------|
| **AuthenticationServiceImpl** | `register()` | ✅ OK | `passwordEncoder.encode()` |
| **UserService** | `create()` | ✅ OK | `passwordEncoder.encode()` |
| **UserService** | `update()` | ✅ OK | `passwordEncoder.encode()` |
| **UserService** | `changePassword()` | ✅ OK | `passwordEncoder.encode()` |
| **PayslipService** | `createUserFromPayslip()` | ✅ OK | Usa `userService.create()` |
| **ImportService** | `importFromExcel()` | ✅ CORRIGIDO | Usa `userService.create()` |
| **ContactValidationService** | `createUserFromEmployee()` | ✅ OK | `passwordEncoder.encode()` |
| **FirstAccessController** | `changePassword()` | ✅ OK | `passwordEncoder.encode()` |
| **PasswordResetService** | `resetPassword()` | ✅ OK | `passwordEncoder.encode()` |

---

## 🔐 Algoritmo de Criptografia

### **BCrypt (Recomendado)**

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

**Características:**
- ✅ **Salt automático** - Cada senha tem um salt único
- ✅ **Custo configurável** - Padrão: 10 rounds
- ✅ **Não reversível** - Impossível descriptografar
- ✅ **Resistente a rainbow tables**
- ✅ **Resistente a força bruta**

**Exemplo de hash:**
```
Senha: "Admin123!"
Hash: "$2a$10$Xvz6WQd9l3h.MvD8jFxH.OQx8xFq0xQx8xFq0xQx8xFq0xQx8xFq0"
```

---

## ✅ **Como Criptografar Senhas Corretamente**

### **1. Ao Criar Usuário (RECOMENDADO)**

Use **SEMPRE** `UserService.create()`:

```java
// ✅ CORRETO
User novoUser = new User();
novoUser.setUsername("12345678901");
novoUser.setPassword("12345678901@2025"); // Senha em texto plano
novoUser.setEmail("colaborador.12345678901@promovervigilancia.com.br");

// UserService.create() criptografa automaticamente
User usuarioCriado = userService.create(novoUser);

// Resultado no banco:
// password: "$2a$10$..." (criptografado)
```

### **2. Ao Criar via API**

```java
// ✅ CORRETO - AuthenticationServiceImpl.register()
User user = User.builder()
    .username(request.getUsername())
    .email(request.getEmail())
    .password(passwordEncoder.encode(request.getPassword())) // CRIPTOGRAFA AQUI
    .build();

userRepository.save(user);
```

### **3. Ao Alterar Senha**

```java
// ✅ CORRETO - UserService.changePassword()
user.setPassword(passwordEncoder.encode(newPassword)); // CRIPTOGRAFA
userRepository.save(user);
```

---

## ❌ **NUNCA FAÇA ISSO!**

### **❌ ERRADO 1: Salvar direto sem criptografar**

```java
// ❌ PERIGOSO! Senha em texto plano no banco!
User user = new User();
user.setPassword("minhasenha123");
userRepository.save(user); // NUNCA FAÇA ISSO!
```

### **❌ ERRADO 2: Usar criptografia fraca**

```java
// ❌ PERIGOSO! MD5/SHA1 são inseguros
String hash = DigestUtils.md5Hex("minhasenha");
user.setPassword(hash);
```

### **❌ ERRADO 3: Tentar descriptografar**

```java
// ❌ IMPOSSÍVEL! BCrypt não é reversível
// Não existe método passwordEncoder.decode()!
```

---

## 🔍 **Verificação de Senha**

### **Como Validar Login:**

```java
// ✅ CORRETO
boolean senhaCorreta = passwordEncoder.matches(
    senhaDigitada,      // Texto plano
    user.getPassword()   // Hash do banco ($2a$10$...)
);

if (senhaCorreta) {
    // Login OK
}
```

**Exemplo:**
```java
// Usuário digita: "Admin123!"
// Banco tem: "$2a$10$Xvz6WQd9l3h.MvD8jFxH.O..."

boolean matches = passwordEncoder.matches("Admin123!", "$2a$10$Xvz6WQd9l3h...");
// Retorna: true
```

---

## 📋 **Fluxos Completos**

### **Fluxo 1: Registro de Novo Usuário**

```
1. Usuário envia: { username, password: "Senha123!" }
2. Backend recebe
3. passwordEncoder.encode("Senha123!") → "$2a$10$..."
4. Salva no banco: password = "$2a$10$..."
5. Banco armazena APENAS o hash criptografado
```

### **Fluxo 2: Login**

```
1. Usuário envia: { username, password: "Senha123!" }
2. Backend busca usuário no banco
3. Banco retorna: password = "$2a$10$..."
4. passwordEncoder.matches("Senha123!", "$2a$10$...") → true
5. Login aprovado, gera JWT token
```

### **Fluxo 3: Criação Automática (Holerite)**

```
1. PDF processado → CPF: 12345678901
2. Gera senha: "12345678901@2025"
3. Cria User com senha em texto plano
4. userService.create(user) → criptografa automaticamente
5. Banco armazena: password = "$2a$10$..." (criptografado)
```

---

## 🛡️ **Camadas de Segurança**

### **1. Validação de Força da Senha**

```java
@Pattern(
    regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*|\\d{11}@2025)$",
    message = "Senha deve ser forte ou CPF@2025"
)
private String password;
```

### **2. Criptografia com Salt**

```java
// Cada senha tem um salt único
"Admin123!" → "$2a$10$abcdef123456..." (salt: abcdef123456)
"Admin123!" → "$2a$10$xyz789654321..." (salt: xyz789654321)
// Mesma senha, hashes diferentes!
```

### **3. Custo Computacional**

```java
// Rounds: 10 (padrão)
// Tempo de hash: ~100ms
// Dificulta ataques de força bruta
```

### **4. Auditoria de Mudanças**

```java
// Ao alterar senha:
user.setLastPasswordChange(LocalDateTime.now());
logService.logUserActivity(username, "PASSWORD_CHANGED", details);
```

---

## 🔧 **Configuração do Sistema**

### **SecurityConfig.java**

```java
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // ✅ BCrypt
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
        UserDetailsService userDetailsService,
        PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder); // ✅ Usa BCrypt
        return authProvider;
    }
}
```

---

## 📊 **Formato da Senha no Banco**

### **Estrutura do Hash BCrypt:**

```
$2a$10$N8qQ2x7xFx.vK5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5Kx5K
│  │  │                                              │
│  │  │                                              └─ Hash (22 chars)
│  │  └─ Salt (22 chars)
│  └─ Rounds (10 = 2^10 iterações)
└─ Algoritmo ($2a = BCrypt)
```

**Componentes:**
- `$2a` - Versão do BCrypt
- `$10` - Custo (2^10 = 1024 iterações)
- Salt - 22 caracteres aleatórios
- Hash - 31 caracteres resultantes

**Total:** ~60 caracteres

---

## ⚠️ **Importante: Senha Padrão CPF@2025**

### **Aceita pela validação:**

```java
// Padrão especial aceito:
String cpf = "12345678901";
String senha = cpf + "@2025"; // "12345678901@2025"

// Regex aceita:
regexp = "\\d{11}@2025" // 11 dígitos + @2025
```

**Exemplo:**
- CPF: 05986003616
- Senha: 05986003616@2025
- Hash: $2a$10$Xvz6WQd9l3h.MvD8jFxH.O...

---

## 🔍 **Como Verificar no Banco**

### **SQL para verificar senhas:**

```sql
-- Ver formato das senhas (deve ser $2a$10$...)
SELECT 
    username, 
    email,
    LEFT(password, 10) as password_prefix,
    LENGTH(password) as password_length
FROM users
LIMIT 10;

-- Resultado esperado:
-- password_prefix: $2a$10$...
-- password_length: ~60 caracteres
```

### **Verificar senhas em texto plano (PROBLEMA!):**

```sql
-- ⚠️ Se encontrar senhas sem $2a$, PROBLEMA!
SELECT username, email, password
FROM users
WHERE password NOT LIKE '$2a$%';

-- Resultado esperado: 0 linhas
-- Se encontrar linhas: CORRIGIR URGENTE!
```

---

## 🔐 **Boas Práticas Implementadas**

### **✅ Checklist de Segurança:**

- [x] BCrypt como algoritmo padrão
- [x] Salt automático por senha
- [x] Custo de 10 rounds (seguro)
- [x] Senha NUNCA em texto plano no banco
- [x] Validação de força da senha
- [x] PasswordEncoder injetado via DI
- [x] UserService.create() criptografa automaticamente
- [x] Logs de mudanças de senha
- [x] Timestamp de última mudança
- [x] Reset de senha seguro (token único)

---

## 🚨 **Ações em Caso de Senha em Texto Plano**

### **Se encontrar senhas não criptografadas:**

```sql
-- 1. Identificar usuários afetados
SELECT id, username, email, password
FROM users
WHERE password NOT LIKE '$2a$%';

-- 2. Criar script de correção
-- ⚠️ NÃO É POSSÍVEL criptografar senhas existentes em texto plano!
-- Solução: Resetar senhas para padrão CPF@2025

-- 3. Notificar usuários para trocar senha
-- 4. Forçar firstAccess = true
UPDATE users
SET first_access = true
WHERE password NOT LIKE '$2a$%';
```

---

## 📝 **Resumo**

| Aspecto | Implementação |
|---------|---------------|
| **Algoritmo** | BCrypt ($2a$) |
| **Rounds** | 10 (2^10 iterações) |
| **Salt** | Automático, único por senha |
| **Tamanho Hash** | ~60 caracteres |
| **Reversível** | ❌ NÃO (seguro) |
| **Tempo de Hash** | ~100ms (dificulta força bruta) |
| **Validação** | `passwordEncoder.matches()` |
| **Armazenamento** | `$2a$10$salt+hash` |

---

## ✅ **Conclusão**

**TODAS as senhas são criptografadas com BCrypt antes de serem salvas no banco!**

**Garantias:**
- 🔒 Senha NUNCA em texto plano no banco
- 🔒 BCrypt com salt automático
- 🔒 Impossível reverter hash para senha original
- 🔒 Resistente a ataques de força bruta
- 🔒 Auditoria completa de mudanças

---

**SEGURANÇA DE SENHA IMPLEMENTADA E VERIFICADA!** ✅🔒🛡️

