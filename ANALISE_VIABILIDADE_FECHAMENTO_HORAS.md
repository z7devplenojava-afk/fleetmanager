# 📊 ANÁLISE DE VIABILIDADE - PRD: Fechamento Mensal de Horas

## ✅ RESUMO EXECUTIVO

**Viabilidade: ✅ ALTA - Totalmente Implementável**

O sistema já possui uma base sólida com `TimeRecord`, `PayrollClosure` e `PayrollClosureService` implementados. O PRD proposto pode ser implementado como uma **evolução/extensão** do sistema atual, adicionando funcionalidades mais robustas e configuráveis.

---

## 🔍 ANÁLISE DO ESTADO ATUAL

### ✅ **O QUE JÁ EXISTE (Base Sólida)**

#### 1. **Estrutura de Dados**
- ✅ `TimeRecord` - Registros de ponto com tipos: ENTRADA, SAIDA_ALMOCO, RETORNO_ALMOCO, SAIDA
- ✅ `PayrollClosure` - Fechamentos mensais com cálculos agregados
- ✅ `Payroll` e `PayrollItem` - Estrutura básica de folha de pagamento
- ✅ `Contract` - Contratos já existem (podem ser estendidos com configurações)

#### 2. **Cálculos Já Implementados** (`PayrollClosureService`)
- ✅ Horas regulares (até 8h/dia)
- ✅ Horas extras 50% (primeiras 2h)
- ✅ Horas extras 100% (acima de 2h)
- ✅ Adicional noturno (22h às 5h)
- ✅ Cálculo de atrasos (tolerância 10min)
- ✅ Contagem de faltas
- ✅ Dias úteis trabalhados vs esperados

#### 3. **Funcionalidades Existentes**
- ✅ Registro de ponto via QR Code
- ✅ Validação de sequência lógica
- ✅ Aprovação/Rejeição de registros
- ✅ Geração de fechamentos em lote
- ✅ Status de fechamento (DRAFT → CLOSED → APPROVED → PROCESSED)

---

## 🚧 O QUE PRECISA SER ADICIONADO/ESTENDIDO

### 1. **Importação de Batidas (REP)**

#### **Requisito:**
- Importar batidas de arquivos/endpoint do REP
- Validação e `import_hash` para idempotência

#### **Implementação:**
```sql
-- Nova tabela: ponto_raw (batidas brutas importadas)
CREATE TABLE ponto_raw (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    tipo VARCHAR(20), -- ENTRADA/SAIDA (do REP)
    import_hash VARCHAR(64), -- SHA-256 do conteúdo original
    import_job_id UUID,
    raw_data JSONB, -- Dados originais do REP
    created_at TIMESTAMP
);

-- Nova tabela: import_job_log
CREATE TABLE import_job_log (
    id UUID PRIMARY KEY,
    import_hash VARCHAR(64) UNIQUE,
    file_name VARCHAR(255),
    total_records INTEGER,
    processed_records INTEGER,
    failed_records INTEGER,
    status VARCHAR(20), -- PENDING, PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    imported_by_id UUID,
    imported_at TIMESTAMP
);
```

#### **Entidades Java:**
- `PontoRaw.java` - Model para batidas brutas
- `ImportJobLog.java` - Log de importações
- `PontoImportService.java` - Service para processar imports

---

### 2. **Normalização e Processamento de Batidas**

#### **Requisito:**
- Normalizar batidas por dia
- Montar pares Entrada→Saída
- Regras para batidas ímpares

#### **Implementação:**
```java
// Novo service: PontoProcessingService.java
public class PontoProcessingService {
    
    // Normaliza batidas brutas em registros estruturados
    public List<ProcessedDayRecord> normalizeBatidas(List<PontoRaw> rawBatidas, LocalDate date);
    
    // Monta pares entrada/saída
    public List<TimeRecordPair> buildPairs(List<PontoRaw> dayBatidas);
    
    // Detecta e trata batidas ímpares
    public BatidaImparResult handleImparBatidas(List<PontoRaw> dayBatidas);
}
```

#### **Nova Tabela (Opcional):**
```sql
-- ponto_processed (intermediário, pode usar time_records existente)
-- Ou estender TimeRecord com campos adicionais
ALTER TABLE time_records ADD COLUMN processed_from_raw_id UUID;
ALTER TABLE time_records ADD COLUMN processing_notes TEXT;
```

