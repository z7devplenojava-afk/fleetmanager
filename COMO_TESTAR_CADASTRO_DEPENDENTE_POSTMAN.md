# 👨‍👩‍👧‍👦 Como Testar Cadastro de Dependente no Postman

## 📌 IMPORTANTE - Pré-requisitos

Antes de cadastrar um dependente, você precisa ter:
1. ✅ **Funcionário (Employee)** cadastrado no sistema
2. ✅ **Token JWT** válido

---

## 🔧 Passo 1: Obter ID do Funcionário

### 1.1 Listar Funcionários Disponíveis:
```
GET http://localhost:8081/api/employees
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta esperada:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "status": "ACTIVE"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Maria Santos",
    "cpf": "987.654.321-00",
    "status": "ACTIVE"
  }
]
```

**📋 Copie o `id` do funcionário desejado!**

---

## 📝 Passo 2: Cadastrar Dependente

### URL:
```
POST http://localhost:8081/api/dependents
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_JWT
```

---

## 📋 Exemplos de JSON

### ✅ EXEMPLO MÍNIMO (Campos Essenciais)

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "João Silva Filho",
  "relationship": "FILHO",
  "birthDate": "2010-05-15",
  "cpf": "123.456.789-00"
}
```

---

### ✅ EXEMPLO COMPLETO (Com Todos os Campos)

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "Maria Santos Oliveira",
  "relationship": "FILHA",
  "birthDate": "2008-03-20",
  "cpf": "987.654.321-00",
  "rg": "12.345.678-9",
  "gender": "F",
  "phone": "(11) 98765-4321",
  "email": "maria.oliveira@email.com",
  "address": "Rua das Flores, 123, Apto 45",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "isStudent": true,
  "schoolName": "Escola Municipal São Paulo",
  "isBeneficiary": true,
  "notes": "Estudante aplicada, necessita de acompanhamento médico especializado."
}
```

---

### ✅ EXEMPLO CÔNJUGE

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "Ana Paula Costa",
  "relationship": "ESPOSA",
  "birthDate": "1985-07-10",
  "cpf": "111.222.333-44",
  "rg": "22.333.444-5",
  "gender": "F",
  "phone": "(11) 99999-8888",
  "email": "ana.costa@email.com",
  "address": "Avenida Paulista, 1000",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310-100",
  "isStudent": false,
  "isBeneficiary": true,
  "notes": "Cônjuge do funcionário, beneficiária do plano de saúde."
}
```

---

### ✅ EXEMPLO PAI/MAE

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "José da Silva",
  "relationship": "PAI",
  "birthDate": "1955-12-25",
  "cpf": "555.666.777-88",
  "rg": "33.444.555-6",
  "gender": "M",
  "phone": "(11) 97777-6666",
  "address": "Rua dos Trabalhadores, 789",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "03456-789",
  "isStudent": false,
  "isBeneficiary": false,
  "notes": "Pai do funcionário, aposentado."
}
```

---

