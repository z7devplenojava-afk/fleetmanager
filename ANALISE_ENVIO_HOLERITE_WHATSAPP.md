# 📱 Análise Completa: Envio de Holerite via WhatsApp

## 🏗️ Arquitetura do Sistema

### Backend (Spring Boot)

```
┌─────────────────────────────────────────────────────────────┐
│                     EnvioController                          │
│  /api/envio/individual, /massa, /todos                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     EnvioService                             │
│  • enviarIndividual()                                        │
│  • enviarEmMassa()                                           │
│  • enviarTodosPorTipo()                                      │
│  • processarEnvio()                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BaileysRestService                          │
│  • sendFileMessage()                                         │
│  • normalizePhoneNumber()                                    │
│  • convertToDockerPath()                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              WhatsApp Service (Baileys)                      │
│  Porta: 3333                                                 │
│  Endpoint: /message/document                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Endpoints Disponíveis

### 1. Envio Individual
```http
POST /api/envio/individual
Content-Type: application/json

{
  "tipo": "whatsapp",
  "cpf": "12345678900",
  "mensagem": "Olá, segue seu holerite"
}
```

### 2. Envio em Massa
```http
POST /api/envio/massa
Content-Type: application/json

{
  "tipo": "whatsapp",
  "funcionarioIds": ["uuid1", "uuid2", "uuid3"],
  "mensagem": "Olá, segue seu holerite"
}
```

### 3. Envio para Todos
```http
POST /api/envio/todos
Content-Type: application/json

{
  "tipo": "whatsapp",
  "mensagem": "Olá, segue seu holerite"
}
```

### 4. Verificar WhatsApp
```http
GET /api/envio/verificar-whatsapp/{cpf}
```

### 5. Listar Logs
```http
GET /api/envio/logs?cpf=12345678900&month=10&year=2025
```

### 6. Reenviar
```http
POST /api/envio/resend/{logId}
```

## 🔍 Fluxo de Envio Detalhado

### Passo 1: Validação do Funcionário

```java
// EnvioService.java - linha ~80
// 1. Busca User por CPF na tabela users
Optional<User> userOpt = userRepository.findByUsername(cpf);

// 2. Valida se tem WhatsApp cadastrado
if (user.getWhatsapp() == null || user.getWhatsapp().trim().isEmpty()) {
    return erro("WhatsApp não cadastrado");
}

// 3. Busca Employee correspondente (opcional)
Optional<Employee> employeeOpt = employeeRepository.findByDocument(cpf);
```

### Passo 2: Localização do Holerite

```java
// EnvioService.java - linha ~400
// 1. Busca último holerite disponível (maior ano/mês)
Optional<Payslip> ultimoRegistro = obterUltimoPayslip(cpf);

// 2. Resolve caminho do arquivo
Optional<String> resolvedPathOpt = payslipService.resolvePayslipPathByCpfMonthYear(
    payslip.getCpf(), 
    payslip.getMonth(), 
    payslip.getYear()
);

