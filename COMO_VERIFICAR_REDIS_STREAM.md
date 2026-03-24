# Como Verificar e Limpar o Redis Stream

## Problema Identificado

Os logs mostram que há mensagens antigas no `stream:jobs` do Redis que referenciam jobs que não existem mais no banco de dados. Isso causa o erro:
```
RuntimeException: Job não encontrado: [job-id]
```

## Solução

Foram criados dois novos endpoints para gerenciar o stream:

### 1. Verificar Informações do Stream

**Endpoint:** `GET /api/v1/document-processing/stream-info`

**Descrição:** Retorna informações sobre os streams do Redis, incluindo:
- Tamanho do `stream:jobs`
- Tamanho de outros streams (`stream:pages`, `stream:parsed`, `stream:validated`)

**Exemplo de uso:**
```bash
curl -X GET http://localhost:8083/api/v1/document-processing/stream-info
```

**Resposta esperada:**
```json
{
  "stream:jobs": {
    "length": 5,
    "note": "Número de mensagens no stream"
  },
  "other_streams": {
    "stream:pages": 0,
    "stream:parsed": 0,
    "stream:validated": 0
  }
}
```

### 2. Limpar o Stream (CUIDADO!)

**Endpoint:** `DELETE /api/v1/document-processing/stream:jobs/clear`

**Descrição:** Remove todas as mensagens do `stream:jobs`. Use com cuidado!

**Exemplo de uso:**
```bash
curl -X DELETE http://localhost:8083/api/v1/document-processing/stream:jobs/clear
```

**Resposta esperada:**
```json
{
  "status": "success",
  "message": "Stream stream:jobs foi limpo com sucesso"
}
```

## Correções Implementadas

1. **SplitterWorker melhorado:**
   - Agora ignora jobs que não existem mais no banco (mensagens antigas)
   - Faz ACK das mensagens mesmo quando o job não existe para evitar reprocessamento infinito
   - Logs mais informativos

2. **Endpoints de diagnóstico:**
   - `/stream-info` - Ver informações dos streams
   - `/stream:jobs/clear` - Limpar mensagens antigas

## Como Resolver o Problema Atual

1. **Verificar quantas mensagens antigas existem:**
   ```bash
   curl -X GET http://localhost:8083/api/v1/document-processing/stream-info
   ```

2. **Limpar as mensagens antigas:**
   ```bash
   curl -X DELETE http://localhost:8083/api/v1/document-processing/stream:jobs/clear
   ```

3. **Fazer um novo upload de holerite** para testar se está funcionando

## Nota Importante

- O `SplitterWorker` agora ignora automaticamente mensagens antigas, mas é melhor limpar o stream para evitar logs desnecessários
- Após limpar o stream, faça um novo upload para testar
- O stream será recriado automaticamente quando você fizer um novo upload

## Alternativa: Usar Redis CLI (se disponível)

Se você tiver o `redis-cli` instalado, pode usar:

```bash
# Ver informações do stream
redis-cli XINFO STREAM stream:jobs

# Ver tamanho do stream
redis-cli XLEN stream:jobs

# Ver mensagens (primeiras 10)
redis-cli XRANGE stream:jobs - + COUNT 10

# Deletar o stream inteiro
redis-cli DEL stream:jobs
```

