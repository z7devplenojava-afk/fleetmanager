# Diagnóstico: Holerites não aparecem na tabela payslips

## Tabela que armazena holerites processados

**Tabela:** `payslips`

## Fluxo de processamento

```
1. Upload → DocumentProcessingService.createProcessingJob()
2. SplitterWorker → Lê de stream:jobs, divide PDF em páginas, publica em stream:pages
3. OcrWorker → Lê de stream:pages, faz OCR, salva DocumentPage, publica em stream:parsed
4. ParserWorker → Lê de stream:parsed, valida dados, publica em stream:validated
5. UnmatchedPayslipWorker → Lê de stream:validated, salva em payslips
```

## Verificações necessárias

### 1. Verificar se há jobs criados
```sql
SELECT * FROM document_processing_jobs ORDER BY created_at DESC LIMIT 10;
```

### 2. Verificar se há DocumentPages criadas
```sql
SELECT COUNT(*) FROM document_page;
SELECT * FROM document_page ORDER BY processed_at DESC LIMIT 10;
```

### 3. Verificar se há mensagens no Redis Stream
Execute no Redis CLI:
```bash
redis-cli
XINFO STREAM stream:validated
XLEN stream:validated
XRANGE stream:validated - + COUNT 10
```

### 4. Verificar logs do backend

Procure por estas mensagens nos logs:

**ParserWorker deve mostrar:**
```
✅ ParserWorker: Página X publicada no stream:validated - Type: HOLERITE, Status: OK
```

**UnmatchedPayslipWorker deve mostrar:**
```
🟡 UnmatchedPayslipWorker: Processando X documentos validados
✅ UnmatchedPayslipWorker: Payslip SALVO - ID=...
```

## Possíveis problemas

### Problema 1: ParserWorker não está publicando
- **Sintoma:** Não aparece log "✅ ParserWorker: Página X publicada no stream:validated"
- **Causa:** ParserWorker não está processando ou há erro ao publicar
- **Solução:** Verificar logs de erro do ParserWorker

### Problema 2: UnmatchedPayslipWorker não está consumindo
- **Sintoma:** Não aparece log "🟡 UnmatchedPayslipWorker: Processando X documentos"
- **Causa:** Consumer group não está funcionando ou Redis não está acessível
- **Solução:** Verificar conexão com Redis e consumer groups

### Problema 3: DocumentPages não estão sendo criadas
- **Sintoma:** Tabela `document_page` está vazia
- **Causa:** OcrWorker não está processando ou há erro ao salvar
- **Solução:** Verificar logs do OcrWorker

### Problema 4: Jobs não estão sendo criados
- **Sintoma:** Tabela `document_processing_jobs` está vazia
- **Causa:** Upload não está funcionando ou há erro ao criar job
- **Solução:** Verificar logs do DocumentProcessingService

## Próximos passos

1. Execute o SQL `diagnostico_completo.sql` para verificar o estado das tabelas
2. Verifique os logs do backend procurando pelas mensagens acima
3. Verifique se o Redis está rodando e acessível
4. Verifique se os workers estão inicializados (procure por logs de inicialização)

## Logs importantes para procurar

- `SPLITTER WORKER: Iniciando inicialização...`
- `OCR WORKER: Iniciando inicialização...`
- `PARSER WORKER: Iniciando inicialização...`
- `UNMATCHED PAYSLIP WORKER: Iniciando inicialização...`
- `✅ ParserWorker: Página X publicada no stream:validated`
- `🟡 UnmatchedPayslipWorker: Processando X documentos validados`
- `✅ UnmatchedPayslipWorker: Payslip SALVO`

