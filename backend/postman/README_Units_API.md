# Units API - Postman Collection

## 📋 Descrição

Esta coleção do Postman contém todos os endpoints da API de Unidades do sistema SecuredGuard, permitindo testar todas as funcionalidades CRUD implementadas.

## 🚀 Como Usar

### 1. Importar a Coleção

1. Abra o Postman
2. Clique em "Import"
3. Selecione os arquivos:
   - `Units_API.postman_collection.json`
   - `Units_API.postman_environment.json`

### 2. Configurar o Ambiente

1. Selecione o ambiente "Units API Environment" no dropdown superior direito
2. Configure as variáveis:
   - `baseUrl`: URL do backend (padrão: http://localhost:8081)
   - `token`: Token de autenticação JWT (obtido via login)

### 3. Obter Token de Autenticação

Antes de usar os endpoints, você precisa fazer login para obter o token:

```bash
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Copie o token da resposta e configure na variável `token` do ambiente.

## 📝 Endpoints Disponíveis

### 1. Criar Unidade
- **Método**: POST
- **URL**: `{{baseUrl}}/api/units`
- **Descrição**: Cria uma nova unidade no sistema
- **Body**: JSON com dados da unidade

### 2. Listar Todas as Unidades
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units`
- **Descrição**: Retorna todas as unidades cadastradas

### 3. Buscar Unidade por ID
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/{{unitId}}`
- **Descrição**: Busca uma unidade específica pelo seu ID

### 4. Buscar Unidade por Nome
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/name/{{unitName}}`
- **Descrição**: Busca uma unidade pelo seu nome

### 5. Buscar Unidade por Email
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/email/{{unitEmail}}`
- **Descrição**: Busca uma unidade pelo seu email

### 6. Buscar Unidades por Endereço
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/address/{{address}}`
- **Descrição**: Busca unidades que contenham o endereço especificado

### 7. Buscar Subunidades
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/parent/{{parentUnitId}}`
- **Descrição**: Busca todas as subunidades de uma unidade pai

### 8. Atualizar Unidade
- **Método**: PUT
- **URL**: `{{baseUrl}}/api/units/{{unitId}}`
- **Descrição**: Atualiza uma unidade existente
- **Body**: JSON com dados atualizados

### 9. Excluir Unidade
- **Método**: DELETE
- **URL**: `{{baseUrl}}/api/units/{{unitId}}`
- **Descrição**: Exclui uma unidade do sistema

### 10. Verificar Possibilidade de Exclusão
- **Método**: GET
- **URL**: `{{baseUrl}}/api/units/{{unitId}}/can-delete`
- **Descrição**: Verifica se uma unidade pode ser excluída sem violar restrições

## 📊 Estrutura de Dados

### Criar/Atualizar Unidade
```json
{
  "name": "Nome da Unidade",
  "description": "Descrição da unidade",
  "address": "Endereço completo",
  "phone": "(31) 99999-8888",
  "email": "unidade@empresa.com",
  "parentId": "uuid-da-unidade-pai",
  "clientId": 1
}
```

### Resposta de Unidade
```json
{
  "id": "uuid-da-unidade",
  "name": "Nome da Unidade",
  "description": "Descrição da unidade",
  "address": "Endereço completo",
  "phone": "(31) 99999-8888",
  "email": "unidade@empresa.com",
  "parentId": "uuid-da-unidade-pai",
  "clientId": 1,
  "createdAt": "2025-06-25T08:30:00",
  "updatedAt": "2025-06-25T08:30:00"
}
```

### Resposta de Verificação de Exclusão
```json
{
  "canDelete": false,
  "unitName": "Nome da Unidade",
  "dependencies": {
    "positions": 2,
    "employees": 1,
    "payrolls": 0,
    "locations": 0,
    "children": 0
  }
}
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `baseUrl` | URL base da API | http://localhost:8081 |
| `token` | Token JWT de autenticação | eyJhbGciOiJIUzI1NiIs... |
| `unitId` | ID de uma unidade específica | 575fa8dc-0bbd-4a7f-91b9-84f4741d9196 |
| `unitName` | Nome de uma unidade | Unidade BH Shopping |
| `unitEmail` | Email de uma unidade | bhshopping@securedguard.com |
| `address` | Endereço para busca | BH Shopping |
| `parentUnitId` | ID da unidade pai | uuid-da-unidade-pai |

## 🧪 Fluxo de Teste Recomendado

1. **Login** - Obter token de autenticação
2. **Criar Unidade** - Criar uma nova unidade
3. **Listar Unidades** - Verificar se a unidade foi criada
4. **Buscar por ID** - Buscar a unidade criada pelo ID
5. **Atualizar Unidade** - Modificar dados da unidade
6. **Verificar Atualização** - Listar novamente para confirmar
7. **Excluir Unidade** - Remover a unidade de teste

## ⚠️ Observações

- Todos os endpoints requerem autenticação JWT
- O token deve ser incluído no header `Authorization: Bearer {{token}}`
- IDs de unidades são UUIDs
- Campos opcionais podem ser omitidos ou enviados como `null`

## 🐛 Troubleshooting

### Erro 401 - Unauthorized
- Verifique se o token está configurado corretamente
- Faça login novamente para obter um novo token

### Erro 400 - Bad Request
- Verifique se todos os campos obrigatórios estão preenchidos
- Valide o formato do JSON enviado

### Erro 404 - Not Found
- Verifique se o ID da unidade está correto
- Confirme se a unidade existe no sistema

### Erro 500 - Internal Server Error
- Verifique se o backend está rodando
- Consulte os logs do servidor para mais detalhes 

# API de Unidades - Documentação Completa

## Endpoints Disponíveis

### 1. Listar Unidades (com filtros)
- **GET** `/api/units`
- **Descrição**: Retorna unidades com opções de filtro
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR, RH, FINANCEIRO, OPERACIONAL
- **Parâmetros de Query**:
  - `name`: Filtrar por nome (busca parcial)
  - `email`: Filtrar por email (busca parcial)
  - `phone`: Filtrar por telefone (busca parcial)
  - `rootOnly`: Retornar apenas unidades raiz (true/false)

### 2. Buscar Unidade por ID
- **GET** `/api/units/{id}`
- **Descrição**: Retorna uma unidade específica por ID
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR, RH, FINANCEIRO, OPERACIONAL

### 3. Criar Nova Unidade
- **POST** `/api/units`
- **Descrição**: Cria uma nova unidade
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR
- **Body**: JSON com dados da unidade

### 4. Atualizar Unidade (Melhorado)
- **PUT** `/api/units/{id}`
- **Descrição**: Atualiza uma unidade existente usando UnitCreateDTO
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR
- **Body**: JSON com dados da unidade (mesmo formato da criação)

### 5. Excluir Unidade
- **DELETE** `/api/units/{id}`
- **Descrição**: Exclui uma unidade (apenas se não tiver dependências)
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR

### 6. Excluir Unidade com Dependências
- **DELETE** `/api/units/{id}/with-dependencies`
- **Descrição**: Exclui uma unidade e remove todas as suas dependências
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR
- **⚠️ Aviso**: Esta operação remove permanentemente todos os dados relacionados

### 7. Verificar Possibilidade de Exclusão
- **GET** `/api/units/{id}/can-delete`
- **Descrição**: Verifica se uma unidade pode ser excluída sem violar restrições
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR
- **Resposta**: JSON com informações sobre dependências

### 8. Buscar por Nome
- **GET** `/api/units/name/{name}`
- **Descrição**: Busca unidade por nome exato
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR

### 9. Buscar por Email
- **GET** `/api/units/email/{email}`
- **Descrição**: Busca unidade por email exato
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR

### 10. Buscar por Endereço
- **GET** `/api/units/address/{address}`
- **Descrição**: Busca unidades por parte do endereço
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR

### 11. Buscar Subunidades
- **GET** `/api/units/parent/{parentId}`
- **Descrição**: Busca subunidades de uma unidade pai
- **Autenticação**: Bearer Token
- **Papéis**: ADMIN, GESTOR

## Estrutura de Dados

### UnitCreateDTO (para criação e atualização)
```json
{
  "name": "Nome da Unidade",
  "description": "Descrição opcional",
  "address": "Endereço completo",
  "phone": "(11) 99999-9999",
  "email": "unidade@empresa.com",
  "parentId": "uuid-da-unidade-pai-ou-null",
  "clientId": 1
}
```

### UnitDTO (para resposta)
```json
{
  "id": "uuid-da-unidade",
  "name": "Nome da Unidade",
  "description": "Descrição da unidade",
  "address": "Endereço completo",
  "phone": "(11) 99999-9999",
  "email": "unidade@empresa.com",
  "parentId": "uuid-da-unidade-pai-ou-null",
  "parentName": "Nome da Unidade Pai",
  "clientId": 1,
  "clientName": "Nome do Cliente",
  "createdAt": "2025-06-25T10:00:00",
  "updatedAt": "2025-06-25T10:00:00"
}
```

### Resposta de Verificação de Exclusão
```json
{
  "canDelete": false,
  "unitName": "Nome da Unidade",
  "dependencies": {
    "positions": 2,
    "employees": 1,
    "payrolls": 0,
    "locations": 0,
    "children": 0
  }
}
```

## Validações

### Campos Obrigatórios
- `name`: Nome da unidade (3-100 caracteres)
- `address`: Endereço (5-255 caracteres)

### Campos Opcionais
- `description`: Descrição (máximo 500 caracteres)
- `phone`: Telefone (formato flexível)
- `email`: Email válido
- `parentId`: ID da unidade pai (UUID)
- `clientId`: ID do cliente (Long)

### Restrições de Exclusão
Uma unidade **NÃO** pode ser excluída se possuir:
- Funcionários vinculados
- Cargos (positions) vinculados
- Folhas de pagamento vinculadas
- Localizações vinculadas
- Subunidades (children) vinculadas

## Códigos de Resposta

- **200**: Sucesso
- **201**: Unidade criada com sucesso
- **400**: Dados inválidos ou restrições de exclusão
- **401**: Não autenticado
- **403**: Acesso negado (papel insuficiente)
- **404**: Unidade não encontrada
- **409**: Nome ou email já existe

## Exemplos de Uso

### Listar com Filtros
```bash
# Todas as unidades
curl -X GET "http://localhost:8081/api/units" \
  -H "Authorization: Bearer SEU_TOKEN"

# Filtrar por nome
curl -X GET "http://localhost:8081/api/units?name=Centro" \
  -H "Authorization: Bearer SEU_TOKEN"

# Apenas unidades raiz
curl -X GET "http://localhost:8081/api/units?rootOnly=true" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Criar Unidade
```bash
curl -X POST http://localhost:8081/api/units \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filial São Paulo",
    "address": "Rua das Flores, 123 - São Paulo/SP",
    "phone": "(11) 3333-4444",
    "email": "sp@empresa.com"
  }'
