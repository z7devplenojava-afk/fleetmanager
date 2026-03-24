# 🔍 Diagnóstico - Erro 500 ao Criar Funcionário

## 📋 Informações do Erro

**Erro**: 500 Internal Server Error ao tentar criar funcionário via `/api/employees`

**Frontend**: 
```
Failed to load resource: the server responded with a status of 500 ()
❌ Axios Response Error: 500 /employees
Erro ao criar funcionário: AxiosError
Erro ao cadastrar funcionário: Error: Falha ao criar funcionário
```

---

## 🔧 Passos para Diagnóstico

### 1. Verificar Logs do Backend

O backend está configurado com logs detalhados no método `create` do `EmployeeService`. 

Quando você tentar criar um funcionário, procure por estas mensagens no console do backend:

```
[DEBUG] EmployeeService.create - Iniciando criação de funcionário
[DEBUG] DTO recebido: [NOME] - [CPF]
[DEBUG] Validações passaram, convertendo DTO para Entity
[DEBUG] Entity criada, salvando no banco
[DEBUG] Funcionário salvo com ID: [UUID]
```

**OU** mensagens de erro:

```
[ERROR] Erro ao criar funcionário: [MENSAGEM DO ERRO]
```

### 2. Verificar Payload Enviado

Abra as **DevTools do navegador** (F12) e vá em **Network** > **Payload** da requisição `/api/employees`.

Copie o JSON completo que está sendo enviado.

### 3. Verificar Response do Backend

Ainda nas **DevTools**, vá em **Response** da mesma requisição.

Copie a resposta completa do backend (geralmente contém a stack trace do erro).

---

## 🎯 Possíveis Causas do Erro 500

### 1. **Campo Obrigatório Faltando**
- `name` (obrigatório)
- `registrationNumber` (obrigatório)
- `hireDate` (obrigatório)
- `status` (obrigatório)

### 2. **Validação de Email ou CPF**
- Email já cadastrado
- CPF já cadastrado
- Formato inválido

### 3. **Relação com Company**
- `company.id` inválido ou empresa não existe
- Campo `company_id` null quando deveria ter valor

### 4. **Relação com Position**
- `position.id` inválido ou cargo não existe

### 5. **Relação com User**
- `user.id` inválido ou usuário não existe

### 6. **Erro de Banco de Dados**
- Coluna faltando na tabela `employees`
- Constraint violada
- Tipo de dado incompatível

---

## 📝 Exemplo de JSON Mínimo que Deveria Funcionar

```json
{
  "name": "João da Silva",
  "registrationNumber": "12345",
  "hireDate": "2025-01-15",
  "status": "ACTIVE",
  "document": "12345678901",
  "address": {
    "street": "Rua Exemplo, 123"
  }
}
```

---

## 🚨 Próximos Passos

1. **Aguardar** o backend inicializar completamente (cerca de 30 segundos)
2. **Tentar** criar um funcionário novamente no frontend
3. **Copiar** os logs do backend (console onde o Java está rodando)
4. **Copiar** a resposta do erro do backend (DevTools > Network > Response)
5. **Fornecer** essas informações para análise detalhada

---

## 💡 Dica

Se o erro persistir, podemos:
- Testar direto via Postman com o JSON mínimo
- Verificar se há alguma migration pendente
- Verificar se a tabela `employees` tem todas as colunas necessárias
- Desabilitar validações temporariamente para isolar o problema