---

### 3. **Períodos de Fechamento Configuráveis**

#### **Requisito:**
- Mês civil (já existe)
- Período customizado (adicional)

#### **Implementação:**
```java
// Estender PayrollClosure ou criar PayPeriod
@Entity
@Table(name = "pay_periods")
public class PayPeriod {
    private UUID id;
    private String name; // "Janeiro 2025", "15/01 a 14/02"
    private LocalDate startDate;
    private LocalDate endDate;
    private PeriodType type; // MONTHLY, CUSTOM, BIWEEKLY
    private Integer referenceMonth;
    private Integer referenceYear;
}

// Ajustar PayrollClosureService.generateClosure() para aceitar período customizado
```

---

### 4. **Configurações por Contrato**

#### **Requisito:**
- Divisor de hora configurável (ex.: 220h para 44h/sem)
- Adicional noturno configurável
- Adicional hora extra configurável
- Regras para domingo/feriado

#### **Implementação:**
```sql
-- Nova tabela: contract_payroll_config
CREATE TABLE contract_payroll_config (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL,
    hour_divisor NUMERIC(5,2) DEFAULT 220.0, -- Horas/mês esperadas
    daily_hours NUMERIC(4,2) DEFAULT 8.0, -- Horas/dia padrão
    night_shift_start TIME DEFAULT '22:00:00',
    night_shift_end TIME DEFAULT '05:00:00',
    night_shift_percentage NUMERIC(5,2) DEFAULT 20.0, -- % adicional noturno
    overtime_50_percentage NUMERIC(5,2) DEFAULT 50.0,
    overtime_100_percentage NUMERIC(5,2) DEFAULT 100.0,
    sunday_overtime_percentage NUMERIC(5,2) DEFAULT 100.0,
    holiday_overtime_percentage NUMERIC(5,2) DEFAULT 100.0,
    delay_tolerance_minutes INTEGER DEFAULT 10,
    bank_hours_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP
);
```

#### **Entidade Java:**
- `ContractPayrollConfig.java` - Configurações de folha por contrato

#### **Ajustes:**
- `PayrollClosureService` deve buscar configuração do contrato do funcionário
- Substituir valores hardcoded por valores da configuração

---

### 5. **Banco de Horas**

#### **Requisito:**
- Banco de horas com vencimento/compensação (opcional por contrato)

#### **Implementação:**
```sql
-- Nova tabela: bank_hours
CREATE TABLE bank_hours (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    contract_id UUID NOT NULL,
    balance_hours NUMERIC(10,2), -- Saldo atual
    period_start_date DATE,
    period_end_date DATE,
    expiration_date DATE, -- Data de vencimento do saldo
    last_updated_at TIMESTAMP
);

-- Nova tabela: bank_hours_transaction
CREATE TABLE bank_hours_transaction (
    id UUID PRIMARY KEY,
    bank_hours_id UUID NOT NULL,
    transaction_type VARCHAR(20), -- CREDIT, DEBIT
    hours NUMERIC(10,2),
    source_type VARCHAR(50), -- OVERTIME, COMPENSATION, ADJUSTMENT
    source_payroll_closure_id UUID,
    description TEXT,
    created_at TIMESTAMP
);
```

#### **Entidades Java:**
- `BankHours.java` - Saldo de banco de horas
- `BankHoursTransaction.java` - Transações de banco de horas
- `BankHoursService.java` - Lógica de banco de horas

---

### 6. **Tabela de Feriados**

#### **Requisito:**
- Consultar feriados para cálculos de adicional

#### **Implementação:**
```sql
-- Nova tabela: holidays
CREATE TABLE holidays (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- NATIONAL, STATE, MUNICIPAL, CONVENTION
    is_optional BOOLEAN DEFAULT false,
    description TEXT,
    UNIQUE(date, name)
);
```

#### **Entidade Java:**
- `Holiday.java` - Feriados
- `HolidayService.java` - Serviço para gerenciar feriados

---

### 7. **PayrollItem para Integração com Folha**

#### **Requisito:**
- Gerar `payroll_item` para integração (tipo, horas, valor unitário, total)

#### **Status Atual:**
- ✅ `PayrollItem` já existe em `V2__create_hr_tables.sql`