```

### Atualizar Unidade
```bash
curl -X PUT http://localhost:8081/api/units/00000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matriz Atualizada",
    "address": "Rua Nova, 456 - São Paulo/SP",
    "phone": "(11) 99999-8888",
    "email": "matriz@empresa.com"
  }'
```

### Verificar Exclusão
```bash
curl -X GET http://localhost:8081/api/units/00000000-0000-0000-0000-000000000005/can-delete \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Excluir com Dependências
```bash
curl -X DELETE http://localhost:8081/api/units/00000000-0000-0000-0000-000000000005/with-dependencies \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Scripts de Teste

### PowerShell
- `test_units_improved.ps1`: Testa endpoints melhorados
- `test_unit_can_delete.ps1`: Testa verificação de exclusão
- `test_units_api.ps1`: Testa todos os endpoints
- `bulk_create_units.ps1`: Cria múltiplas unidades para teste

### JSONs de Exemplo
Ver arquivo `JSONS_TESTE_UNIDADES.md` para exemplos completos de JSONs para teste.

## Melhorias Implementadas

1. **Filtros de Busca**: Listagem com filtros por nome, email, telefone e unidades raiz
2. **Atualização Melhorada**: Usa UnitCreateDTO para consistência
3. **Validação Aprimorada**: Verifica duplicatas de nome e email
4. **Verificação de Exclusão**: Endpoint para verificar dependências antes de excluir
5. **Exclusão em Cascata**: Remove dependências automaticamente antes de excluir
6. **Documentação Completa**: Swagger com exemplos e parâmetros
7. **Métodos de Repository**: Novos métodos para busca flexível

## Exclusão em Cascata

### O que é removido:
- **Folhas de Pagamento**: Todas as folhas vinculadas à unidade
- **Funcionários**: Todos os funcionários vinculados à unidade
- **Cargos**: Todos os cargos vinculados à unidade
- **Localizações**: Todas as localizações vinculadas à unidade
- **Subunidades**: São movidas para a unidade pai (não excluídas)

### ⚠️ Avisos Importantes:
- Esta operação é **irreversível**
- Todos os dados relacionados serão **permanentemente removidos**
- Use apenas quando tiver certeza de que deseja remover tudo
- Recomenda-se fazer backup antes de usar esta funcionalidade

## Notas Importantes

1. **Hierarquia**: Unidades podem ter hierarquia (parent-child)
2. **Filtros**: Busca parcial case-insensitive para nome e email
3. **Dependências**: Sempre verifique dependências antes de excluir
4. **Auditoria**: Todas as operações são auditadas com timestamps
5. **Validação**: Todos os dados são validados antes de persistir
6. **Consistência**: Criação e atualização usam o mesmo DTO 