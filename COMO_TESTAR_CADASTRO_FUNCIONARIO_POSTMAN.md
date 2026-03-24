# 👨‍💼 Como Testar Cadastro de Funcionário no Postman

## 📌 IMPORTANTE - Pré-requisitos

Antes de cadastrar um funcionário, você precisa ter:
1. ✅ **Cargo (Position)** cadastrado no sistema
2. ✅ **Unidade (Unit)** cadastrada no sistema
3. ✅ **Token JWT** válido

---

## 🔧 Passo 1: Obter IDs de Cargo e Unidade

### 1.1 Listar Cargos Disponíveis:
```
GET http://localhost:8081/api/positions
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta esperada:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Vigilante",
    "description": "Vigilante Patrimonial"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Supervisor",
    "description": "Supervisor de Segurança"
  }
]
```

**📋 Copie o `id` do cargo desejado!**

---

### 1.2 Listar Unidades Disponíveis:
```
GET http://localhost:8081/api/units
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta esperada:**
```json
[
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "name": "Shopping Plaza",
    "type": "CLIENT_SITE"
  },
  {
    "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
    "name": "Sede Administrativa",
    "type": "HEADQUARTERS"
  }
]
```

**📋 Copie o `id` da unidade desejada!**

---

## 📝 Passo 2: Cadastrar Funcionário

### URL:
```
POST http://localhost:8081/api/employees
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
  "name": "João da Silva",
  "cpf": "123.456.789-00",
  "email": "joao.silva@email.com",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "registrationNumber": "EMP001",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "position": {
    "id": "COLE_O_ID_DO_CARGO_AQUI"
  },
  "unit": {
    "id": "COLE_O_ID_DA_UNIDADE_AQUI"
  }
}
```

---

### ✅ EXEMPLO COMPLETO (Com Todos os Campos)

```json
{
  "name": "Maria Santos Oliveira",
  "cpf": "987.654.321-00",
  "rg": "12.345.678-9",
  "email": "maria.santos@empresa.com.br",
  "phone": "(11) 3456-7890",
  "birthDate": "1988-03-20",
  "gender": "F",
  "registrationNumber": "EMP002",
  "hireDate": "2023-06-01",
  "status": "ACTIVE",
  "notes": "Funcionária exemplar. Responsável pelo setor de segurança patrimonial.",
  "address": {
    "street": "Avenida Paulista, 1000",
    "number": "Apto 501",
    "complement": "Bloco B",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "position": {
    "id": "COLE_O_ID_DO_CARGO_AQUI"
  },
  "unit": {
    "id": "COLE_O_ID_DA_UNIDADE_AQUI"
  },
  "cnhNumber": "12345678900",
  "cnhCategory": "B",
  "cnhExpirationDate": "2026-03-20",
  "ctps": "1234567",
  "ctpsSeries": "001",
  "ctpsIssueDate": "2010-01-15",
  "ctpsIssuingAgency": "SP",
  "tituloEleitorZona": "123",
  "tituloEleitorSecao": "0456",
  "carteiraIdentidadeOrgaoEmissor": "SSP-SP",
  "carteiraIdentidadeDataEmissao": "2008-05-10",
  "nomePai": "José Santos",
  "nomeMae": "Ana Oliveira",
  "localNascimento": "São Paulo/SP",
  "grauInstrucao": "SUPERIOR_COMPLETO",
  "cbo": "5173-30",
  "salario": 3500.00,
  "salarioPorExtenso": "Três mil e quinhentos reais",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "Segunda a Sexta: 08h às 17h | Sábado: 08h às 12h",
  "folgaSemanal": "Domingo",
  "fgtsOptante": true,
  "fgtsDataOpcao": "2023-06-01",
  "fgtsBancoDepositario": "Banco do Brasil",
  "empresaNome": "Secured Guard Segurança Ltda",
  "empresaEndereco": "Rua Comercial, 500 - São Paulo/SP",
  "empresaCnpj": "12.345.678/0001-90"
}
```

---

### ✅ EXEMPLO VIGILANTE

```json
{
  "name": "Carlos Alberto Pereira",
  "cpf": "111.222.333-44",
  "rg": "22.333.444-5",
  "email": "carlos.pereira@seguranca.com",
  "phone": "(11) 99999-8888",
  "birthDate": "1985-07-10",
  "gender": "M",
  "registrationNumber": "VIG001",
  "hireDate": "2022-03-15",
  "status": "ACTIVE",
  "notes": "Vigilante com curso de reciclagem em dia. Armado e habilitado.",
  "address": {
    "street": "Rua dos Trabalhadores, 789",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "03456-789"
  },
  "position": {
    "id": "COLE_O_ID_DO_CARGO_VIGILANTE"
  },
  "unit": {
    "id": "COLE_O_ID_DA_UNIDADE"
  },
  "cnhNumber": "98765432100",
  "cnhCategory": "AB",
  "cnhExpirationDate": "2027-07-10",
  "certificadoMilitar": "RA123456",
  "cbo": "5173-30",
  "salario": 2800.00,
  "salarioPorExtenso": "Dois mil e oitocentos reais",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "Escala 12x36",
  "folgaSemanal": "Conforme escala"
}
```

---

### ✅ EXEMPLO SUPERVISOR

```json
{
  "name": "Ana Paula Costa",
  "cpf": "555.666.777-88",
  "rg": "33.444.555-6",
  "email": "ana.costa@empresa.com.br",
  "phone": "(11) 97777-6666",
  "birthDate": "1982-11-25",
  "gender": "F",
  "registrationNumber": "SUP001",
  "hireDate": "2020-01-05",
  "status": "ACTIVE",
  "notes": "Supervisora com 15 anos de experiência em segurança patrimonial.",
  "address": {
    "street": "Rua das Acácias, 456",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "04567-890"
  },
  "position": {
    "id": "COLE_O_ID_DO_CARGO_SUPERVISOR"
  },
  "unit": {
    "id": "COLE_O_ID_DA_UNIDADE"
  },
  "spouseName": "Roberto Costa",
  "spouseCpf": "999.888.777-66",
  "spouseBirthDate": "1980-08-15",
  "spousePhone": "(11) 96666-5555",
  "cnhNumber": "11122233344",
  "cnhCategory": "AB",
  "cnhExpirationDate": "2028-11-25",
  "cbo": "5172-05",
  "salario": 5200.00,
  "salarioPorExtenso": "Cinco mil e duzentos reais",
  "periodoPagamento": "MENSAL",
  "horarioTrabalho": "Segunda a Sexta: 08h às 18h",
  "folgaSemanal": "Sábado e Domingo",
  "fgtsOptante": true
}
```

---

## 🔧 Valores Válidos

### Status (status):
- `ACTIVE` - Funcionário ativo (padrão)
- `INACTIVE` - Funcionário inativo
- `VACATION` - Em férias
- `MATERNITY_LEAVE` - Licença maternidade
- `MEDICAL_CERTIFICATE` - Com atestado médico
- `TERMINATED` - Demitido
- `SUSPENDED` - Suspenso

### Gênero (gender):
- `M` - Masculino
- `F` - Feminino
- `OUTRO` - Outro

### Categoria CNH (cnhCategory):
- `A` - Moto
- `B` - Carro
- `AB` - Moto e Carro
- `C` - Caminhão
- `D` - Ônibus
- `E` - Carreta

### Grau de Instrução (grauInstrucao):
- `FUNDAMENTAL_INCOMPLETO`
- `FUNDAMENTAL_COMPLETO`
- `MEDIO_INCOMPLETO`
- `MEDIO_COMPLETO`
- `SUPERIOR_INCOMPLETO`
- `SUPERIOR_COMPLETO`
- `POS_GRADUACAO`

---

## 📋 Campos do Funcionário

### ✅ Obrigatórios:
| Campo | Descrição | Formato |
|-------|-----------|---------|
| `name` | Nome completo | String |
| `cpf` | CPF | String (com ou sem formatação) |
| `email` | Email | String (formato email) |
| `phone` | Telefone | String |
| `birthDate` | Data de nascimento | yyyy-MM-dd |
| `registrationNumber` | Matrícula/Registro | String |
| `hireDate` | Data de admissão | yyyy-MM-dd |
| `status` | Status do funcionário | ACTIVE, INACTIVE, etc |
| `address` | Endereço completo | Objeto (ver estrutura abaixo) |

### 📝 Recomendados:
| Campo | Descrição |
|-------|-----------|
| `position` | Cargo do funcionário (objeto com `id`) |
| `unit` | Unidade de lotação (objeto com `id`) |
| `rg` | RG |
| `cnhNumber` | Número da CNH |
| `cnhCategory` | Categoria da CNH |
| `cnhExpirationDate` | Validade da CNH |

### 🔹 Opcionais:
- Dados do cônjuge: `spouseName`, `spouseCpf`, `spouseBirthDate`, etc
- Documentos: `ctps`, `pis`, `certificadoMilitar`, etc
- Salário: `salario`, `salarioPorExtenso`, `periodoPagamento`
- Horário: `horarioTrabalho`, `folgaSemanal`
- FGTS: `fgtsOptante`, `fgtsDataOpcao`, etc
- Pais: `nomePai`, `nomeMae`, `localNascimento`
- E muito mais...

---

## 📐 Estrutura do Objeto Address

```json
{
  "street": "Nome da rua, número",
  "number": "Número (opcional)",
  "complement": "Complemento (opcional)",
  "neighborhood": "Bairro (opcional)",
  "city": "Cidade",
  "state": "UF (2 letras)",
  "zipCode": "CEP"
}
```

**Exemplo:**
```json
{
  "street": "Avenida Paulista, 1000",
  "number": "Apto 501",
  "complement": "Bloco B",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310-100"
}
```

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
  "name": "João da Silva",
  "cpf": "123.456.789-00",
  "email": "joao.silva@email.com",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "registrationNumber": "EMP001",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "position": {
    "id": "uuid-do-cargo",
    "name": "Vigilante"
  },
  "unit": {
    "id": "uuid-da-unidade",
    "name": "Shopping Plaza"
  },
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
  "message": "Nome é obrigatório"
}
```

### 400 Bad Request - CPF inválido:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "CPF inválido"
}
```

### 404 Not Found - Cargo não existe:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Cargo não encontrado com o ID informado"
}
```

