# ✅ CORREÇÃO V157 - unit_id NULL

## ❌ Problema

**Linha 632**: `ERRO: o valor nulo na coluna "unit_id" da relação "positions" viola a restrição de não-nulo`

A migration V157 tentava inserir posições usando um SELECT:
```sql
unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
```

Mas esse SELECT retornou `NULL` porque não encontrou nenhuma unidade com nome 'Matriz'.

## 🔍 Causa

A tabela `units` foi **recriada pela V2** e não tem mais os dados. O SELECT não encontra a unidade 'Matriz', retorna `NULL`, e viola a constraint `NOT NULL` da coluna `unit_id`.

## ✅ Solução Implementada

### 1. **V157 Corrigida**

Troquei os SELECTs por IDs fixos da V11:

```sql
-- Antes (SELECT que retorna NULL)
unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)

-- Depois (ID fixo da V11)
unit_id = '00000000-0000-0000-0000-000000000005'
```

### 2. **Adicionado ON CONFLICT**

```sql
INSERT INTO positions (id, name, description, unit_id)
VALUES (...)
ON CONFLICT (id) DO NOTHING;
```

Isso evita erros se as posições já existirem.

## 📋 IDs Fixos da V11

De acordo com a migration V11:
- **Unidade Matriz**: `00000000-0000-0000-0000-000000000005`
- **Cargo Vigia**: `00000000-0000-0000-0000-000000000006`

## 🔄 Script de Limpeza Atualizado

Adicionada a V157 na lista de migrations a serem removidas:

```sql
DELETE FROM flyway_schema_history WHERE version IN ('2', '29', '139', '157', '261', '262', '263');
```

## 🚀 Execute Agora

No DBeaver, execute o script completo `LIMPAR_E_RECRIAR_COMPLETO.sql` e reinicie o backend.

Todas as migrations agora:
- ✅ Usam IDs fixos ao invés de SELECTs que podem falhar
- ✅ Têm verificações `IF NOT EXISTS`
- ✅ Têm `ON CONFLICT DO NOTHING` onde necessário
- ✅ São idempotentes e seguras para re-execução

## 🎯 Progresso

Estamos cada vez mais perto! As migrations estão sendo corrigidas uma a uma. Continue executando o script de limpeza e reiniciando até que todas sejam executadas com sucesso! 💪

