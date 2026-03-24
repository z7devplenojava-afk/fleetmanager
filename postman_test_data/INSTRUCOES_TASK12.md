# Instruções para Testar Task 12 - Busca de Números de Fatura e Medição

## Objetivo
Testar se os campos "Número da Fatura" e "Número da Medição" no modal de contas a receber estão buscando e exibindo registros do banco de dados.

## Pré-requisitos
1. Backend rodando na porta 8081
2. Banco de dados PostgreSQL configurado
3. Postman instalado

## Passos para Teste

### 1. Preparar Dados de Teste

#### 1.1 Fazer Login
- **Método:** POST
- **URL:** `http://localhost:8081/api/auth/login`
- **Body:** Usar `01_Login.json`
- **Salvar:** O token retornado para usar nos próximos requests

#### 1.2 Criar Clientes
- **Método:** POST
- **URL:** `http://localhost:8081/api/clients`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **Body:** Usar `02_Cliente_EmpresaABC.json` e `03_Cliente_TechSolutions.json`
- **Salvar:** Os IDs dos clientes retornados

#### 1.3 Criar Contas a Receber
- **Método:** POST
- **URL:** `http://localhost:8081/api/accounts-receivable`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **Body:** Usar os arquivos `04_ContaReceber_FAT001.json` até `08_ContaReceber_FAT005.json`
- **Importante:** Substituir `SUBSTITUIR_PELO_ID_DO_CLIENTE_1` e `SUBSTITUIR_PELO_ID_DO_CLIENTE_2` pelos IDs reais dos clientes

### 2. Testar Endpoints de Busca

#### 2.1 Buscar Números de Fatura
- **Método:** GET
- **URL:** `http://localhost:8081/api/accounts-receivable/search/invoice-number?term=FAT`
- **Headers:** `Authorization: Bearer {token}`
- **Resultado Esperado:** Deve retornar uma lista com os números de fatura que contenham "FAT"

#### 2.2 Buscar Números de Fatura (outro termo)
- **Método:** GET
- **URL:** `http://localhost:8081/api/accounts-receivable/search/invoice-number?term=2024`
- **Headers:** `Authorization: Bearer {token}`
- **Resultado Esperado:** Deve retornar uma lista com os números de fatura que contenham "2024"

#### 2.3 Buscar Números de Medição
- **Método:** GET
- **URL:** `http://localhost:8081/api/accounts-receivable/search/measurement-number?term=MED`
- **Headers:** `Authorization: Bearer {token}`
- **Resultado Esperado:** Deve retornar uma lista com os números de medição que contenham "MED"

#### 2.4 Buscar Números de Medição (outro termo)
- **Método:** GET
- **URL:** `http://localhost:8081/api/accounts-receivable/search/measurement-number?term=001`
- **Headers:** `Authorization: Bearer {token}`
- **Resultado Esperado:** Deve retornar uma lista com os números de medição que contenham "001"

### 3. Testar no Frontend

#### 3.1 Acessar o Modal
1. Abrir o sistema no navegador
2. Fazer login
3. Ir para o módulo Financeiro > Contas a Receber
4. Clicar em "Nova Conta" para abrir o modal

#### 3.2 Testar Campo Número da Fatura
1. Clicar no campo "Número da Fatura"
2. Digitar "FAT" - deve aparecer sugestões
3. Digitar "2024" - deve aparecer sugestões
4. Verificar se as sugestões correspondem aos dados do banco

#### 3.3 Testar Campo Número da Medição
1. Clicar no campo "Número da Medição"
2. Digitar "MED" - deve aparecer sugestões
3. Digitar "001" - deve aparecer sugestões
4. Verificar se as sugestões correspondem aos dados do banco

## Resultados Esperados

### Endpoints de Busca
- Deve retornar status 200
- Deve retornar array de strings com os números encontrados
- Deve limitar a 10 resultados
- Deve fazer busca case-insensitive

### Frontend
- Deve exibir sugestões quando digitar no campo
- Deve filtrar sugestões conforme digita
- Deve permitir selecionar sugestão
- Deve funcionar para ambos os campos (fatura e medição)

## Troubleshooting

### Erro 403 Forbidden
- Verificar se o token de autenticação está correto
- Verificar se o usuário tem permissões financeiras

### Erro 500 Internal Server Error
- Verificar se o backend está rodando
- Verificar logs do backend para erros

### Nenhuma sugestão aparece
- Verificar se os dados foram inseridos corretamente
- Verificar se o termo de busca tem pelo menos 2 caracteres
- Verificar logs do frontend para erros de API

### Sugestões incorretas
- Verificar se os dados no banco estão corretos
- Verificar se a busca está funcionando nos endpoints
- Verificar se o frontend está chamando os endpoints corretos

## Arquivos de Teste Incluídos

1. `01_Login.json` - Dados de login
2. `02_Cliente_EmpresaABC.json` - Primeiro cliente
3. `03_Cliente_TechSolutions.json` - Segundo cliente
4. `04_ContaReceber_FAT001.json` - Primeira conta a receber
5. `05_ContaReceber_FAT002.json` - Segunda conta a receber
6. `06_ContaReceber_FAT003.json` - Terceira conta a receber
7. `07_ContaReceber_FAT004.json` - Quarta conta a receber
8. `08_ContaReceber_FAT005.json` - Quinta conta a receber
9. `Task12_ContasAReceber_TestData.json` - Coleção completa do Postman