### 409 Conflict - CPF duplicado:
```json
{
  "timestamp": "2024-10-16T14:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Funcionário com este CPF já existe"
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

### 2️⃣ **Listar Cargos**
```
GET http://localhost:8081/api/positions
Authorization: Bearer {token_obtido_no_login}
```
📋 **Copie um ID de cargo**

### 3️⃣ **Listar Unidades**
```
GET http://localhost:8081/api/units
Authorization: Bearer {token_obtido_no_login}
```
📋 **Copie um ID de unidade**

### 4️⃣ **Criar Funcionário**
```
POST http://localhost:8081/api/employees
Authorization: Bearer {token_obtido_no_login}
Content-Type: application/json

{
  "name": "João da Silva",
  "cpf": "123.456.789-00",
  "email": "joao.silva@email.com",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "registrationNumber": "EMP001",
  "hireDate": "2024-01-10",
  "status": "ACTIVE",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "position": {
    "id": "COLE_O_ID_COPIADO_AQUI"
  },
  "unit": {
    "id": "COLE_O_ID_COPIADO_AQUI"
  }
}
```

---

## 🐛 Solução de Problemas

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | Token JWT inválido ou expirado | Faça login novamente |
| `403 Forbidden` | Usuário sem permissão | Use usuário com perfil adequado |
| `400 Bad Request` | JSON inválido ou campos obrigatórios faltando | Verifique todos os campos obrigatórios |
| `404 Not Found` | ID de cargo ou unidade não existe | Verifique os IDs usando GET /api/positions e /api/units |
| `409 Conflict` | CPF já cadastrado | Use um CPF diferente |
| `500 Internal Server Error` | Erro no servidor (ex: coluna faltando) | Verifique os logs do backend |

---

## 📌 Dicas Importantes

1. **Datas** devem estar no formato `yyyy-MM-dd` (ex: `2024-01-15`)
2. **CPF** pode ser enviado com ou sem formatação (ambos funcionam)
3. **Status** padrão é `ACTIVE` se não informado
4. **Position e Unit** precisam ter IDs válidos (obter via GET antes)
5. **Address** é um objeto obrigatório com pelo menos `street`, `city`, `state`, `zipCode`
6. **User** é opcional (apenas se o funcionário também for usuário do sistema)

---

## 💡 Variáveis de Ambiente no Postman

Configure variáveis para facilitar os testes:

```javascript
// No request de login, adicione em Tests:
pm.environment.set("token", pm.response.json().token);