#### **Ajustes Necessários:**
```java
// Estender PayrollItem para incluir campos do PRD
@Entity
@Table(name = "payroll_items")
public class PayrollItem {
    // Campos existentes...
    private String type; // REGULAR_HOURS, OVERTIME_50, OVERTIME_100, NIGHT_SHIFT, etc.
    private BigDecimal hours; // Quantidade de horas
    private BigDecimal unitValue; // Valor unitário da hora
    private BigDecimal totalValue; // hours * unitValue
    private UUID payrollClosureId; // Link com fechamento
    private UUID payPeriodId; // Link com período
}
```

#### **Service:**
```java
// Novo método em PayrollClosureService
public List<PayrollItem> generatePayrollItems(UUID closureId) {
    // Gera itens de folha baseado no fechamento
    // Calcula valores unitários baseado em salário e configurações
}
```

---

### 8. **UI - Revisão Diária e Ajustes**

#### **Requisito:**
- Visualizar dias com inconsistências
- Aprovar ajustes e reprocessar período

#### **Implementação Frontend:**
```typescript
// Nova página: RH/FechamentoHoras.tsx
- Dashboard de processamento (últimos imports, erros/alertas)
- Tela de revisão diária (visualizar batidas, ajustar pares)
- Tela de fechamento do período (visualizar totais por funcionário)
- Relatórios e exportação (CSV/Excel/PDF)
```

#### **APIs Necessárias:**
```java
// Endpoints adicionais em PayrollClosureController
GET  /api/payroll-closures/{id}/inconsistencies
POST /api/payroll-closures/{id}/adjust
POST /api/payroll-closures/{id}/reprocess
GET  /api/payroll-closures/{id}/daily-review
```

---

### 9. **Logs de Auditoria e Reprocessamento**

#### **Requisito:**
- Auditoria para cada reprocessamento
- Justificativa para ajustes manuais

#### **Implementação:**
```sql
-- Estender PayrollClosure com campos de auditoria
ALTER TABLE payroll_closures ADD COLUMN reprocessed_at TIMESTAMP;
ALTER TABLE payroll_closures ADD COLUMN reprocessed_by_id UUID;
ALTER TABLE payroll_closures ADD COLUMN reprocess_count INTEGER DEFAULT 0;
ALTER TABLE payroll_closures ADD COLUMN adjustment_justification TEXT;

-- Nova tabela: payroll_closure_audit_log
CREATE TABLE payroll_closure_audit_log (
    id UUID PRIMARY KEY,
    payroll_closure_id UUID NOT NULL,
    action VARCHAR(50), -- CREATED, REPROCESSED, ADJUSTED, APPROVED
    changed_by_id UUID,
    justification TEXT,
    changes JSONB, -- Snapshots dos valores antes/depois
    created_at TIMESTAMP
);
```

---

### 10. **Relatórios e Exportação**

#### **Requisito:**
- Exportar relatórios (CSV/Excel/PDF)
- API para integrar com sistema folha

