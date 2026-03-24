# 📦 Containers Necessários para Processamento de Holerites

## ✅ Status Atual

Baseado na verificação, você já tem:
- ✅ **Redis** rodando na porta 6379
- ✅ **PostgreSQL** rodando na porta 5432

## 🎯 O Que É Necessário

### 1. **Redis** ⚠️ **ESSENCIAL**
- **Porta:** 6379
- **Para que serve:** Os workers usam Redis Streams para processar os jobs de forma assíncrona
- **Status:** ✅ Já está rodando

### 2. **PostgreSQL** ✅
- **Porta:** 5432 (ou 5433 dependendo da configuração)
- **Para que serve:** Armazena os dados dos holerites processados
- **Status:** ✅ Já está rodando

### 3. **MinIO** (Opcional)
- **Porta:** 9000
- **Para que serve:** Armazenamento de arquivos (PDFs e imagens)
- **Status:** ⚠️ Não é obrigatório - o sistema usa armazenamento local quando MinIO está desabilitado

## 🔍 Como Verificar se Está Tudo Funcionando

### 1. Verificar Redis:
```powershell
docker exec redis redis-cli ping
# Deve retornar: PONG
```

### 2. Verificar Health do Backend:
Acesse no navegador ou use curl:
```
http://localhost:8083/api/v1/document-processing/health
```

Resposta esperada:
```json
{
  "redis": {
    "status": "OK",
    "ping": "PONG"
  },
  "status": "OK"
}
```

### 3. Verificar Logs do Backend:
Procure por estas linhas nos logs:
```
═══════════════════════════════════════════════════════════
🟢 SPLITTER WORKER: Iniciando inicialização...
✅ SPLITTER WORKER: Redis está disponível!
✅ SPLITTER WORKER: Inicialização concluída
```

## 🚨 Se o Processamento Não Está Funcionando

### Verifique:

1. **Backend está rodando?**
   - Verifique se o backend iniciou sem erros
   - Procure pelos logs de inicialização dos workers

2. **Redis está acessível pelo backend?**
   - O backend precisa conseguir conectar em `localhost:6379`
   - Teste: `curl http://localhost:8083/api/v1/document-processing/health`

3. **Workers foram inicializados?**
   - Procure nos logs por: `SPLITTER WORKER`, `OCR WORKER`, etc.
   - Se não aparecer, pode haver erro na inicialização

4. **Há mensagens no Redis Stream?**
   ```powershell
   docker exec redis redis-cli XINFO STREAM stream:jobs
   ```

## 📋 Checklist Rápido

- [x] Redis está rodando (verificado ✅)
- [x] PostgreSQL está rodando (verificado ✅)
- [ ] Backend está rodando
- [ ] Workers foram inicializados (verificar logs)
- [ ] Endpoint `/health` retorna Redis OK
- [ ] Upload de PDF funciona
- [ ] Jobs são processados (não ficam em QUEUED)

## 🔧 Próximos Passos

1. **Reinicie o backend** e verifique os logs de inicialização
2. **Acesse o endpoint de health** para confirmar que o Redis está acessível
3. **Faça um upload de teste** e monitore os logs
4. **Verifique se os workers processam** os jobs

## 💡 Dica

Se os workers não estão inicializando, verifique:
- Se há erros nos logs do backend
- Se o Redis está realmente acessível (teste com o endpoint `/health`)
- Se o `@EnableScheduling` está habilitado na aplicação principal