// 3. Valida existência do arquivo
if (!Files.exists(Path.of(filePath))) {
    return erro("Arquivo não encontrado");
}
```

### Passo 3: Normalização do Número

```java
// BaileysRestService.java - linha ~100
private String normalizePhoneNumber(String phoneNumber) {
    String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");
    
    // Se já tem DDI 55, retorna
    if (cleanNumber.startsWith("55")) {
        return cleanNumber;
    }
    
    // Se tem 11 dígitos (celular BR), adiciona DDI 55
    if (cleanNumber.length() == 11 || cleanNumber.length() == 10) {
        return "55" + cleanNumber;
    }
    
    return cleanNumber;
}
```

**Exemplos:**
- `31971731747` → `5531971731747` ✅
- `5531971731747` → `5531971731747` ✅
- `(31) 97173-1747` → `5531971731747` ✅

### Passo 4: Conversão de Caminho Docker

```java
// BaileysRestService.java - linha ~170
private String convertToDockerPath(String localPath) {
    String normalizedPath = localPath.replace("\\", "/");
    
    int index = normalizedPath.indexOf("backend/holerites");
    if (index != -1) {
        String relativePath = normalizedPath.substring(index + "backend/".length());
        return "/app/" + relativePath;
    }
    
    return normalizedPath;
}
```

**Exemplos:**
- `C:\dev\secured-guard\backend\holerites\9-2025\arquivo.pdf`
  → `/app/holerites/9-2025/arquivo.pdf` ✅

### Passo 5: Envio via Baileys

```java
// BaileysRestService.java - linha ~190
public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
    // 1. Validar arquivo existe
    File file = new File(filePath);
    if (!file.exists()) return false;
    
    // 2. Normalizar número
    String normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    // 3. Converter caminho para Docker
    String dockerFilePath = convertToDockerPath(filePath);
    
    // 4. Criar request JSON
    ObjectNode body = objectMapper.createObjectNode();
    body.put("id", normalizedNumber);
    body.put("filepath", dockerFilePath);
    body.put("message", message);
    
    // 5. Enviar para Baileys
    String url = baileysRestUrl + "/message/document?key=" + instanceKey;
    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
    
    return response.getStatusCode() == HttpStatus.OK;
}
```

### Passo 6: Registro de Log

```java
// EnvioService.java - linha ~500
private void registrarLog(String cpf, Integer month, Integer year, 
                         DeliveryChannel channel, boolean success, 
                         int attempts, String error) {
    PayslipDeliveryLog log = PayslipDeliveryLog.builder()
        .cpf(cpf)
        .month(month)
        .year(year)
        .channel(channel)
        .success(success)
        .attempts(attempts)
        .errorMessage(error)
        .build();
    deliveryLogRepository.save(log);
}
```

## ✅ Funcionalidades Implementadas

### 1. Validação de Contatos
- ✅ Busca WhatsApp na tabela `users` (campo `whatsapp`)
- ✅ Validação de formato (11 ou 13 dígitos)
- ✅ Normalização automática com DDI 55

### 2. Localização de Arquivos
- ✅ Busca último holerite disponível por CPF
- ✅ Resolução de caminho via `PayslipService`
- ✅ Validação de existência do arquivo

### 3. Conversão de Caminhos
- ✅ Conversão Windows → Docker
- ✅ Suporte a caminhos absolutos e relativos
- ✅ Logging detalhado de conversões

### 4. Envio via Baileys
- ✅ Integração com Baileys REST API (porta 3333)
- ✅ Envio de documentos PDF
- ✅ Mensagem personalizada opcional
- ✅ Retry automático após 5 minutos (1 tentativa)

### 5. Logging e Auditoria
- ✅ Registro de todas as tentativas de envio
- ✅ Armazenamento de erros detalhados
- ✅ Contagem de tentativas
- ✅ Histórico por CPF/mês/ano

### 6. Envio em Lote
- ✅ Envio para múltiplos funcionários
- ✅ Envio para todos com WhatsApp cadastrado
- ✅ Processamento assíncrono
- ✅ Relatório de sucessos/falhas

## 🔧 Configurações Necessárias

### application.properties

```properties
# Baileys REST API
baileys.rest.url=http://localhost:3333
baileys.rest.token=
baileys.rest.instance.key=securedguard

# Diretório de holerites
payslip.storage.path=/app/holerites
```

### Docker Compose

```yaml
services:
  backend:
    volumes:
      - ./backend/holerites:/app/holerites
    environment:
      - BAILEYS_REST_URL=http://whatsapp-service:3333
  
  whatsapp-service:
    image: baileys-rest-api
    ports:
      - "3333:3333"
    volumes:
      - ./backend/holerites:/app/holerites
