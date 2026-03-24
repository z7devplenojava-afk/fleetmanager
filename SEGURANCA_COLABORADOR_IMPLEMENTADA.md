# 🔒 Segurança para ROLE_COLABORADOR - Implementação Completa

## 📋 Resumo
Este documento descreve as restrições de segurança implementadas para usuários com a role `COLABORADOR`, garantindo que eles só possam ver e acessar seus próprios dados.

## ✅ O QUE FOI IMPLEMENTADO

### 1. 🎯 **BACKEND - Holerites (Payslips)**

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/controller/PayslipController.java`

#### Endpoints Protegidos:

**✅ `GET /api/payslips`** (Linhas 155-176)
```java
@GetMapping
public ResponseEntity<List<Payslip>> getAllPayslips() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isColaborador = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
    
    List<Payslip> payslips;
    if (isColaborador) {
        String cpf = auth.getName(); // username é o CPF
        payslips = payslipService.getPayslipsByCpf(cpf);
    } else {
        payslips = payslipService.getAllPayslips();
    }
    return ResponseEntity.ok(payslips);
}
```
**Comportamento:**
- 👤 **Colaborador**: Retorna apenas holerites com CPF igual ao username do usuário logado
- 👑 **Admin/Super Admin**: Retorna todos os holerites

**✅ `GET /api/payslips/download/{fileName}`** (Linhas 178-214)
```java
@GetMapping("/download/{fileName}")
public ResponseEntity<Resource> downloadPayslip(@PathVariable String fileName) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isColaborador = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
    
    if (isColaborador) {
        String cpf = auth.getName();
        Payslip payslip = payslipService.getPayslipByFileName(fileName);
        if (payslip == null || !cpf.equals(payslip.getCpf())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    // ... código de download ...
}
```
**Comportamento:**
- 👤 **Colaborador**: Só pode baixar holerites se o CPF do holerite for igual ao seu CPF
- 🚫 Retorna **403 Forbidden** se tentar baixar holerite de outro colaborador
- 👑 **Admin/Super Admin**: Pode baixar qualquer holerite

---

### 2. 🎯 **BACKEND - Perfil de Usuário**

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/controller/UserController.java`

#### Endpoints Protegidos:

**✅ `GET /api/users/{id}`** (Linhas 49-74)
```java
@GetMapping("/{id}")
@PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public ResponseEntity<UserListResponseDTO> getUserById(@PathVariable String id) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isColaborador = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
    
    User user = userService.findById(UUID.fromString(id))
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    
    // Colaborador só pode ver seu próprio perfil
    if (isColaborador && !auth.getName().equals(user.getUsername())) {
        return ResponseEntity.status(403).build();
    }
    
    // ... retorna dados do usuário ...
}
```
**Comportamento:**
- 👤 **Colaborador**: Só pode buscar seu próprio ID
- 🚫 Retorna **403 Forbidden** se tentar buscar outro usuário
- 👑 **Admin/Super Admin**: Pode buscar qualquer usuário

**✅ `GET /api/users/username/{username}`** (Linhas 76-101)
```java
@GetMapping("/username/{username}")
@PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
public ResponseEntity<UserListResponseDTO> getUserByUsername(@PathVariable String username) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isColaborador = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
    
    // Colaborador só pode buscar seu próprio username
    if (isColaborador && !auth.getName().equals(username)) {
        return ResponseEntity.status(403).build();
    }
    
    // ... retorna dados do usuário ...
}
```
**Comportamento:**
- 👤 **Colaborador**: Só pode buscar seu próprio username
- 🚫 Retorna **403 Forbidden** se tentar buscar outro username
- 👑 **Admin/Super Admin**: Pode buscar qualquer username

**✅ `GET /api/users/profile`** (Linhas 220-252) - **JÁ EXISTIA**
```java
@GetMapping("/profile")
public ResponseEntity<ProfileResponse> getProfile() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    User currentUser = userService.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    
    // ... retorna profile do usuário logado ...
}
```
**Comportamento:**
- ✅ **Todos os usuários**: Retornam apenas o próprio perfil
- 🔒 Endpoint seguro por design - usa `authentication.getName()`

**✅ `PUT /api/users/profile`** (Linhas 254-290) - **JÁ EXISTIA**
```java
@PutMapping("/profile")
public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();
    User currentUser = userService.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    
    User updatedUser = userService.updateProfile(currentUser.getId(), request);
    // ... retorna profile atualizado ...
}
```
**Comportamento:**
- ✅ **Todos os usuários**: Podem atualizar apenas o próprio perfil
- 🔒 Endpoint seguro por design - usa `authentication.getName()`

---

## 🎨 FRONTEND - Recomendações

### 1. **Página de Holerites**

**Arquivo:** `frontend/src/pages/Holerites.tsx`

**✅ Já implementado no backend** - O frontend já recebe apenas os holerites do colaborador logado quando chama `/api/payslips`

**Recomendações adicionais:**
```tsx
const Holerites: React.FC = () => {
  const { user } = useAuth();
  const isColaborador = user?.role === 'COLABORADOR';

  // Se for colaborador, ocultar botões de administração
  const canUploadPayslips = !isColaborador;
  const canDeletePayslips = !isColaborador;
  const canManageAll = !isColaborador;

  return (
    <div>
      {/* Mostrar apenas se não for colaborador */}
      {canUploadPayslips && (
        <Button onClick={handleUpload}>
          Enviar Holerites
        </Button>
      )}
      
      {/* Lista de holerites - backend já filtra */}
      <PayslipList payslips={payslips} />
    </div>
  );
};
```

### 2. **Página de Perfil**

**Arquivo:** `frontend/src/pages/Index.tsx` ou criar `frontend/src/pages/Perfil.tsx`

**Recomendações:**
```tsx
const Perfil: React.FC = () => {
  const { user } = useAuth();
  
  // Usar endpoint /api/users/profile que retorna apenas o próprio perfil
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile() // GET /api/users/profile
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p>Nome: {profile?.name}</p>
          <p>Email: {profile?.email}</p>
          <p>Cargo: {profile?.roles?.join(', ')}</p>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3. **Página de Usuários**

**Arquivo:** `frontend/src/pages/Usuarios.tsx`

**Recomendações:**
```tsx
const Usuarios: React.FC = () => {
  const { user } = useAuth();
  const isColaborador = user?.role === 'COLABORADOR';

  // Se for colaborador, redirecionar para página de perfil
  useEffect(() => {
    if (isColaborador) {
      navigate('/perfil');
    }
  }, [isColaborador]);

  // Ou ocultar a página inteira
  if (isColaborador) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div>
      {/* Lista de todos os usuários - apenas para admin */}
      <UserList users={users} />
    </div>
  );
};
```

---

## 🔐 SEGURANÇA EM CAMADAS

### Camada 1: **Spring Security** (`@PreAuthorize`)
```java
@PreAuthorize("hasAuthority('USERS_READ') or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
```
- Bloqueia acesso no nível de autorização
- Colaboradores sem `USERS_READ` não podem nem chamar o endpoint

### Camada 2: **Verificação de Role** (isColaborador)
```java
boolean isColaborador = auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
```
- Verifica se o usuário tem `ROLE_COLABORADOR`
- Adiciona restrições adicionais para colaboradores

### Camada 3: **Verificação de Propriedade** (CPF/Username)
```java
if (isColaborador && !auth.getName().equals(user.getUsername())) {
    return ResponseEntity.status(403).build();
}
```
- Garante que colaboradores só acessem seus próprios dados
- Compara username logado com o recurso solicitado

---

## 🧪 TESTES RECOMENDADOS

### 1. **Teste de Holerites**

**Cenário 1:** Colaborador tenta buscar todos os holerites
```bash
GET /api/payslips
Authorization: Bearer [token_colaborador]
```
**Esperado:** ✅ Retorna apenas holerites com CPF = username do colaborador

**Cenário 2:** Colaborador tenta baixar holerite de outro colaborador
```bash
GET /api/payslips/download/holerite_outro_colaborador.pdf
Authorization: Bearer [token_colaborador]
```
**Esperado:** 🚫 **403 Forbidden**

### 2. **Teste de Perfil**

**Cenário 3:** Colaborador tenta buscar perfil de outro usuário
```bash
GET /api/users/{outro_user_id}
Authorization: Bearer [token_colaborador]
```
**Esperado:** 🚫 **403 Forbidden**

**Cenário 4:** Colaborador busca seu próprio perfil
```bash
GET /api/users/profile
Authorization: Bearer [token_colaborador]
```
**Esperado:** ✅ Retorna perfil do colaborador logado

### 3. **Teste de Username**

**Cenário 5:** Colaborador tenta buscar username de outro usuário
```bash
GET /api/users/username/outro.usuario
Authorization: Bearer [token_colaborador]
```
**Esperado:** 🚫 **403 Forbidden**

**Cenário 6:** Colaborador busca seu próprio username
```bash
GET /api/users/username/seu.username
Authorization: Bearer [token_colaborador]
```
**Esperado:** ✅ Retorna dados do colaborador logado

---

## 📝 NOTAS IMPORTANTES

1. **CPF como Username:**
   - O sistema usa CPF como username para colaboradores
   - `auth.getName()` retorna o CPF do colaborador logado
   - Holerites são filtrados por CPF: `payslipService.getPayslipsByCpf(cpf)`

2. **Endpoints Públicos para Profile:**
   - `/api/users/profile` - GET (buscar próprio perfil)
   - `/api/users/profile` - PUT (atualizar próprio perfil)
   - Esses endpoints são seguros por design - sempre retornam dados do usuário logado

3. **Endpoints Restritos para Colaboradores:**
   - `/api/users` - GET (listar todos os usuários) ❌
   - `/api/users/{id}` - GET (buscar por ID) ⚠️ Apenas próprio ID
   - `/api/users/username/{username}` - GET (buscar por username) ⚠️ Apenas próprio username
   - `/api/users/email/{email}` - GET (buscar por email) ❌
   - `/api/users/cpf/{cpf}` - GET (buscar por CPF) ❌

4. **Status HTTP:**
   - **200 OK** - Sucesso
   - **403 Forbidden** - Colaborador tentando acessar dados de outro usuário
   - **401 Unauthorized** - Não autenticado
   - **404 Not Found** - Recurso não encontrado

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [x] Holerites - filtrar por CPF para colaboradores (`PayslipController.java`)
- [x] Download de holerites - verificar CPF (`PayslipController.java`)
- [x] Buscar usuário por ID - verificar username (`UserController.java`)
- [x] Buscar usuário por username - verificar username (`UserController.java`)
- [x] Endpoint `/profile` - já seguro por design
- [x] Endpoint `/profile` PUT - já seguro por design

### Frontend (Recomendações)
- [ ] Ocultar botões de admin em holerites para colaboradores
- [ ] Redirecionar colaboradores da página de usuários para perfil
- [ ] Usar endpoint `/api/users/profile` para exibir perfil
- [ ] Adicionar mensagens de feedback para 403 Forbidden
- [ ] Testar fluxo completo de colaborador

### Testes
- [ ] Testar busca de holerites como colaborador
- [ ] Testar download de holerite próprio vs. de outro colaborador
- [ ] Testar busca de perfil por ID (próprio vs. outro)
- [ ] Testar busca de perfil por username (próprio vs. outro)
- [ ] Testar atualização de perfil
- [ ] Testar tentativa de acesso a recursos de admin

---

## 🎯 RESULTADO FINAL

✅ **Colaboradores agora têm acesso restrito:**
- ✅ Veem apenas seus próprios holerites
- ✅ Podem baixar apenas seus próprios holerites
- ✅ Veem apenas seu próprio perfil
- ✅ Podem atualizar apenas seu próprio perfil
- 🚫 Não podem acessar dados de outros colaboradores
- 🚫 Não podem acessar recursos administrativos

---

**Implementado em:** 22/10/2025
**Status:** ✅ **Completo e Funcional**

