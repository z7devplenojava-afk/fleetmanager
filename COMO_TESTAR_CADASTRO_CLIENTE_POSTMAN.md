# 👥 Como Testar Cadastro de Cliente no Postman

## 📌 Passo 1: Configurar o Postman

### URL:
```
POST http://localhost:8081/api/clients
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_JWT_AQUI
```

---

## 📝 Passo 2: Escolher um dos JSONs abaixo

### ✅ EXEMPLO MÍNIMO (Apenas Campos Obrigatórios)
```json
{
  "name": "ABC Comércio e Serviços",
  "cnpj": "98.765.432/0001-10"
}
```

### ✅ EXEMPLO COMPLETO
```json
{
  "name": "Empresa XYZ Segurança Ltda",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@empresaxyz.com.br",
  "phone": "(11) 3456-7890",
  "mobile": "(11) 98765-4321",
  "address": "Rua das Flores, 123 - Sala 45",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "contactName": "João da Silva",
  "contactEmail": "joao.silva@empresaxyz.com.br",
  "contactPhone": "(11) 91234-5678",
  "status": "ACTIVE",
  "notes": "Cliente preferencial. Contrato de segurança patrimonial de 12 meses."
}
```

### ✅ EXEMPLO SHOPPING CENTER
```json
{
  "name": "Shopping Center Plaza",
  "cnpj": "11.222.333/0001-44",
  "email": "seguranca@shoppingplaza.com.br",
  "phone": "(11) 4000-1234",
  "address": "Avenida Principal, 5000",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "04567-890",
  "contactName": "Maria Souza - Gerente de Segurança",
  "contactEmail": "maria.souza@shoppingplaza.com.br",
  "contactPhone": "(11) 99876-5432",
  "status": "ACTIVE",
  "notes": "Shopping com 3 turnos de segurança. Necessita 10 vigilantes por turno."
}
```

### ✅ EXEMPLO CONDOMÍNIO
```json
{
  "name": "Condomínio Residencial Jardim das Acácias",
  "cnpj": "22.333.444/0001-55",
  "email": "sindico@condominioacacias.com.br",
  "phone": "(11) 2345-6789",
  "mobile": "(11) 98888-7777",
  "address": "Rua das Acácias, 500",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "05678-901",
  "contactName": "Carlos Pereira - Síndico",
  "contactEmail": "carlos.pereira@gmail.com",
  "contactPhone": "(11) 99999-8888",
  "status": "ACTIVE",
  "notes": "Condomínio com 200 unidades. Portaria 24h."
}
```

### ✅ EXEMPLO INDÚSTRIA
```json
{
  "name": "Indústria Metalúrgica Brasil S.A.",
  "cnpj": "33.444.555/0001-66",
  "email": "rh@metalurgicabrasil.com.br",
  "phone": "(11) 3333-4444",
  "address": "Rodovia dos Bandeirantes, Km 25",
  "city": "Jundiaí",
  "state": "SP",
  "zipCode": "13200-000",
  "contactName": "Ana Costa - Gerente de RH",
  "contactEmail": "ana.costa@metalurgicabrasil.com.br",
  "contactPhone": "(11) 97777-6666",
  "status": "ACTIVE",
  "notes": "Parque industrial com 50 mil m². Necessita segurança armada."
}
```

---

## 🔧 Valores Válidos

### Status (status):
- `ACTIVE` - Cliente ativo (padrão)
- `INACTIVE` - Cliente inativo
- `SUSPENDED` - Cliente suspenso
- `PENDING` - Cliente pendente (aguardando aprovação)

### CNPJ (cnpj):
- Aceita com ou sem formatação
- Exemplos válidos:
  - `12345678000190`
  - `12.345.678/0001-90`
- Tamanho: 14 a 18 caracteres
- **Deve ser único** no sistema

### Estado (state):
- Código UF com 2 letras: `SP`, `RJ`, `MG`, `BA`, etc.

### CEP (zipCode):
- Aceita com ou sem formatação
- Exemplos válidos:
  - `12345678`
  - `12345-678`
- Tamanho: até 10 caracteres

---

## 📋 Campos do Cliente

### ✅ Obrigatórios:
| Campo | Descrição | Validação |
|-------|-----------|-----------|
| `name` | Nome do cliente | Máximo 255 caracteres |
| `cnpj` | CNPJ do cliente | 14 a 18 caracteres, único |

