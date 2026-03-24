# 📚 API Documentation - EnvioHolerites

## 🌐 Base URL
```
http://localhost:8080/api
```

## 🔐 Autenticação
Todas as requisições devem incluir o token JWT no header:
```
Authorization: Bearer <token>
```

---

## 👥 Funcionários

### Listar Funcionários
```http
GET /funcionarios
```

**Query Parameters:**
- `page` (int): Número da página (padrão: 0)
- `size` (int): Tamanho da página (padrão: 20)
- `search` (string): Termo de busca
- `sort` (string): Campo para ordenação
- `direction` (string): Direção da ordenação (asc/desc)

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "nome": "João Silva",
      "cpf": "12345678901",
      "email": "joao@exemplo.com",
      "telefone": "5511999999999",
      "possuiWhatsapp": true,
      "createdAt": "2024-01-15T10:30:00",
      "updatedAt": "2024-01-15T10:30:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

### Criar Funcionário
```http
POST /funcionarios
```

**Request Body:**
```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@exemplo.com",
  "telefone": "5511999999999",
  "possuiWhatsapp": true
}
```

**Response:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@exemplo.com",
  "telefone": "5511999999999",
  "possuiWhatsapp": true,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

### Buscar Funcionário por ID
```http
GET /funcionarios/{id}
```

**Response:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@exemplo.com",
  "telefone": "5511999999999",
  "possuiWhatsapp": true,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

### Atualizar Funcionário
```http
PUT /funcionarios/{id}
```

**Request Body:**
```json
{
  "nome": "João Silva Atualizado",
  "cpf": "12345678901",
  "email": "joao.novo@exemplo.com",
  "telefone": "5511999999999",
  "possuiWhatsapp": true
}
```

### Deletar Funcionário
```http
DELETE /funcionarios/{id}
```

---

## 📤 Envio de Holerites

### Envio Individual
```http
POST /envio/individual
```

**Request Body:**
```json
{
  "funcionarioId": 1,
  "tipo": "email",
  "assunto": "Holerite - Janeiro 2024",
  "mensagem": "Segue em anexo seu holerite do mês de janeiro."
}
```

**Response:**
```json
{
  "success": true,
  "totalEnviados": 1,
  "totalFalhas": 0,
  "detalhes": [
    {
      "funcionarioId": 1,
      "funcionarioNome": "João Silva",
      "status": "SUCCESS",
      "mensagem": "Holerite enviado com sucesso"
    }
  ]
}
```

### Envio em Massa
```http
POST /envio/massa
```

**Request Body:**
```json
{
  "funcionarioIds": [1, 2, 3],
  "tipo": "whatsapp",
  "mensagem": "Seu holerite foi enviado. Verifique seu WhatsApp."
}
```

### Envio para Todos
```http
POST /envio/todos
```

**Request Body:**
```json
{
  "tipo": "email",
  "assunto": "Holerite - Janeiro 2024",
  "mensagem": "Segue em anexo seu holerite do mês de janeiro."
}
```

### Verificar Status WhatsApp
```http
POST /envio/verificar-whatsapp
```

**Request Body:**
```json
{
  "provider": "wppconnect"
}
```

**Response:**
```json
{
  "connected": true,
  "provider": "wppconnect",
  "status": "CONNECTED",
  "message": "WhatsApp conectado com sucesso"
}
```

---

## 📊 Métricas e Relatórios

### Dashboard de Métricas
```http
GET /metrics/dashboard
```

**Response:**
```json
{
  "totalFuncionarios": 150,
  "totalEnvios": 1250,
  "enviosEmail": 800,
  "enviosWhatsapp": 450,
  "enviosSucesso": 1200,
  "enviosFalha": 50,
  "taxaSucesso": 96.0,
  "mediaTempoEnvio": 2.5,
  "crescimentoMes": 15.5
}
```

### Relatório de Envios
```http
GET /reports/envios
```

**Query Parameters:**
- `dataInicio` (string): Data inicial (YYYY-MM-DD)
- `dataFim` (string): Data final (YYYY-MM-DD)
- `tipo` (string): Tipo de envio (email/whatsapp)
- `status` (string): Status do envio (sucesso/falha)
- `formato` (string): Formato do relatório (pdf/excel/csv)

---

## 🔍 Auditoria

### Logs de Auditoria
```http
GET /audit/logs
```

**Query Parameters:**
- `usuario` (string): Nome do usuário
- `acao` (string): Tipo de ação
- `dataInicio` (string): Data inicial
- `dataFim` (string): Data final
- `page` (int): Número da página
- `size` (int): Tamanho da página

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "userId": "user123",
      "username": "admin",
      "action": "CREATE_FUNCIONARIO",
      "resourceType": "FUNCIONARIO",
      "resourceId": "1",
      "details": "Criação de funcionário João Silva",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "status": "SUCCESS",
      "createdAt": "2024-01-15T10:30:00",
      "createdBy": "admin"
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

---

## ⚠️ Códigos de Erro

### 400 - Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Token inválido ou expirado"
}
```

### 403 - Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Acesso negado"
}
```

### 404 - Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Recurso não encontrado"
}
```

### 429 - Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Limite de requisições excedido",
  "retryAfter": 60
}
```

### 500 - Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Erro interno do servidor"
}
```

---

## 🔧 Configurações

### Rate Limiting
- **Geral**: 100 requisições por minuto
- **Operações Sensíveis**: 10 requisições por minuto
- **Login**: 5 tentativas por 15 minutos

### Validações
- **CPF**: Formato válido brasileiro
- **Email**: Formato válido
- **Telefone**: Formato brasileiro (+55)
- **Nome**: Mínimo 2 caracteres

### Paginação
- **Padrão**: 20 itens por página
- **Máximo**: 100 itens por página

---

## 📝 Exemplos de Uso

### cURL - Criar Funcionário
```bash
curl -X POST http://localhost:8080/api/funcionarios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpf": "12345678901",
    "email": "joao@exemplo.com",
    "telefone": "5511999999999",
    "possuiWhatsapp": true
  }'
```

### cURL - Enviar Holerite
```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "funcionarioId": 1,
    "tipo": "email",
    "assunto": "Holerite - Janeiro 2024",
    "mensagem": "Segue em anexo seu holerite."
  }'
```

### JavaScript - Listar Funcionários
```javascript
const response = await fetch('http://localhost:8080/api/funcionarios', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();
console.log(data);
```

---

## 🚀 Próximas Versões

### v2.0 (Planejado)
- [ ] WebSocket para notificações em tempo real
- [ ] Upload de arquivos de holerite
- [ ] Templates de mensagem personalizáveis
- [ ] Integração com sistemas externos
- [ ] API GraphQL

### v1.1 (Em Desenvolvimento)
- [ ] Filtros avançados
- [ ] Exportação de relatórios
- [ ] Cache Redis
- [ ] Métricas em tempo real 