# Guia para Cadastrar Usuários via Postman

## Configuração do Postman

### 1. **URL Base**
```
http://localhost:8081/api
```

### 2. **Headers**
```
Content-Type: application/json
```

## Endpoints Disponíveis

### **1. Cadastrar Usuário (Register)**
- **Método:** `POST`
- **URL:** `http://localhost:8081/api/auth/register`
- **Headers:** `Content-Type: application/json`

#### Exemplo de Body (JSON):

**Administrador:**
```json
{
  "username": "admin",
  "password": "Password123!",
  "email": "admin@promover.com",
  "fullName": "Administrador do Sistema",
  "role": "ADMIN"
}
```

**Recursos Humanos:**
```json
{
  "username": "rh",
  "password": "Password123!",
  "email": "rh@promover.com",
  "fullName": "Recursos Humanos",
  "role": "RH"
}
```

**Gestor:**
```json
{
  "username": "gestor",
  "password": "Password123!",
  "email": "gestor@promover.com",
  "fullName": "Gestor de Contratos",
  "role": "GESTOR"
}
```

**Supervisor:**
```json
{
  "username": "supervisor",
  "password": "Password123!",
  "email": "supervisor@promover.com",
  "fullName": "Supervisor de Equipe",
  "role": "SUPERVISOR"
}
```

**Vigilante:**
```json
{
  "username": "vigilante",
  "password": "Password123!",
  "email": "vigilante@promover.com",
  "fullName": "Vigilante Teste",
  "role": "VIGILANTE"
}
```

### **2. Fazer Login**
- **Método:** `POST`
- **URL:** `http://localhost:8081/api/auth/login`
- **Headers:** `Content-Type: application/json`

#### Exemplo de Body (JSON):
```json
{
  "username": "admin",
  "password": "Password123!"
}
```

## Roles Disponíveis

- **ADMIN** - Administrador do sistema
- **RH** - Recursos Humanos
- **GESTOR** - Gestor/Coordenador
- **SUPERVISOR** - Supervisor de equipe
- **VIGILANTE** - Colaborador operacional

## Resposta Esperada

### Sucesso (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "email": "admin@promover.com",
    "fullName": "Administrador do Sistema",
    "role": "ADMIN"
  }
}
```

### Erro (400/401):
```json
{
  "timestamp": "2025-06-19T...",
  "status": 400,
  "error": "Bad Request",
  "message": "Username already exists",
  "path": "/api/auth/register"
}
```

## Passos para Testar

1. **Abra o Postman**
2. **Configure a URL base:** `http://localhost:8081/api`
3. **Cadastre um usuário ADMIN primeiro**
4. **Teste o login com o usuário criado**
5. **Cadastre outros usuários com diferentes roles**
6. **Teste o login no frontend:** `http://localhost:8080/login`

## Dicas

- **Senha:** Use sempre `Password123!` (com maiúscula e caractere especial)
- **Username:** Deve ser único
- **Email:** Deve ser único
- **Role:** Deve ser um dos valores válidos listados acima
- **Backend:** Deve estar rodando na porta 8081
- **Frontend:** Deve estar rodando na porta 8080

## Teste no Frontend

Após cadastrar os usuários via Postman, você pode testar no frontend:

1. Acesse: `http://localhost:8080/login`
2. Use o username e senha cadastrados
3. Verifique se o menu e permissões estão corretos para cada role 