### ✅ EXEMPLO NETO

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "Pedro Henrique Santos",
  "relationship": "NETO",
  "birthDate": "2015-01-10",
  "cpf": "222.333.444-55",
  "gender": "M",
  "phone": "(11) 91111-2222",
  "address": "Rua das Acácias, 456",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "04567-890",
  "isStudent": true,
  "schoolName": "Creche Municipal",
  "isBeneficiary": true,
  "notes": "Neto do funcionário, frequenta creche municipal."
}
```

---

### ✅ EXEMPLO IRMÃO/IRMÃ

```json
{
  "employeeId": "COLE_O_ID_DO_FUNCIONARIO_AQUI",
  "name": "Carlos Alberto Silva",
  "relationship": "IRMAO",
  "birthDate": "1988-11-30",
  "cpf": "333.444.555-66",
  "rg": "55.666.777-8",
  "gender": "M",
  "phone": "(11) 92222-3333",
  "email": "carlos.silva@email.com",
  "address": "Rua das Palmeiras, 321",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "05678-901",
  "isStudent": false,
  "isBeneficiary": false,
  "notes": "Irmão do funcionário, mora na mesma cidade."
}
```

---

## 🔧 Valores Válidos

### Relacionamento (relationship):
- `FILHO` - Filho (masculino)
- `FILHA` - Filha (feminino)
- `CONJUGE` - Cônjuge (genérico)
- `ESPOSA` - Esposa
- `ESPOSO` - Esposo
- `PAI` - Pai
- `MAE` - Mãe
- `IRMAO` - Irmão
- `IRMA` - Irmã
- `NETO` - Neto(a)
- `SOGRO` - Sogro(a)
- `OUTRO` - Outro relacionamento

### Gênero (gender):
- `M` - Masculino
- `F` - Feminino
- `OUTRO` - Outro

### Estados (state):
- `AC` - Acre
- `AL` - Alagoas
- `AP` - Amapá
- `AM` - Amazonas
- `BA` - Bahia
- `CE` - Ceará
- `DF` - Distrito Federal
- `ES` - Espírito Santo
- `GO` - Goiás
- `MA` - Maranhão
- `MT` - Mato Grosso
- `MS` - Mato Grosso do Sul
- `MG` - Minas Gerais
- `PA` - Pará
- `PB` - Paraíba
- `PR` - Paraná
- `PE` - Pernambuco
- `PI` - Piauí
- `RJ` - Rio de Janeiro
- `RN` - Rio Grande do Norte
- `RS` - Rio Grande do Sul
- `RO` - Rondônia
- `RR` - Roraima
- `SC` - Santa Catarina
- `SP` - São Paulo
- `SE` - Sergipe
- `TO` - Tocantins

---

## 📋 Campos do Dependente

### ✅ Obrigatórios:
| Campo | Descrição | Formato |
|-------|-----------|---------|
| `employeeId` | ID do funcionário | UUID |
| `name` | Nome completo do dependente | String |
| `relationship` | Relacionamento com funcionário | FILHO, FILHA, CONJUGE, etc |
| `birthDate` | Data de nascimento | yyyy-MM-dd |
| `cpf` | CPF do dependente | String (com ou sem formatação) |

### 📝 Opcionais:
| Campo | Descrição |
|-------|-----------|
| `rg` | RG do dependente |
| `gender` | Gênero (M, F, OUTRO) |
| `phone` | Telefone |
| `email` | Email |
| `address` | Endereço completo |
| `city` | Cidade |
| `state` | Estado (UF) |
| `zipCode` | CEP |
| `isStudent` | Se é estudante (true/false) |
| `schoolName` | Nome da escola/instituição |
| `isBeneficiary` | Se é beneficiário (true/false) |
| `notes` | Observações |

---

## 🔐 Como Obter o Token JWT

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

### ✅ Sucesso (201 Created):
```json
{
  "id": "uuid-gerado-automaticamente",
  "employeeId": "uuid-do-funcionario",
  "employeeName": "Nome do Funcionário",
  "name": "Nome do Dependente",
  "relationship": "FILHO",
  "birthDate": "2010-05-15",
  "cpf": "123.456.789-00",
  "rg": "12.345.678-9",
  "gender": "M",
  "phone": "(11) 98765-4321",
  "email": "dependente@email.com",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "isStudent": true,
  "schoolName": "Escola Municipal",
  "isBeneficiary": true,
  "notes": "Observações",
  "createdAt": "2024-10-16T14:30:00",
  "updatedAt": "2024-10-16T14:30:00"
}
```

---

## ❌ Erros Comuns

### 400 Bad Request - Campos obrigatórios faltando:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Nome do dependente é obrigatório"
}
```

### 404 Not Found - Funcionário não existe:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Funcionário não encontrado"
}
```

### 409 Conflict - CPF duplicado:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "CPF já está cadastrado para outro dependente"
}
```

### 401 Unauthorized - Token inválido:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token JWT inválido ou expirado"
}
```

---

## 🧪 Passo a Passo Completo

### 1️⃣ **Login**
```
POST http://localhost:8081/api/auth/login

{
  "username": "jose.ramos",
  "password": "senha123"
}
```

### 2️⃣ **Listar Funcionários**
```
GET http://localhost:8081/api/employees
Authorization: Bearer {token_obtido_no_login}
```
📋 **Copie um ID de funcionário**

### 3️⃣ **Criar Dependente**
```
POST http://localhost:8081/api/dependents
Authorization: Bearer {token_obtido_no_login}
Content-Type: application/json