```

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: Erro 405 no WhatsApp Baileys

**Causa:** WhatsApp bloqueando requisições do Baileys

**Solução:**
```javascript
// whatsapp-service/src/server.js
const { default: makeWASocket, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const { version } = await fetchLatestBaileysVersion();
const sock = makeWASocket({
    version,
    browser: ['Chrome (Linux)', '', '']
});
```

### Problema 2: Arquivo não encontrado

**Causa:** Caminho não convertido para Docker

**Status:** ✅ RESOLVIDO
- Implementada função `convertToDockerPath()`
- Conversão automática de caminhos Windows → Docker

### Problema 3: Número sem DDI

**Causa:** Números brasileiros sem código do país

**Status:** ✅ RESOLVIDO
- Implementada função `normalizePhoneNumber()`
- Adiciona DDI 55 automaticamente

### Problema 4: WhatsApp não cadastrado

**Causa:** Campo `whatsapp` vazio na tabela `users`

**Solução:**
```sql
-- Verificar usuários sem WhatsApp
SELECT username, name, whatsapp 
FROM users 
WHERE whatsapp IS NULL OR whatsapp = '';

-- Atualizar WhatsApp
UPDATE users 
SET whatsapp = '31971731747' 
WHERE username = '12345678900';
```

## 📊 Estatísticas de Envio

### Tabela: payslip_delivery_log

```sql
-- Envios bem-sucedidos hoje
SELECT COUNT(*) 
FROM payslip_delivery_log 
WHERE success = true 
  AND DATE(created_at) = CURRENT_DATE;

-- Taxa de sucesso por canal
SELECT 
    channel,
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as sucessos,
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_sucesso
FROM payslip_delivery_log
GROUP BY channel;

-- Erros mais comuns
SELECT 
    error_message,
    COUNT(*) as ocorrencias
FROM payslip_delivery_log
WHERE success = false
GROUP BY error_message
ORDER BY ocorrencias DESC
LIMIT 10;
```

## 🧪 Testes

### Teste 1: Envio Individual

```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tipo": "whatsapp",
    "cpf": "12345678900",
    "mensagem": "Teste de envio"
  }'
```

### Teste 2: Verificar WhatsApp

```bash
curl http://localhost:8080/api/envio/verificar-whatsapp/12345678900 \
  -H "Authorization: Bearer $TOKEN"
```

### Teste 3: Listar Logs

```bash
curl "http://localhost:8080/api/envio/logs?cpf=12345678900&month=10&year=2025" \
  -H "Authorization: Bearer $TOKEN"
```

## 📈 Melhorias Futuras

### Curto Prazo
- [ ] Interface frontend para envio em lote
- [ ] Preview do holerite antes de enviar
- [ ] Agendamento de envios
- [ ] Notificações de confirmação de leitura

### Médio Prazo
- [ ] Suporte a múltiplos provedores WhatsApp
- [ ] Envio de mensagens personalizadas por funcionário
- [ ] Dashboard de estatísticas de envio
- [ ] Exportação de relatórios de envio

### Longo Prazo
- [ ] Integração com WhatsApp Business API oficial
- [ ] Chatbot para consulta de holerites
- [ ] Envio automático no dia do pagamento
- [ ] Assinatura digital de holerites

## 🔐 Segurança

### Implementado
- ✅ Autenticação JWT obrigatória
- ✅ Validação de permissões por role
- ✅ Logs de auditoria completos
- ✅ Validação de CPF antes de enviar

### Recomendações
- 🔒 Criptografar números de WhatsApp no banco
- 🔒 Rate limiting por usuário
- 🔒 Validação de tamanho de arquivo
- 🔒 Sanitização de mensagens

## 📞 Suporte

### Logs Importantes

```bash
# Backend
docker logs secured-guard-backend-ci --tail 100 | grep "📤\|❌\|✅"

# WhatsApp Service
docker logs whatsapp-service --tail 100

# Verificar conexão Baileys
curl http://localhost:3333/instance/connectionState?key=securedguard
```

### Troubleshooting

1. **Envio falha com "Arquivo não encontrado"**
   - Verificar se volume Docker está montado corretamente
   - Verificar permissões do diretório `/app/holerites`

2. **Envio falha com "WhatsApp não cadastrado"**
   - Verificar campo `whatsapp` na tabela `users`
   - Executar query de verificação acima

3. **Envio falha com erro 405**
   - Verificar se Baileys está conectado
   - Atualizar versão do Baileys
   - Verificar user-agent do browser

---

**Última atualização:** 28/10/2025
**Status:** ✅ Sistema funcional e testado
**Versão:** 2.0