// No request de listar cargos, adicione em Tests:
const cargos = pm.response.json();
if (cargos.length > 0) {
  pm.environment.set("position_id", cargos[0].id);
}

// No request de listar unidades, adicione em Tests:
const unidades = pm.response.json();
if (unidades.length > 0) {
  pm.environment.set("unit_id", unidades[0].id);
}
```

Depois use assim no JSON:
```json
{
  "position": {
    "id": "{{position_id}}"
  },
  "unit": {
    "id": "{{unit_id}}"
  }
}
```

---

## 🎯 Testando Diferentes Cenários

### ✅ Funcionário Ativo (Sucesso):
Use o **EXEMPLO_MINIMO**

### ✅ Funcionário com Cônjuge (Sucesso):
Use o **EXEMPLO_SUPERVISOR** (tem dados do cônjuge)

### ✅ Funcionário em Férias (Sucesso):
```json
{
  ...campos obrigatórios...,
  "status": "VACATION"
}
```

### ❌ CPF Duplicado (Erro esperado: 409):
Execute duas vezes o mesmo JSON

### ❌ Cargo Inválido (Erro esperado: 404):
```json
{
  ...campos...,
  "position": {
    "id": "00000000-0000-0000-0000-000000000000"
  }
}
```

---

**Bons testes! 🚀**

