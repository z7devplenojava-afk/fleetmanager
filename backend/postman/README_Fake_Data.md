# Dados Fake para Teste da API de Unidades

## 📋 Descrição

Este diretório contém dados fake para facilitar o teste da API de Unidades do sistema SecuredGuard via Postman ou scripts.

## 📁 Arquivos Disponíveis

### 1. `units_fake_data.json`
Arquivo JSON com dados fake organizados por categorias:
- **units**: 10 unidades principais de diferentes regiões
- **subunits**: 3 subunidades (requerem parentId)
- **clientUnits**: 3 unidades associadas a clientes
- **quickTest**: Dados para testes rápidos

### 2. `bulk_create_units.ps1`
Script PowerShell para cadastrar múltiplas unidades automaticamente.

## 🚀 Como Usar

### Opção 1: Postman

1. **Importe a coleção** `Units_API.postman_collection.json`
2. **Configure o ambiente** `Units_API.postman_environment.json`
3. **Copie os dados** do arquivo `units_fake_data.json`
4. **Cole no body** da requisição "Criar Unidade"

### Opção 2: Script PowerShell

```powershell
# Execute o script de cadastro em lote
.\bulk_create_units.ps1
```

## 📊 Dados Disponíveis

### Unidades Principais (10 unidades)

| Nome | Região | Telefone | Email |
|------|--------|----------|-------|
| Unidade BH Shopping | Centro | (31) 99999-8888 | bhshopping@securedguard.com |
| Unidade Centro | Centro | (31) 88888-7777 | centro@securedguard.com |
| Unidade Savassi | Savassi | (31) 77777-6666 | savassi@securedguard.com |
| Unidade Pampulha | Pampulha | (31) 66666-5555 | pampulha@securedguard.com |
| Unidade Barreiro | Barreiro | (31) 55555-4444 | barreiro@securedguard.com |
| Unidade Venda Nova | Venda Nova | (31) 44444-3333 | vendanova@securedguard.com |
| Unidade Contagem | Contagem | (31) 33333-2222 | contagem@securedguard.com |
| Unidade Betim | Betim | (31) 22222-1111 | betim@securedguard.com |
| Unidade Ribeirão das Neves | Ribeirão das Neves | (31) 11111-0000 | ribeirao@securedguard.com |
| Unidade Santa Luzia | Santa Luzia | (31) 00000-9999 | santaluzia@securedguard.com |

### Subunidades (3 unidades)

| Nome | Descrição | Telefone | Email |
|------|-----------|----------|-------|
| Subunidade BH Shopping - Setor A | Subunidade do setor A | (31) 99999-7777 | bhshopping.setora@securedguard.com |
| Subunidade BH Shopping - Setor B | Subunidade do setor B | (31) 99999-6666 | bhshopping.setorb@securedguard.com |
| Subunidade Centro - Comercial | Subunidade comercial | (31) 88888-6666 | centro.comercial@securedguard.com |

### Unidades de Cliente (3 unidades)

| Nome | Cliente | Telefone | Email |
|------|---------|----------|-------|
| Unidade Cliente ABC Ltda | Cliente ID: 1 | (31) 88888-9999 | cliente.abc@securedguard.com |
| Unidade Cliente XYZ S.A. | Cliente ID: 2 | (31) 77777-8888 | cliente.xyz@securedguard.com |
| Unidade Cliente DEF Comércio | Cliente ID: 3 | (31) 66666-7777 | cliente.def@securedguard.com |

## 🧪 Testes Rápidos

### Teste Simples
```json
{
  "name": "Unidade Teste Simples",
  "address": "Rua Teste, 123 - Belo Horizonte, MG"
}
```

### Teste Completo
```json
{
  "name": "Unidade Teste Completa",
  "description": "Unidade para testes completos da API",
  "address": "Av. Teste, 456 - Belo Horizonte, MG",
  "phone": "(31) 99999-0000",
  "email": "teste@securedguard.com",
  "parentId": null,
  "clientId": null
}
```

### Teste de Atualização
```json
{
  "name": "Unidade Teste Atualizada",
  "description": "Unidade atualizada via teste da API",
  "address": "Av. Teste Atualizada, 789 - Belo Horizonte, MG",
  "phone": "(31) 88888-0000",
  "email": "teste.updated@securedguard.com",
  "parentId": null,
  "clientId": null
}
```

## 📝 Exemplos de Uso no Postman

### 1. Criar Unidade Básica
```json
{
  "name": "Unidade BH Shopping",
  "description": "Unidade operacional no BH Shopping - Centro de Belo Horizonte",
  "address": "Av. Cristiano Machado, 4000 - Belo Horizonte, MG",
  "phone": "(31) 99999-8888",
  "email": "bhshopping@securedguard.com",
  "parentId": null,
  "clientId": null
}
```

### 2. Criar Subunidade
```json
{
  "name": "Subunidade BH Shopping - Setor A",
  "description": "Subunidade do setor A do BH Shopping",
  "address": "Av. Cristiano Machado, 4000 - Setor A - Belo Horizonte, MG",
  "phone": "(31) 99999-7777",
  "email": "bhshopping.setora@securedguard.com",
  "parentId": "{{parentUnitId}}",
  "clientId": null
}
```

### 3. Criar Unidade com Cliente
```json
{
  "name": "Unidade Cliente ABC Ltda",
  "description": "Unidade dedicada ao cliente ABC Ltda",
  "address": "Rua do Cliente ABC, 123 - Belo Horizonte, MG",
  "phone": "(31) 88888-9999",
  "email": "cliente.abc@securedguard.com",
  "parentId": null,
  "clientId": 1
}
```

## 🔧 Variáveis do Postman

Configure estas variáveis no ambiente do Postman:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `baseUrl` | http://localhost:8081 | URL do backend |
| `token` | [seu_token] | Token JWT de autenticação |
| `unitId` | [id_da_unidade] | ID de uma unidade específica |
| `parentUnitId` | [id_da_unidade_pai] | ID da unidade pai para subunidades |

## ⚠️ Observações

1. **Token de Autenticação**: Sempre configure o token antes de usar
2. **IDs de Cliente**: Use IDs válidos de clientes existentes
3. **ParentId**: Use IDs válidos de unidades existentes para subunidades
4. **Emails Únicos**: Cada email deve ser único no sistema
5. **Nomes Únicos**: Cada nome deve ser único no sistema

## 🎯 Fluxo de Teste Recomendado

1. **Login** → Obter token
2. **Criar Unidade Principal** → Usar dados de `units`
3. **Criar Subunidade** → Usar dados de `subunits` com parentId
4. **Criar Unidade com Cliente** → Usar dados de `clientUnits`
5. **Listar Unidades** → Verificar se foram criadas
6. **Atualizar Unidade** → Usar dados de `quickTest.update`
7. **Excluir Unidade** → Limpar dados de teste

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o backend está rodando
2. Confirme se o token está válido
3. Verifique se os dados estão no formato correto
4. Consulte os logs do backend para detalhes 