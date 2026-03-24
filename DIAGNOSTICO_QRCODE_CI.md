# 🔍 Diagnóstico: QR Code não está sendo gerado no CI

## 📋 Resumo do Problema

O QR Code do WhatsApp não está sendo gerado no ambiente CI após 10 tentativas. Os logs mostram:
```
⏳ QR Code ainda não disponível na tentativa 7/10
❌ QR Code não foi gerado pelo Baileys REST após 10 tentativas
```

## 🔎 Análise Técnica

### 1. Fluxo de Geração do QR Code

**Serviço WhatsApp (Baileys REST):**
- O serviço tenta conectar automaticamente ao iniciar (`connectToWhatsApp()` na linha 122)
- O QR Code só é gerado quando:
  - **Não existe sessão salva** (primeira conexão)
  - **O WhatsApp emite evento `qr`** no `connection.update`
- Se existe uma sessão salva, o Baileys tenta usar essa sessão
- Se a sessão está inválida/expirada, o serviço não gera novo QR Code automaticamente

**Código relevante (`whatsapp-service/src/server.js`):**
```javascript
// Linha 63-72: Evento que captura o QR Code
sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update;
  
  if (qr) {
    qrString = qr;  // QR Code só é definido aqui
    ready = false;
  }
  
  if (connection === 'close') {
    qrString = null;  // QR Code é limpo quando desconecta
    // Reconecta após 5 segundos
  }
});

// Linha 142-159: Endpoint que retorna o QR Code
app.get('/instance/qr', async (req, res) => {
  if (!qrString) return res.status(404).json({ message: 'QR not available' });
  // ... retorna QR Code
});

// Linha 132-134: Endpoint de inicialização (não força nova conexão)
app.get('/instance/init', (req, res) => {
  res.json({ key: INSTANCE_KEY, status: 'initialized' });
});
```

### 2. Problema Identificado

**Cenário no CI:**
1. O serviço WhatsApp inicia automaticamente
2. Se existe sessão anterior (salva em `whatsapp_sessions_ci` volume), o Baileys tenta usar
3. Se a sessão está **inválida/expirada**:
   - A conexão falha (`connection === 'close'`)
   - O `qrString` é limpo (`qrString = null`)
   - O serviço tenta reconectar após 5 segundos
   - **MAS**: Se não há evento `qr` no update, o QR Code nunca é gerado
4. O backend chama `/instance/init`, mas esse endpoint **não faz nada** (apenas retorna OK)
5. O backend tenta obter QR Code em `/instance/qr`, mas recebe 404 porque `qrString` é `null`

### 3. Estado Atual da Instância

Com base nos logs, a instância está:
- ✅ **Inicializada** (serviço está rodando)
- ✅ **Acessível** (health check OK)
- ❌ **Sem QR Code disponível** (sessão provavelmente inválida/expirada)
- ❓ **Estado da conexão**: Provavelmente `closed` ou `connecting`

## 🔧 Soluções Propostas

### **Solução 1: Forçar Logout antes de Inicializar (RECOMENDADA)**

Modificar o `BaileysRestService.initializeInstance()` para:
1. Fazer logout primeiro (deletar sessão)
2. Aguardar alguns segundos
3. Inicializar novamente

**Vantagens:**
- Garante que uma nova sessão será criada
- Força geração de novo QR Code
- Já existe método `resetInstance()` que faz logout

**Implementação:**
```java
public boolean initializeInstance() {
    try {
        // Sempre resetar antes de inicializar para garantir novo QR Code
        logger.info("🔄 Resetando instância antes de inicializar...");
        resetInstance();
        
        // Aguardar para garantir que sessão foi limpa
        Thread.sleep(2000);
        
        // Continuar com inicialização normal...
    }
}
```

### **Solução 2: Melhorar Endpoint `/instance/init` no Servidor**

Modificar o endpoint `/instance/init` para forçar nova conexão:
- Deletar sessão existente
- Chamar `connectToWhatsApp()` novamente
- Aguardar geração do QR Code

**Desvantagem:**
- Requer modificação no serviço WhatsApp (Node.js)
- Mais complexo de implementar

### **Solução 3: Verificar Estado da Conexão antes de Solicitar QR Code**

Modificar o `WhatsAppController.createConnection()` para:
1. Verificar estado da conexão primeiro
2. Se estado é `closed`, fazer logout antes
3. Aguardar mais tempo para QR Code ser gerado

## 📊 Verificações Necessárias

### 1. Verificar Estado da Conexão no CI

Verificar o endpoint `/instance/connectionState?key=securedguard_ci`:
- Se retorna `"state": "open"` → Já está conectado (não precisa de QR Code)
- Se retorna `"state": "closed"` → Precisa fazer logout e reinicializar

### 2. Verificar Logs do Serviço WhatsApp

Verificar logs do container `secured-guard-whatsapp-ci`:
```bash
docker logs secured-guard-whatsapp-ci --tail 100
```

Procurar por:
- `Connection update:` - Estado da conexão
- `QR code updated` - Se QR Code foi gerado
- `Connection closed` - Se conexão falhou
- `Failed to connect` - Erros de conexão

### 3. Verificar Sessão Salva

Verificar se existe sessão salva no volume:
```bash
docker exec secured-guard-whatsapp-ci ls -la /app/sessions/securedguard_ci/
```

Se existirem arquivos, a sessão pode estar inválida.

## 🚀 Implementação Realizada

**Solução 1 foi implementada** (13/01/2026):

### 1. **Modificado `BaileysRestService.initializeInstance()`:**
- ✅ **Sempre fazer logout antes de inicializar** (mesmo se conexão estiver aberta)
- ✅ Isso garante que uma nova sessão será criada
- ✅ O QR Code será gerado na próxima tentativa de conexão
- ✅ Aumentado tempo de espera após logout de 2s para 3s

### 2. **Modificado `WhatsAppController.createConnection()`:**
- ✅ Aumentado tempo de espera após inicialização de 3s para 5s
- ✅ Isso dá mais tempo para o servidor processar logout + reconexão + QR Code

### 3. **Melhorias nos Logs:**
- ✅ Logs mais informativos sobre o processo de reset
- ✅ Mensagem informando para aguardar geração do QR Code

## 📝 Status da Implementação

1. ✅ **Diagnóstico completo** (este documento)
2. ✅ **Implementação concluída** (modificar `initializeInstance()` e `createConnection()`)
3. ⏳ **Aguardar deploy no CI para testar**
4. ⏳ **Verificar logs** após deploy
5. ⏳ **Validar solução** se funcionar

## 🔍 Próximos Passos

1. **Fazer commit e push das mudanças**
2. **Aguardar deploy automático no CI**
3. **Testar geração de QR Code no CI**
4. **Verificar logs do serviço WhatsApp**:
   ```bash
   docker logs secured-guard-whatsapp-ci --tail 100 -f
   ```
5. **Se ainda não funcionar, verificar se sessão está sendo deletada corretamente**

## 🔗 Referências

- **Código do serviço WhatsApp:** `whatsapp-service/src/server.js`
- **Código do BaileysRestService:** `backend/src/main/java/com/z7design/secured_guard/service/BaileysRestService.java`
- **Docker Compose CI:** `docker-compose.ci.yml`
- **Configuração CI:** `backend/src/main/resources/application-ci.properties`
