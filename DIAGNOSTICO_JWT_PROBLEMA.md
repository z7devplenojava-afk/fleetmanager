# 🚨 Diagnóstico - Problema de Autenticação JWT

## 🔍 **Problema Identificado**

O usuário `jose.ramos` faz login com sucesso, mas o sistema o trata como **`anonymousUser`** com role **`ROLE_ANONYMOUS`**.

## 📊 **Evidências do Problema**

### **1. Login Funciona**
```json
POST /api/auth/login
{
  "username": "jose.ramos", 
  "password": "Admin1234"
}
→ 200 OK + JWT Token
```

### **2. Mas Authorities Estão Vazias**
```json
GET /api/debug/permissions
Authorization: Bearer <token>
→ {
  "hasColaborador": false,
  "hasPayslipsRead": false, 
  "shouldAccessPayslips": false,
  "hasSuperAdmin": false
}
```

### **3. Usuario Aparece como Anônimo**
```json
GET /api/debug/auth  
Authorization: Bearer <token>
→ {
  "authenticated": true,
  "username": "anonymousUser",
  "authorities": ["ROLE_ANONYMOUS"],
  "principal": "String"
}
```

## 🎯 **Possíveis Causas**

### **1. Problema no JWT Token**
- Token malformado ou corrompido
- Secret key incorreto
- Token expirado

### **2. Problema no UserDetailsService**
- Não está carregando as authorities corretamente
- CPF vs Username mismatch
- Dados do usuário não encontrados

### **3. Problema no JWT Filter**
- Não está processando o token corretamente
- Não está setando o SecurityContext
- Exception silenciosa

### **4. Problema na Base de Dados**
- Usuário não tem roles associadas
- Tabela de roles vazia
- Foreign keys quebradas

## 🔧 **Melhorias no Debug**

Adicionei mais informações ao `DebugController`:

```java
@GetMapping("/auth")
public ResponseEntity<Map<String, Object>> debugAuth(HttpServletRequest request) {
    // ... código existente ...
    
    // Debug adicional
    String authHeader = request.getHeader("Authorization");
    response.put("authHeader", authHeader != null ? authHeader.substring(0, 50) + "..." : "null");
    response.put("hasAuthHeader", authHeader != null);
    response.put("authHeaderStartsWithBearer", authHeader != null && authHeader.startsWith("Bearer "));
    
    return ResponseEntity.ok(response);
}
```

## 🧪 **Próximos Passos de Debug**

### **1. Fazer Commit e Deploy**
```bash
git add .
git commit -m "debug: Melhorar DebugController para investigar JWT"
git push origin ci
```

### **2. Testar Debug Melhorado**
```bash
# Com token
curl -H "Authorization: Bearer <TOKEN>" https://ci.z7botsolutions.com.br/api/debug/auth

# Verificar se:
# - hasAuthHeader: true
# - authHeaderStartsWithBearer: true  
# - username ainda é "anonymousUser"
```

### **3. Investigar UserDetailsService**
Se o token está sendo enviado corretamente, o problema pode estar em:
- `CustomUserDetailsService.loadUserByUsername()`
- Carregamento das authorities/roles
- Mapeamento CPF → Username

### **4. Verificar Base de Dados**
```sql
-- Verificar se usuário existe
SELECT * FROM users WHERE username = 'jose.ramos';

-- Verificar roles do usuário
SELECT u.username, ur.role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.username = 'jose.ramos';
```

## 🎯 **Hipótese Principal**

O **JWT token está sendo enviado corretamente**, mas o **`UserDetailsService`** não está conseguindo:

1. **Encontrar o usuário** na base de dados, OU
2. **Carregar as authorities/roles** do usuário

Isso faz com que o Spring Security trate a requisição como anônima, mesmo com token válido.

## ⏱️ **Timeline**

1. **Agora**: Commit + Deploy do debug melhorado (5 min)
2. **Testar**: Debug com token para confirmar envio (2 min)  
3. **Investigar**: UserDetailsService e base de dados (10 min)
4. **Corrigir**: Problema identificado (5 min)
5. **Validar**: Teste completo (5 min)

**Total estimado: ~30 minutos para resolução completa**

---

## 🚨 **Status Atual**

- ✅ **Independência de ambientes**: Resolvida
- ✅ **URLs dinâmicos**: Funcionando  
- ❌ **Autenticação JWT**: **PROBLEMA CRÍTICO**
- ❌ **Permissões**: Dependem da autenticação

**Foco total na correção da autenticação JWT!** 🎯
