# 🔍 Diagnóstico do Erro 500 na Unificação em Lote

## 📋 Problema

Erro 500 ao executar unificação em lote:
```
Failed to load resource: the server responded with a status of 500
/api/unified-documents/create-batch?forceUnification=false&month=10&year=2025
```

## 🔧 Correções Aplicadas

### 1. Melhor Tratamento de Erros no Controller
- Captura mais detalhada de exceções
- Mensagens de erro mais informativas
- Detecção específica de erro de tabela não existente

### 2. Validação de Null no Mapeamento
- Adicionada validação para `employeeName` não nulo antes do mapeamento
- Previne `NullPointerException` ao processar holerites

### 3. Tratamento de Erro Assíncrono
- Erro no processamento assíncrono não bloqueia mais a criação do job
- Job é criado mesmo se houver erro ao iniciar processamento

## 🔍 Como Diagnosticar o Erro

### 1. Verificar Logs do Backend

```bash
# Ver logs do backend
docker logs secured-guard-backend-ci --tail 100 -f

# Ou se estiver rodando localmente
tail -f logs/application.log
```

Procure por:
- `❌ ERRO CRÍTICO: A tabela 'unification_jobs' não existe`
- `💥 Erro ao criar job de unificação em lote`
- `NullPointerException`
- `SQLGrammarException`

### 2. Verificar se a Tabela Existe

```sql
-- Conectar ao banco
psql -U secured_guard_ci -d secured_guard_ci

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unification_jobs'
);

-- Se não existir, verificar migrations do Flyway
SELECT * FROM flyway_schema_history 
WHERE version = '338' OR script LIKE '%unification_jobs%';
```

### 3. Verificar Resposta da API

O endpoint agora retorna mais detalhes no erro:

```json
{
  "sucesso": false,
  "mensagem": "Erro ao iniciar processamento: ...",
  "erro": "RuntimeException",
  "detalhes": "...",
  "causa": "...",
  "tipoErro": "MIGRATION_PENDENTE" // Se for erro de tabela
}
```

### 4. Testar Endpoint Manualmente

```bash
# Obter token de autenticação primeiro
TOKEN="seu_token_aqui"

# Testar endpoint
curl -X POST "http://localhost:8081/api/unified-documents/create-batch?month=10&year=2025&forceUnification=false" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

## 🛠️ Soluções

### Solução 1: Tabela Não Existe

Se a tabela `unification_jobs` não existir:

```sql
-- Executar migration manualmente
-- Ver arquivo: backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql

CREATE TABLE IF NOT EXISTS unification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL,
    month INTEGER,
    year INTEGER,
    force_unification BOOLEAN DEFAULT FALSE,
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    error_message VARCHAR(2000),
    processing_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_unification_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_unification_jobs_status ON unification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_at ON unification_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_by ON unification_jobs(created_by);
```

**OU** reiniciar a aplicação para que o Flyway execute as migrations automaticamente.

### Solução 2: Verificar Configuração do Flyway

Verificar se o Flyway está habilitado e configurado corretamente:

```properties
# application-ci.properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.validate-on-migrate=true
```

### Solução 3: Verificar Usuário Autenticado

O erro pode ocorrer se não houver usuário autenticado. Verificar:

```java
// No controller, o código tenta obter o usuário mas não falha se não encontrar
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
// Se auth for null, createdBy será null (aceitável)
```

### Solução 4: Verificar Holerites no Banco

Verificar se há holerites válidos:

```sql
-- Verificar holerites para o período
SELECT COUNT(*) FROM payslips 
WHERE month = 10 AND year = 2025 
AND employee_name IS NOT NULL 
AND employee_name != '';

-- Verificar holerites com nome nulo ou vazio
SELECT COUNT(*) FROM payslips 
WHERE employee_name IS NULL OR employee_name = '';
```

## 📝 Checklist de Verificação

- [ ] Tabela `unification_jobs` existe no banco
- [ ] Flyway está habilitado e executou as migrations
- [ ] Usuário está autenticado (token válido)
- [ ] Há holerites no banco para o período especificado
- [ ] Holerites têm `employee_name` preenchido
- [ ] Backend está rodando e acessível
- [ ] Logs do backend não mostram erros críticos

## 🔄 Próximos Passos

1. **Verificar logs do backend** para identificar o erro específico
2. **Verificar se a tabela existe** no banco de dados
3. **Testar endpoint manualmente** com curl/Postman
4. **Verificar resposta da API** para ver mensagem de erro detalhada
5. **Aplicar solução apropriada** baseada no erro encontrado

## 📚 Arquivos Relacionados

- `backend/src/main/java/com/z7design/secured_guard/controller/UnifiedDocumentController.java`
- `backend/src/main/java/com/z7design/secured_guard/service/UnifiedDocumentService.java`
- `backend/src/main/resources/db/migration/V338__create_unification_jobs_table.sql`

