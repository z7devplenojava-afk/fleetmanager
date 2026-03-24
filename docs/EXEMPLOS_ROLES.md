# Exemplos de Cada Role - Postman

## Configuração do Postman

**URL Base:** `http://localhost:8081/api/auth/register`  
**Método:** `POST`  
**Headers:** `Content-Type: application/json`

---

## 1. ADMIN (Administrador)

```json
{
  "username": "admin",
  "email": "admin@promovervigilancia.com.br",
  "password": "Admin1234",
  "name": "Administrador do Sistema",
  "fullName": "Administrador do Sistema",
  "role": "ADMIN"
}
```

**Permissões:** Acesso total ao sistema
- Dashboard completo
- Gestão de colaboradores
- Gestão de clientes
- Gestão de contratos
- Financeiro
- Frota
- Documentos
- Relatórios
- Configurações

---

## 2. RH (Recursos Humanos)

```json
{
  "username": "rh",
  "email": "rh@promovervigilancia.com.br",
  "password": "Admin1234",
  "name": "Recursos Humanos",
  "fullName": "Recursos Humanos",
  "role": "RH"
}
```

**Permissões:** Gestão de pessoas
- Dashboard
- Gestão de colaboradores
- Holerites
- Relatórios
- Configurações

---

## 3. GESTOR (Gestor/Coordenador)

```json
{
  "username": "gestor",
  "email": "gestor@promovervigilancia.com.br",
  "password": "Admin1234",
  "name": "Gestor de Contratos",
  "fullName": "Gestor de Contratos",
  "role": "GESTOR"
}
```

**Permissões:** Gestão de contratos e equipes
- Dashboard
- Gestão de colaboradores
- Gestão de contratos
- Relatórios
- Configurações

---

## 4. SUPERVISOR (Supervisor de Equipe)

```json
{
  "username": "supervisor",
  "email": "supervisor@promovervigilancia.com.br",
  "password": "Admin1234",
  "name": "Supervisor de Equipe",
  "fullName": "Supervisor de Equipe",
  "role": "SUPERVISOR"
}
```

**Permissões:** Supervisão de equipe
- Dashboard
- Minha equipe
- Relatórios
- Holerites
- Configurações

---

## 5. VIGILANTE (Colaborador Operacional)

```json
{
  "username": "vigilante",
  "email": "vigilante@promovervigilancia.com.br",
  "password": "Admin1234",
  "name": "Vigilante Teste",
  "fullName": "Vigilante Teste",
  "role": "VIGILANTE"
}
```

**Permissões:** Acesso restrito
- Meu holerite
- Meu perfil
- Configurações

---

## Como Cadastrar

### Passo 1: Abrir Postman
1. Abra o Postman
2. Crie uma nova requisição
3. Configure:
   - **Método:** POST
   - **URL:** `http://localhost:8081/api/auth/register`
   - **Headers:** `Content-Type: application/json`

### Passo 2: Cadastrar Usuários
1. **Cole o JSON do role desejado no Body**
2. **Clique em Send**
3. **Verifique se retornou status 200**
4. **Repita para cada role**

### Passo 3: Testar Login
Após cadastrar, teste o login:

**URL:** `http://localhost:8081/api/auth/login`
```json
{
  "username": "admin",
  "password": "Admin1234"
}
```

---

## Ordem Recomendada de Cadastro

1. **ADMIN** (primeiro - acesso total)
2. **RH** (gestão de pessoas)
3. **GESTOR** (gestão de contratos)
4. **SUPERVISOR** (supervisão)
5. **VIGILANTE** (colaborador)

---

## Teste no Frontend

Após cadastrar todos os usuários:

1. **Acesse:** `http://localhost:8080/login`
2. **Teste cada usuário:**
   - `admin` / `Admin1234`
   - `rh` / `Admin1234`
   - `gestor` / `Admin1234`
   - `supervisor` / `Admin1234`
   - `vigilante` / `Admin1234`

3. **Verifique se o menu e permissões estão corretos para cada role**

---

## Resposta Esperada (Sucesso)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "email": "admin@promovervigilancia.com.br",
    "fullName": "Administrador do Sistema",
    "role": "ADMIN"
  }
}
```

---

## Dicas Importantes

- ✅ **Senha:** Sempre `Admin1234` (com maiúscula e números)
- ✅ **Username:** Deve ser único
- ✅ **Email:** Deve ser único e seguir o padrão `@promovervigilancia.com.br`
- ✅ **Name e FullName:** Podem ser iguais
- ✅ **Role:** Deve ser exatamente como mostrado (ADMIN, RH, GESTOR, SUPERVISOR, VIGILANTE)
- ✅ **Backend:** Deve estar rodando na porta 8081
- ✅ **Frontend:** Deve estar rodando na porta 8080 