#### **Implementação:**
```java
// Novo service: PayrollReportService.java
public class PayrollReportService {
    public byte[] exportToExcel(UUID payPeriodId);
    public byte[] exportToPDF(UUID payPeriodId);
    public byte[] exportToCSV(UUID payPeriodId);
}

// Endpoints
GET /api/payroll-closures/{id}/report/excel
GET /api/payroll-closures/{id}/report/pdf
GET /api/payroll-closures/{id}/report/csv
GET /api/payroll-closures/{id}/payroll-items (para integração)
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO SUGERIDO

### **Fase 1: Fundação (Semana 1-2)**
1. ✅ Criar tabelas: `ponto_raw`, `import_job_log`, `holidays`
2. ✅ Implementar entidades Java: `PontoRaw`, `ImportJobLog`, `Holiday`
3. ✅ Criar `PontoImportService` básico (importação com validação e hash)
4. ✅ Criar `HolidayService` (CRUD de feriados)

### **Fase 2: Processamento (Semana 2-3)**
1. ✅ Criar `PontoProcessingService` (normalização e formação de pares)
2. ✅ Integrar processamento com `TimeRecord` existente
3. ✅ Implementar tratamento de batidas ímpares
4. ✅ Criar tabela `contract_payroll_config`
5. ✅ Ajustar `PayrollClosureService` para usar configurações do contrato

### **Fase 3: Configurações e Períodos (Semana 3-4)**
1. ✅ Implementar `PayPeriod` para períodos customizados
2. ✅ Extender `PayrollClosureService` para períodos customizados
3. ✅ Criar UI básica para configurar contratos

### **Fase 4: Banco de Horas (Semana 4-5)**
1. ✅ Criar tabelas: `bank_hours`, `bank_hours_transaction`
2. ✅ Implementar `BankHoursService`
3. ✅ Integrar com cálculos de fechamento

### **Fase 5: Integração e Itens de Folha (Semana 5-6)**
1. ✅ Estender `PayrollItem` conforme necessário
2. ✅ Implementar geração de `PayrollItem` a partir de `PayrollClosure`
3. ✅ Criar endpoints de integração com folha

### **Fase 6: UI e Relatórios (Semana 6-8)**
1. ✅ Criar página de importação de batidas
2. ✅ Criar página de revisão diária
3. ✅ Criar página de fechamento de período
4. ✅ Implementar exportação (Excel/PDF/CSV)
5. ✅ Implementar logs de auditoria

### **Fase 7: Testes e Ajustes (Semana 8-9)**
1. ✅ Testes unitários dos serviços
2. ✅ Testes de integração
3. ✅ Testes end-to-end
4. ✅ Ajustes baseados em feedback

---

## 🎯 COMPATIBILIDADE COM SISTEMA ATUAL

### ✅ **Vantagens:**
- Sistema atual já possui estrutura base (`TimeRecord`, `PayrollClosure`)
- Cálculos já implementados podem ser reaproveitados (com ajustes para configurações)
- Estrutura de contratos já existe (podem ser estendidos)
- Frontend já tem página de ponto eletrônico (pode ser estendida)

### ⚠️ **Atenções:**
- `PayrollClosureService` atual usa valores hardcoded (8h/dia, 50%/100%, etc.)
  - **Solução:** Refatorar para buscar de `ContractPayrollConfig`
- `TimeRecord` atual não diferencia batidas importadas vs registradas manualmente
  - **Solução:** Adicionar campos `processed_from_raw_id` e `import_source`
- Períodos atuais são apenas mensais (mês civil)
  - **Solução:** Adicionar suporte a `PayPeriod` customizado

---

## 🔒 REQUISITOS NÃO-FUNCIONAIS

### ✅ **Precisão:**
- Sistema atual já usa `BigDecimal` com `RoundingMode.HALF_UP`
- ✅ Compatível com arredondamento bancário

### ✅ **Performance:**
- Sistema atual já processa em lote (`generateBatchClosures`)
- ✅ Base sólida para processar 10k funcionários/mês

### ✅ **Segurança:**
- Sistema já possui RBAC (permissões `PAYROLL_*`, `TIME_RECORD_*`)
- ✅ Compatível com requisitos de segurança

### ✅ **Idempotência:**
- `import_hash` resolve duplicações na importação
- ✅ Compatível com requisitos de idempotência

### ⚠️ **Localização:**
- Sistema atual não lida explicitamente com timezones
- **Sugestão:** Usar `ZonedDateTime` ao invés de `LocalDateTime` para timestamps de importação

---

## 📊 CONCLUSÃO

### ✅ **Viabilidade: ALTA**

O sistema atual já possui uma **base sólida** que cobre aproximadamente **60-70%** dos requisitos do PRD. A implementação proposta consiste principalmente em:

1. **Adicionar funcionalidades novas** (importação REP, banco de horas, períodos customizados)
2. **Estender funcionalidades existentes** (configurações por contrato, itens de folha)
3. **Refatorar código existente** (remover hardcodes, adicionar configurabilidade)
4. **Criar UI adicional** (importação, revisão, relatórios)

### 🎯 **Estimativa:**
- **Tempo:** 8-9 semanas (com 1 desenvolvedor full-time)
- **Complexidade:** Média-Alta (principalmente na lógica de processamento e integrações)
- **Risco:** Baixo (base sólida existente, mudanças são incrementais)

### ✅ **Recomendação:**
**APROVAR IMPLEMENTAÇÃO** - O PRD é totalmente viável e alinhado com a arquitetura atual do sistema.





