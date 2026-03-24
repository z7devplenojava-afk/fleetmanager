# 📱 Status do Baileys WhatsApp Service

**Data:** 28/10/2025 23:21  
**Status:** ❌ DESCONECTADO (Erro 405)

## 🔍 Diagnóstico

### Container Status
```
✅ Container: whatsapp-service
✅ Status: Up (rodando)
✅ Porta: 3333 (acessível)
❌ Conexão WhatsApp: CLOSED
```

### Erro Identificado

```
Error: Connection Failure
Status Code: 405 (Method Not Allowed)
Reason: '405'
Location: 'odn'
```

### Logs do Container

```
Connection update: {"connection":"close","qr":null,"error":"Connection Failure"}
Connection closed. Status: 405 Reconnect? true
Error details: Error: Connection Failure
  data: { reason: '405', location: 'odn' }
```

## 🚨 Problema

O WhatsApp está **bloqueando ativamente** conexões do Baileys com erro 405. Este é um problema conhecido que afeta:

- Baileys (biblioteca não oficial)
- Conexões de data centers conhecidos
- IPs/redes marcadas como suspeitas

## 🔧 Soluções Disponíveis

### Solução 1: Evolution API (Recomendado)

A Evolution API é uma camada sobre o Baileys com melhor gerenciamento de conexões.

**Status:** Já configurado no projeto em `evolution-api/`

**Vantagens:**
- ✅ Melhor tratamento de erros 405
- ✅ Reconexão automática inteligente
- ✅ Interface web para gerenciamento
- ✅ Suporte a múltiplas instâncias
- ✅ Webhooks para eventos

**Como usar:**
```bash
# Iniciar Evolution API
docker-compose up -d evolution-api

# Acessar interface
http://localhost:8080

# Conectar instância
POST http://localhost:8080/instance/connect/securedguard
```

### Solução 2: WhatsApp Business API (Meta Cloud)

API oficial do WhatsApp para empresas.

**Vantagens:**
- ✅ Oficial e estável
- ✅ Sem bloqueios
- ✅ Suporte empresarial
- ✅ Webhooks nativos

**Desvantagens:**
- ❌ Requer aprovação do Meta
- ❌ Custo por mensagem
- ❌ Processo de setup mais complexo

**Documentação:** Ver `GUIA_META_WHATSAPP_CLOUD_API.md`

### Solução 3: Proxy/VPN

Usar proxy ou VPN para mascarar origem da conexão.

**Configuração:**
```yaml
# docker-compose.yml
whatsapp-service:
  environment:
    HTTP_PROXY: http://seu-proxy:8080
    HTTPS_PROXY: http://seu-proxy:8080
```

**Desvantagens:**
- ⚠️ Pode não resolver completamente
- ⚠️ Adiciona latência
- ⚠️ Requer proxy confiável

### Solução 4: Atualizar Baileys e User-Agent

Tentar versão mais recente do Baileys com user-agent atualizado.

**Status:** ✅ JÁ IMPLEMENTADO

```javascript
// whatsapp-service/src/server.js
const version = [2, 3000, 1017155907]; // Versão estável
browser: ['Chrome (Windows)', 'Chrome', '120.0.0.0']
```

**Resultado:** Ainda recebe erro 405

## 📊 Comparação de Soluções

| Solução | Custo | Complexidade | Estabilidade | Recomendação |
|---------|-------|--------------|--------------|--------------|
| Evolution API | Grátis | Baixa | Alta | ⭐⭐⭐⭐⭐ |
| Meta Cloud API | Pago | Média | Muito Alta | ⭐⭐⭐⭐ |
| Proxy/VPN | Variável | Média | Média | ⭐⭐⭐ |
| Baileys Direto | Grátis | Baixa | Baixa | ⭐⭐ |

## 🎯 Recomendação Imediata

### Usar Evolution API

1. **Iniciar Evolution API:**
```bash
cd evolution-api
docker-compose up -d
```

2. **Configurar instância:**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "securedguard",
    "token": "seu-token-seguro",
    "qrcode": true
  }'
```

3. **Obter QR Code:**
```bash
curl http://localhost:8080/instance/qrcode/securedguard
```

4. **Atualizar backend:**
```properties
# application.properties
baileys.rest.url=http://localhost:8080
baileys.rest.instance.key=securedguard
```

## 🔄 Alternativa: Continuar com Baileys

Se quiser continuar tentando com Baileys direto:

### Opção A: Aguardar e Tentar Novamente

O erro 405 pode ser temporário. Aguardar algumas horas/dias e tentar novamente.

### Opção B: Usar Rede Diferente

Tentar conectar de uma rede diferente (casa, 4G, etc).

```bash
# Parar serviço
docker-compose stop whatsapp-service

# Limpar sessão
docker exec whatsapp-service rm -rf /app/sessions/securedguard

# Reiniciar
docker-compose up -d whatsapp-service

# Verificar logs
docker logs -f whatsapp-service
```

### Opção C: Usar Número Diferente

Tentar com outro número de WhatsApp que não tenha sido bloqueado.

## 📝 Logs Úteis

### Ver logs em tempo real
```bash
docker logs -f whatsapp-service
```

### Verificar status
```bash
curl http://localhost:3333/instance/connectionState?key=securedguard
```

### Tentar obter QR Code
```bash
curl http://localhost:3333/instance/qr?key=securedguard
```

### Reiniciar serviço
```bash
docker-compose restart whatsapp-service
```

### Limpar sessão e reiniciar
```bash
docker-compose down whatsapp-service
docker volume rm secured-guard_whatsapp_sessions
docker-compose up -d whatsapp-service
```

## 🆘 Troubleshooting

### Erro: "QR not available"

**Causa:** Baileys não conseguiu gerar QR Code devido ao erro 405

**Solução:** Usar Evolution API ou aguardar

### Erro: "Client not ready"

**Causa:** WhatsApp não está conectado

**Solução:** Verificar logs e status da conexão

### Erro: "Connection Failure"

**Causa:** WhatsApp bloqueando conexão (405)

**Solução:** Usar Evolution API ou Meta Cloud API

## 📞 Suporte

### Documentos Relacionados

- `ANALISE_ENVIO_HOLERITE_WHATSAPP.md` - Análise completa do sistema
- `GUIA_RAPIDO_ENVIO_WHATSAPP.md` - Guia de uso
- `GUIA_META_WHATSAPP_CLOUD_API.md` - Migração para Meta Cloud
- `SOLUCOES_EVOLUTION_API.md` - Configuração Evolution API

### Comandos Rápidos

```bash
# Status geral
docker ps | grep whatsapp

# Logs
docker logs whatsapp-service --tail 50

# Reiniciar
docker-compose restart whatsapp-service

# Parar
docker-compose stop whatsapp-service

# Remover e recriar
docker-compose down whatsapp-service
docker-compose up -d whatsapp-service
```

## 🎯 Próximos Passos

1. ✅ Baileys está rodando (mas desconectado)
2. ⏳ Decidir qual solução usar:
   - **Recomendado:** Evolution API
   - **Alternativa:** Meta Cloud API
   - **Temporário:** Aguardar e tentar Baileys novamente
3. ⏳ Implementar solução escolhida
4. ⏳ Testar envio de holerites

---

**Última atualização:** 28/10/2025 23:21  
**Status:** Container rodando, WhatsApp desconectado (erro 405)  
**Ação requerida:** Migrar para Evolution API ou Meta Cloud API
