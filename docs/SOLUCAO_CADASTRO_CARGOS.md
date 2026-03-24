# Solução para Cadastro de Cargos e Funcionários

## Problema Identificado

Você estava tentando cadastrar funcionários usando um formato que não é compatível com o backend. O backend espera um formato específico para os relacionamentos entre entidades.

## Diferenças nos Formatos

### ❌ Formato que você estava usando:
```json
{
    "name": "Pedro Henrique Mendes",
    "email": "pedro.mendes@promovervigilancia.com.br",
    "phone": "31944443333",
    "cpf": "321.654.987-00",
    "rg": "32.165.498-7",
    "document": "32165498700",
    "nationality": "Brasileiro",
    "maritalStatus": "MARRIED",
    "role": "EMPLOYEE",  // ❌ Campo incorreto
    "status": "ACTIVE",
    "registrationNumber": "MOT001",
    "hireDate": "2024-05-30",
    "position": {
        "id": "e75384b3-802e-4fc2-82bc-912588120db5"
    },
    "unit": {
        "id": "afe8ecc3-fdf4-4a44-87fa-a3b427a7a525"
    },
    "user": {
        "id": "eb3b993c-08a2-4537-bfbb-d758bd03723e"
    }
}
```

### ✅ Formato correto que o backend espera:
```json
{
    "name": "Pedro Henrique Mendes",
    "email": "pedro.mendes@promovervigilancia.com.br",
    "phone": "31944443333",
    "cpf": "321.654.987-00",
    "rg": "32.165.498-7",
    "document": "32165498700",
    "nationality": "Brasileiro",
    "maritalStatus": "MARRIED",
    "status": "ACTIVE",
    "registrationNumber": "MOT001",
    "hireDate": "2024-05-30",
    "address": "Rua das Flores, 123",  // ✅ Campo obrigatório
    "birthDate": "1990-05-15",         // ✅ Campo obrigatório
    "position": {
        "id": "e75384b3-802e-4fc2-82bc-912588120db5"
    },
    "unit": {
        "id": "afe8ecc3-fdf4-4a44-87fa-a3b427a7a525"
    },
    "user": {
        "id": "eb3b993c-08a2-4537-bfbb-d758bd03723e"
    }
}
```

## Como Cadastrar Cargos (Positions)

### 1. **Formato para criar cargo:**
```json
{
    "name": "Vigilante",
    "description": "Cargo de vigilante",
    "baseSalary": 1500.00,
    "unit": {
        "id": "afe8ecc3-fdf4-4a44-87fa-a3b427a7a525"
    }
}
```

### 2. **Endpoint para criar cargo:**
```
POST /api/positions
```

### 3. **Script de teste criado:**
Execute o script `test_positions_cadastro.ps1` para:
- Fazer login
- Buscar unidades existentes
- Criar cargos de teste (Vigilante, Supervisor, Gerente)
- Listar cargos criados
- Testar criação de funcionário

## Passos para Resolver

### 1. **Iniciar o Backend:**
```bash
cd backend
mvn spring-boot:run
```

### 2. **Executar o script de teste:**
```powershell
.\test_positions_cadastro.ps1
```

### 3. **Verificar se os cargos foram criados:**
O script irá mostrar os cargos criados com seus IDs.

### 4. **Usar os IDs corretos no cadastro de funcionários:**
Use os IDs retornados pelo script para criar funcionários.

## Correções Implementadas

### 1. **Frontend Atualizado:**
- ✅ Modal de funcionários corrigido para usar o formato correto
- ✅ Serviço de employee atualizado
- ✅ Tipos TypeScript corrigidos

### 2. **Scripts de Teste:**
- ✅ `test_positions_cadastro.ps1` - Para testar cargos
- ✅ `test_funcionario_cadastro.ps1` - Para testar funcionários

### 3. **Documentação:**
- ✅ `MELHORIAS_CADASTRO_FUNCIONARIOS.md` - Documentação das melhorias
- ✅ `SOLUCAO_CADASTRO_CARGOS.md` - Este documento

## Campos Obrigatórios para Funcionário

1. **Dados Pessoais:**
   - `name` - Nome completo
   - `cpf` - CPF (único)
   - `rg` - RG (único)
   - `email` - Email (único)
   - `phone` - Telefone
   - `address` - Endereço
   - `birthDate` - Data de nascimento
   - `maritalStatus` - Estado civil
   - `nationality` - Nacionalidade

2. **Dados Profissionais:**
   - `registrationNumber` - Número de registro
   - `hireDate` - Data de admissão
   - `status` - Status (ACTIVE, INACTIVE, VACATION, TERMINATED)
   - `position` - Cargo (obrigatório)
   - `unit` - Unidade (opcional)
   - `user` - Usuário (opcional)

## Campos Obrigatórios para Cargo

1. **Dados do Cargo:**
   - `name` - Nome do cargo
   - `description` - Descrição (opcional)
   - `baseSalary` - Salário base
   - `unit` - Unidade (obrigatório)

## Testando a Solução

1. **Execute o backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Execute o script de teste:**
   ```powershell
   .\test_positions_cadastro.ps1
   ```

3. **Verifique a saída:**
   - Login realizado com sucesso
   - Unidades encontradas
   - Cargos criados com sucesso
   - Funcionário criado com sucesso

4. **Use o frontend:**
   - Acesse a página de cadastro de funcionários
   - Os campos select devem estar funcionando
   - Selecione cargo, unidade e usuário
   - Preencha os dados obrigatórios
   - Salve o funcionário

## Próximos Passos

1. **Testar o cadastro via frontend**
2. **Verificar se os relacionamentos estão corretos**
3. **Implementar validações adicionais se necessário**
4. **Documentar novos casos de uso**

## Arquivos Modificados

- ✅ `frontend/src/services/employeeService.ts`
- ✅ `frontend/src/components/funcionarios/FuncionarioNovoModal.tsx`
- ✅ `test_positions_cadastro.ps1` (criado)
- ✅ `SOLUCAO_CADASTRO_CARGOS.md` (criado)

Agora você deve conseguir cadastrar cargos e funcionários corretamente! 