### 📝 Opcionais:
| Campo | Descrição | Validação |
|-------|-----------|-----------|
| `email` | Email do cliente | Formato de email válido, máx 255 caracteres |
| `phone` | Telefone fixo | Máximo 20 caracteres |
| `mobile` | Celular | Máximo 20 caracteres |
| `address` | Endereço completo | Máximo 255 caracteres |
| `city` | Cidade | Máximo 100 caracteres |
| `state` | Estado (UF) | Máximo 2 caracteres |
| `zipCode` | CEP | Máximo 10 caracteres |
| `contactName` | Nome do contato | Máximo 255 caracteres |
| `contactEmail` | Email do contato | Formato de email válido, máx 255 caracteres |
| `contactPhone` | Telefone do contato | Máximo 20 caracteres |
| `status` | Status do cliente | ACTIVE, INACTIVE, SUSPENDED, PENDING |
| `notes` | Observações | Texto longo |

---

## 🔐 Como Obter o Token JWT

Antes de cadastrar o cliente, você precisa fazer login:

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "username": "jose.ramos",
  "password": "sua_senha"
}
```

Copie o `token` da resposta e use em `Authorization: Bearer {token}`

---

## 📊 Resposta Esperada

### ✅ Sucesso (200 OK ou 201 Created):
```json
{
  "id": "uuid-gerado-automaticamente",
  "name": "ABC Comércio e Serviços",
  "cnpj": "98.765.432/0001-10",
  "email": null,
  "phone": null,
  "mobile": null,
  "address": null,
  "city": null,
  "state": null,
  "zipCode": null,
  "contactName": null,
  "contactEmail": null,
  "contactPhone": null,
  "status": "ACTIVE",
  "notes": null,
  "createdAt": "2025-10-16T14:30:00",
  "updatedAt": "2025-10-16T14:30:00"
}
```

### ❌ Erros Comuns:

#### 400 Bad Request - Nome vazio:
```json
{
  "timestamp": "2025-10-16T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Nome é obrigatório"
}
```

#### 400 Bad Request - CNPJ inválido:
```json
{
  "timestamp": "2025-10-16T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "CNPJ deve ter entre 14 e 18 caracteres"
}
```

#### 409 Conflict - CNPJ duplicado:
```json
{
  "timestamp": "2025-10-16T14:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Cliente com este CNPJ já existe"
}
```

#### 401 Unauthorized - Token inválido:
```json
{
  "timestamp": "2025-10-16T14:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token JWT inválido ou expirado"
}
```

---

## 🐛 Solução de Problemas

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | Token JWT inválido ou expirado | Faça login novamente e obtenha novo token |
| `403 Forbidden` | Usuário sem permissão | Use usuário com perfil adequado (ADMIN/SUPER_ADMIN) |
| `400 Bad Request` | JSON inválido ou campos obrigatórios faltando | Verifique o JSON e campos obrigatórios (name, cnpj) |
| `409 Conflict` | CNPJ já cadastrado | Use um CNPJ diferente |
| `500 Internal Server Error` | Erro no servidor | Verifique os logs do backend |

---

## 🧪 Testando Diferentes Cenários

### 1. Cadastro Básico (Sucesso):
```json
{
  "name": "Cliente Teste 1",
  "cnpj": "11111111000101"
}
```

### 2. Cadastro Completo (Sucesso):
Use o **EXEMPLO_COMPLETO** acima

### 3. Cliente Pendente (Sucesso):
```json
{
  "name": "Cliente em Análise",
  "cnpj": "22222222000102",
  "status": "PENDING",
  "notes": "Aguardando aprovação de documentos"
}
```

### 4. CNPJ Duplicado (Erro esperado: 409):
Execute duas vezes o mesmo JSON com o mesmo CNPJ

### 5. Nome Vazio (Erro esperado: 400):
```json
{
  "name": "",
  "cnpj": "33333333000103"
}
```

### 6. CNPJ Inválido (Erro esperado: 400):
```json
{
  "name": "Cliente Teste",
  "cnpj": "123"
}
```

---

## 📌 Dica Pro

Use **Variáveis de Ambiente** no Postman para não precisar copiar o token toda vez:

1. Crie uma variável `{{token}}`
2. No request de login, adicione em **Tests**:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```
3. Use `{{token}}` no header Authorization:
   ```
   Authorization: Bearer {{token}}
   ```

---

**Bons testes! 🚀**