{
  "employeeId": "COLE_O_ID_COPIADO_AQUI",
  "name": "João Silva Filho",
  "relationship": "FILHO",
  "birthDate": "2010-05-15",
  "cpf": "123.456.789-00"
}
```

### 4️⃣ **Listar Dependentes do Funcionário**
```
GET http://localhost:8081/api/dependents/employee/{employeeId}
Authorization: Bearer {token_obtido_no_login}
```

### 5️⃣ **Buscar Dependente por ID**
```
GET http://localhost:8081/api/dependents/{dependentId}
Authorization: Bearer {token_obtido_no_login}
```

### 6️⃣ **Atualizar Dependente**
```
PUT http://localhost:8081/api/dependents/{dependentId}
Authorization: Bearer {token_obtido_no_login}
Content-Type: application/json

{
  "name": "João Silva Filho Atualizado",
  "isStudent": true,
  "schoolName": "Escola Nova"
}
```

### 7️⃣ **Excluir Dependente**
```
DELETE http://localhost:8081/api/dependents/{dependentId}
Authorization: Bearer {token_obtido_no_login}
```

---

## 🐛 Solução de Problemas

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | Token JWT inválido ou expirado | Faça login novamente |
| `403 Forbidden` | Usuário sem permissão | Use usuário com perfil adequado |
| `400 Bad Request` | JSON inválido ou campos obrigatórios faltando | Verifique todos os campos obrigatórios |
| `404 Not Found` | ID de funcionário não existe | Verifique o ID usando GET /api/employees |
| `409 Conflict` | CPF já cadastrado para outro dependente | Use um CPF diferente |
| `500 Internal Server Error` | Erro no servidor | Verifique os logs do backend |

---

## 📌 Dicas Importantes

1. **Dependente DEVE ser associado a um funcionário** (employeeId obrigatório)
2. **Datas** devem estar no formato `yyyy-MM-dd` (ex: `2024-01-15`)
3. **CPF** deve ser único por dependente
4. **Relacionamento** deve ser um dos valores válidos da lista
5. **Funcionário** deve existir no sistema antes de criar o dependente
6. **Campos de estudante e beneficiário** são úteis para relatórios e benefícios
7. **Observações** podem conter informações importantes sobre saúde, necessidades especiais, etc

---

## 💡 Variáveis de Ambiente no Postman

Configure variáveis para facilitar os testes:

```javascript
// No request de login, adicione em Tests:
pm.environment.set("token", pm.response.json().token);

// No request de listar funcionários, adicione em Tests:
const employees = pm.response.json().content;
if (employees.length > 0) {
  pm.environment.set("employee_id", employees[0].id);
}
```

Depois use assim no JSON:
```json
{
  "employeeId": "{{employee_id}}"
}
```

---

## 🎯 Testando Diferentes Cenários

### ✅ Dependente Filho (Sucesso):
Use o **EXEMPLO_MINIMO** com `relationship: "FILHO"`

### ✅ Dependente Cônjuge (Sucesso):
Use o **EXEMPLO_CONJUGE**

### ✅ Dependente Pai/Mãe (Sucesso):
Use o **EXEMPLO_PAI** ou **EXEMPLO_MAE**

### ❌ Funcionário Inválido (Erro esperado: 404):
```json
{
  ...campos...,
  "employeeId": "00000000-0000-0000-0000-000000000000"
}
```

### ❌ CPF Duplicado (Erro esperado: 409):
Execute duas vezes o mesmo JSON

### ❌ Relacionamento Inválido (Erro esperado: 400):
```json
{
  ...campos...,
  "relationship": "RELACIONAMENTO_INVALIDO"
}
```

---

## 🔗 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/dependents` | Lista todos os dependentes |
| `GET` | `/api/dependents/{id}` | Busca dependente por ID |
| `GET` | `/api/dependents/employee/{employeeId}` | Lista dependentes de um funcionário |
| `GET` | `/api/dependents/cpf/{cpf}` | Busca dependentes por CPF |
| `GET` | `/api/dependents/relationship/{relationship}` | Lista por relacionamento |
| `POST` | `/api/dependents` | Cria novo dependente |
| `PUT` | `/api/dependents/{id}` | Atualiza dependente |
| `DELETE` | `/api/dependents/{id}` | Exclui dependente |

---

**Bons testes! 🚀**
