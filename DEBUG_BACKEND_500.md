# 🔍 Debugando Erro 500 no Backend - Módulo de Atendimento

## Problema Identificado

O backend está retornando **erro 500** nas seguintes rotas:
- `GET /api/support/agents`
- `GET /api/support/tickets`  
- `GET /api/support/tickets/metrics`

## Passos para Identificar a Causa

### 1. Verificar Logs do Backend

Após acessar `http://localhost:3000/gestao-atendimento/dashboard`, verifique o terminal do backend (janela PowerShell) e procure por:

**Possíveis Erros:**

#### A) Tabela não existe
```
ERROR ... PSQLException: ERROR: relation "support_tickets" does not exist
ERROR ... PSQLException: ERROR: relation "support_agents" does not exist
```

**Solução:** As migrations não foram aplicadas. Verifique se há erros nas migrations.

#### B) Erro de validação Jakarta
```
ERROR ... ConstraintViolationException
ERROR ... ValidationException
```

**Solução:** Problema com anotações `@Valid` ou `@NotNull`. Verifique os DTOs.

#### C) Erro de NullPointerException
```
ERROR ... NullPointerException
```

**Solução:** Algum campo está null quando não deveria. Verifique o Service.

#### D) Erro de conversão de tipos
```
ERROR ... ClassCastException
ERROR ... TypeMismatchException
```

**Solução:** Problema com conversão de enums ou tipos de dados.

### 2. Verificar Se as Migrations Rodaram

Execute no terminal:

```powershell
cd C:\dev\secured-guard\backend
./mvnw flyway:info
```

Procure por:
- `V270__Create_support_agents_table.sql` - Status: Success
- `V271__Create_support_tickets_table.sql` - Status: Success  
- `V272__Create_ticket_messages_table.sql` - Status: Success

### 3. Verificar Manualmente no Banco de Dados

Conecte no PostgreSQL e execute:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('support_agents', 'support_tickets', 'ticket_messages');

-- Se as tabelas existirem, verificar estrutura
\d support_agents
\d support_tickets
\d ticket_messages
```

### 4. Forçar Execução das Migrations

Se as tabelas não existirem, force a execução:

```powershell
cd C:\dev\secured-guard\backend
./mvnw flyway:migrate
```

### 5. Testar Endpoints Diretamente

Use o PowerShell para testar:

```powershell
# Obter token (faça login no sistema e copie o token do localStorage)
$token = "SEU_TOKEN_AQUI"

# Testar endpoint de agentes
Invoke-WebRequest -Uri "http://localhost:8081/api/support/agents" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}

# Testar endpoint de métricas
Invoke-WebRequest -Uri "http://localhost:8081/api/support/tickets/metrics" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

## Correções Mais Prováveis

### Se o erro for "relation does not exist"

1. Pare o backend
2. Execute:
   ```powershell
   cd C:\dev\secured-guard\backend
   ./mvnw flyway:migrate
   ```
3. Reinicie o backend

### Se o erro for relacionado a validação

O problema pode estar nos DTOs ou nos Controllers. Verifique:

1. `CreateTicketRequest.java` - todas as anotações `@NotNull`, `@NotBlank`
2. `SupportTicketController.java` - anotação `@Valid` nos parâmetros
3. `SupportAgentController.java` - anotação `@Valid` nos parâmetros

### Se o erro for NullPointerException

Provavelmente no `SupportTicketService.getTicketMetrics()`. 

O método pode estar tentando fazer cálculos com valores null quando não há tickets.

**Solução:** Adicionar verificações de null:

```java
public TicketMetrics getTicketMetrics() {
    Long totalTickets = ticketRepository.count();
    Long openTickets = ticketRepository.countByStatus(TicketStatus.OPEN);
    // ...
    
    Double averageResolutionTime = ticketRepository.getAverageResolutionTime();
    Double resolutionRate = ticketRepository.getResolutionRate(LocalDateTime.now().minusDays(30));
    
    return new TicketMetrics(
        totalTickets != null ? totalTickets : 0L,
        openTickets != null ? openTickets : 0L,
        // ...
        averageResolutionTime != null ? averageResolutionTime : 0.0,
        resolutionRate != null ? resolutionRate : 0.0
    );
}
```

## Logs Úteis para Compartilhar

Se precisar de ajuda, copie e compartilhe:

1. **Últimas 50 linhas do log do backend** após acessar a página
2. **Resultado do `flyway:info`**
3. **Estrutura da tabela** (saída do `\d support_tickets`)

## Status Esperado

Quando tudo estiver funcionando, você verá:

✅ No console do frontend:
```
✅ Dados carregados do backend: {agents: 0, tickets: 0, metrics: {...}}
```

✅ No backend (logs):
```
INFO ... SupportTicketController - GET /api/v1/support/tickets/metrics
INFO ... SupportAgentController - GET /api/v1/support/agents
```

✅ Na interface:
- Dashboard mostrando métricas zeradas (0 tickets, 0 agentes)
- Sem erros no console
- Possibilidade de criar novos tickets

---

**Documentação criada em:** 2025-10-22  
**Status do módulo:** Aguardando correção do erro 500  
**Próximo passo:** Identificar causa exata do erro 500 através dos logs

