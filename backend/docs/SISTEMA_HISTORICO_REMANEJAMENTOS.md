# Sistema de Histórico Detalhado de Remanejamentos

## Visão Geral

O sistema de histórico de remanejamentos foi implementado para fornecer auditoria completa de todas as operações realizadas nos remanejamentos de funcionários. Cada ação (criação, edição, exclusão) é automaticamente registrada com informações detalhadas sobre quem executou, quando, de onde e por quê.

## Arquitetura

### Entidades Principais

1. **RemanejamentoHistorico** - Entidade principal que armazena o histórico
2. **AcaoHistorico** - Enum que define os tipos de ações possíveis
3. **RemanejamentoHistoricoDTO** - DTO para transferência de dados

### Componentes

- **Repository**: `RemanejamentoHistoricoRepository` - Acesso a dados
- **Service**: `RemanejamentoHistoricoService` - Lógica de negócio
- **Controller**: `RemanejamentoHistoricoController` - Endpoints REST
- **Migration**: `V200__create_remanejamentos_historico_table.sql` - Estrutura do banco

## Funcionalidades

### 1. Registro Automático de Histórico

O histórico é registrado automaticamente em todas as operações CRUD:

- **Criação**: Registra ação `CRIACAO` com dados do novo remanejamento
- **Edição**: Registra ação `EDICAO` com dados anteriores e novos
- **Exclusão**: Registra ação `EXCLUSAO` com dados do remanejamento removido

### 2. Informações Capturadas

Para cada registro de histórico, são armazenadas:

- **Dados do Remanejamento**: Tipo, origem, destino, data, observação
- **Dados de Auditoria**: 
  - Usuário que executou a ação
  - Data e hora da execução
  - IP do usuário
  - User-Agent do navegador
  - Motivo da alteração
- **Dados de Comparação**: 
  - Dados anteriores (JSON)
  - Dados novos (JSON)

### 3. Tipos de Ação

```java
public enum AcaoHistorico {
    CRIACAO("Criação"),
    EDICAO("Edição"),
    EXCLUSAO("Exclusão"),
    ATIVACAO("Ativação"),
    DESATIVACAO("Desativação"),
    APROVACAO("Aprovação"),
    REJEICAO("Rejeição"),
    CANCELAMENTO("Cancelamento");
}
```

## Endpoints REST

### Histórico de Remanejamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/remanejamentos-historico` | Lista todo o histórico |
| GET | `/api/remanejamentos-historico/{id}` | Busca histórico por ID |
| GET | `/api/remanejamentos-historico/remanejamento/{remanejamentoId}` | Histórico de um remanejamento |
| GET | `/api/remanejamentos-historico/funcionario/{employeeId}` | Histórico de um funcionário |
| GET | `/api/remanejamentos-historico/acao/{acao}` | Histórico por tipo de ação |
| GET | `/api/remanejamentos-historico/usuario/{usuarioId}` | Histórico por usuário |
| GET | `/api/remanejamentos-historico/periodo` | Histórico por período |
| GET | `/api/remanejamentos-historico/filtros` | Histórico com filtros múltiplos |
| GET | `/api/remanejamentos-historico/estatisticas` | Estatísticas do histórico |

### Filtros Disponíveis

- **Por funcionário**: `employeeId`
- **Por ação**: `acao` (CRIACAO, EDICAO, EXCLUSAO, etc.)
- **Por usuário**: `usuarioId`
- **Por período**: `dataInicio` e `dataFim`
- **Paginação**: `page`, `size`, `sort`

## Estrutura do Banco de Dados

### Tabela: `remanejamentos_historico`

```sql
CREATE TABLE remanejamentos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remanejamento_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    origem VARCHAR(255),
    destino VARCHAR(255),
    data_remanejamento TIMESTAMP NOT NULL,
    observacao VARCHAR(500),
    acao_realizada VARCHAR(50) NOT NULL,
    usuario_que_executou UUID,
    data_execucao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dados_anteriores TEXT,
    dados_novos TEXT,
    motivo_alteracao VARCHAR(500),
    ip_usuario VARCHAR(45),
    user_agent TEXT
);
```

### Índices Criados

- `idx_remanejamentos_historico_remanejamento_id`
- `idx_remanejamentos_historico_employee_id`
- `idx_remanejamentos_historico_usuario_id`
- `idx_remanejamentos_historico_data_execucao`
- `idx_remanejamentos_historico_acao`
- `idx_remanejamentos_historico_tipo`
- `idx_remanejamentos_historico_employee_data` (composto)
- `idx_remanejamentos_historico_remanejamento_data` (composto)

## Integração com Remanejamentos

### Service Atualizado

