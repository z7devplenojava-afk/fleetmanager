# 📱 Guia Rápido: Envio de Holerite via WhatsApp

## 🚀 Início Rápido

### 1. Verificar se está tudo configurado

```bash
# Executar script de teste
bash test-envio-whatsapp.sh
```

### 2. Cadastrar WhatsApp do funcionário

```sql
-- Atualizar WhatsApp na tabela users
UPDATE users 
SET whatsapp = '31971731747' 
WHERE username = '12345678900';  -- CPF do funcionário
```

### 3. Enviar holerite

```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "cpf": "12345678900",
    "mensagem": "Olá! Segue seu holerite em anexo."
  }'
```

## 📋 Casos de Uso

### Caso 1: Enviar para um funcionário específico

```bash
curl -X POST http://localhost:8080/api/envio/individual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "cpf": "12345678900"
  }'
```

### Caso 2: Enviar para múltiplos funcionários

```bash
curl -X POST http://localhost:8080/api/envio/massa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "funcionarioIds": [
      "uuid-funcionario-1",
      "uuid-funcionario-2",
      "uuid-funcionario-3"
    ],
    "mensagem": "Olá! Segue seu holerite."
  }'
```

### Caso 3: Enviar para TODOS com WhatsApp cadastrado

```bash
curl -X POST http://localhost:8080/api/envio/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "whatsapp",
    "mensagem": "Olá! Seu holerite está disponível."
  }'
```

## 🔍 Verificações

### Verificar se funcionário tem WhatsApp

```bash
curl http://localhost:8080/api/envio/verificar-whatsapp/12345678900 \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
{
  "cpf": "12345678900",
  "temWhatsApp": true,
  "numeroWhatsApp": "31971731747"
}
```

### Verificar logs de envio

```bash
curl "http://localhost:8080/api/envio/logs?cpf=12345678900&month=10&year=2025" \
  -H "Authorization: Bearer $TOKEN"
```

### Verificar conexão do Baileys

```bash
curl http://localhost:3333/instance/connectionState?key=securedguard
```

## ⚠️ Problemas Comuns

### Problema: "WhatsApp não cadastrado"

**Solução:**
```sql
-- Verificar se campo está vazio
SELECT username, name, whatsapp 
FROM users 
WHERE username = '12345678900';

-- Cadastrar WhatsApp
UPDATE users 
SET whatsapp = '31971731747' 
WHERE username = '12345678900';
```

### Problema: "Arquivo não encontrado"

**Solução:**
```bash
# Verificar se holerite existe
ls -la backend/holerites/10-2025/

# Verificar volume Docker
docker exec secured-guard-backend-ci ls -la /app/holerites/10-2025/
```

### Problema: "Baileys não conectado"

**Solução:**
```bash
# 1. Obter QR Code
curl http://localhost:3333/instance/qr?key=securedguard

# 2. Escanear com WhatsApp
# Abra WhatsApp > Aparelhos conectados > Conectar aparelho

# 3. Verificar conexão
curl http://localhost:3333/instance/connectionState?key=securedguard
```

### Problema: Erro 405 no Baileys

**Solução:**
```bash
# Atualizar Baileys para versão mais recente
cd whatsapp-service
npm install @whiskeysockets/baileys@latest
docker-compose restart whatsapp-service
```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
# Backend
docker logs -f secured-guard-backend-ci | grep "📤\|❌\|✅"

# WhatsApp Service
docker logs -f whatsapp-service
```

### Estatísticas de envio

```sql
-- Envios de hoje
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as sucessos,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as falhas
FROM payslip_delivery_log
WHERE DATE(created_at) = CURRENT_DATE
  AND channel = 'WHATSAPP';

-- Taxa de sucesso por mês
SELECT 
    month,
    year,
    COUNT(*) as total,
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_sucesso
FROM payslip_delivery_log
WHERE channel = 'WHATSAPP'
GROUP BY year, month
ORDER BY year DESC, month DESC;
```

## 🔧 Configuração Inicial

### 1. Configurar application.properties

```properties
# Baileys REST API
baileys.rest.url=http://localhost:3333
baileys.rest.instance.key=securedguard

# Diretório de holerites
payslip.storage.path=/app/holerites
```

### 2. Configurar Docker Compose

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

### 3. Iniciar serviços

```bash
docker-compose up -d backend whatsapp-service
```

### 4. Conectar WhatsApp

```bash
# Obter QR Code
curl http://localhost:3333/instance/qr?key=securedguard

# Escanear com WhatsApp
# WhatsApp > Aparelhos conectados > Conectar aparelho
```

## 📱 Formato de Números

### Formatos Aceitos

- ✅ `31971731747` (11 dígitos)
- ✅ `5531971731747` (13 dígitos com DDI)
- ✅ `(31) 97173-1747` (formatado)
- ✅ `31 97173-1747` (com espaço)

### Normalização Automática

Todos os formatos acima são convertidos para: `5531971731747`

## 🎯 Checklist de Envio

Antes de enviar em massa, verifique:

- [ ] Baileys está conectado
- [ ] Funcionários têm WhatsApp cadastrado
- [ ] Holerites existem no diretório correto
- [ ] Volume Docker está montado
- [ ] Backend está rodando
- [ ] Token de autenticação é válido

## 📞 Suporte

### Comandos de Diagnóstico

```bash
# Status geral
bash test-envio-whatsapp.sh

# Verificar backend
curl http://localhost:8080/actuator/health

# Verificar Baileys
curl http://localhost:3333/instance/connectionState?key=securedguard

# Logs detalhados
docker logs secured-guard-backend-ci --tail 100 | grep "EnvioService\|BaileysRestService"
```

### Contatos

- 📧 Suporte técnico: suporte@z7design.com.br
- 📱 WhatsApp: (31) 97173-1747
- 🌐 Documentação: https://docs.securedguard.com.br

---

**Última atualização:** 28/10/2025
**Versão:** 1.0