O `RemanejamentoService` foi atualizado para integrar automaticamente o histórico:

```java
// Criação com histórico
public Remanejamento create(Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao)

// Edição com histórico
public Remanejamento update(UUID id, Remanejamento remanejamento, User usuarioQueExecutou, String motivoAlteracao)

// Exclusão com histórico
public void delete(UUID id, User usuarioQueExecutou, String motivoAlteracao)
```

### Controller Atualizado

O `RemanejamentoController` captura automaticamente:

- Usuário autenticado
- IP do cliente
- User-Agent
- Timestamp da operação

## Exemplos de Uso

### 1. Criar Remanejamento com Histórico

```bash
POST /api/remanejamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee": { "id": "uuid-do-funcionario" },
  "tipo": "TRANSFERENCIA_UNIDADE",
  "origem": "Unidade Centro",
  "destino": "Unidade Norte",
  "dataRemanejamento": "2024-12-20",
  "observacao": "Transferência solicitada pelo gestor"
}
```

### 2. Consultar Histórico de um Remanejamento

```bash
GET /api/remanejamentos-historico/remanejamento/uuid-do-remanejamento
Authorization: Bearer <token>
```

### 3. Consultar Histórico de um Funcionário

```bash
GET /api/remanejamentos-historico/funcionario/uuid-do-funcionario
Authorization: Bearer <token>
```

### 4. Consultar Histórico com Filtros

```bash
GET /api/remanejamentos-historico/filtros?employeeId=uuid&acao=CRIACAO&dataInicio=2024-01-01T00:00:00&dataFim=2024-12-31T23:59:59&page=0&size=10
Authorization: Bearer <token>
```

## Testes

### Script de Teste

Execute o script `test_historico_remanejamento.ps1` para testar todas as funcionalidades:

```powershell
.\test_historico_remanejamento.ps1
```

### Testes Incluídos

1. Login e autenticação
2. Criação de remanejamento
3. Verificação de histórico de criação
4. Edição de remanejamento
5. Verificação de histórico de edição
6. Consulta de histórico por funcionário
7. Consulta de histórico por ação
8. Estatísticas do histórico
9. Exclusão de remanejamento
10. Verificação de histórico de exclusão

## Segurança

### Controle de Acesso

- Todos os endpoints requerem autenticação
- Apenas usuários com roles `SUPER_ADMIN`, `ADMIN` ou `RH` podem acessar
- Histórico é mantido mesmo após exclusão de remanejamentos

### Auditoria

- IP do usuário é capturado automaticamente
- User-Agent é registrado para rastreamento
- Timestamps precisos em UTC
- Dados anteriores e novos são preservados em JSON

## Relatórios e Estatísticas

### Endpoints de Relatório

- `/api/remanejamentos-historico/relatorio/atividades` - Relatório por período
- `/api/remanejamentos-historico/relatorio/funcionario/{employeeId}` - Relatório por funcionário
- `/api/remanejamentos-historico/estatisticas` - Estatísticas gerais

### Métricas Disponíveis

- Total de ações por funcionário
- Total de ações por tipo
- Total de ações por usuário
- Distribuição temporal de ações
- Frequência de alterações

## Manutenção

### Limpeza de Dados

Para manter a performance, considere implementar:

1. **Política de retenção**: Definir período de retenção de histórico
2. **Arquivamento**: Mover dados antigos para tabelas de arquivo
3. **Compressão**: Comprimir dados JSON antigos
4. **Particionamento**: Particionar por data para melhor performance

### Monitoramento

- Monitorar crescimento da tabela de histórico
- Verificar performance das consultas
- Alertar sobre falhas no registro de histórico
- Acompanhar estatísticas de uso

## Próximos Passos

1. **Interface Frontend**: Implementar tela de consulta de histórico
2. **Exportação**: Adicionar exportação para PDF/Excel
3. **Notificações**: Alertas para ações críticas
4. **Dashboard**: Gráficos e métricas de histórico
5. **Integração**: Conectar com outros módulos do sistema

## Troubleshooting

### Problemas Comuns

1. **Histórico não registrado**: Verificar se o usuário está autenticado
2. **Erro de serialização JSON**: Verificar dados do remanejamento
3. **Performance lenta**: Verificar índices e consultas
4. **Dados inconsistentes**: Verificar constraints do banco

### Logs

O sistema registra logs detalhados para:
- Criação de registros de histórico
- Erros de serialização
- Falhas de acesso ao banco
- Operações de limpeza

## Conclusão

O sistema de histórico de remanejamentos fornece auditoria completa e rastreabilidade de todas as operações, garantindo conformidade e transparência nas movimentações de funcionários. 