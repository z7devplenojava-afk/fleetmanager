# 🔍 Diagnóstico: PDFs Ausentes no Sistema

## ❌ Problema Identificado

**Os diretórios de PDFs existem mas estão VAZIOS:**
- `backend/holerites/` - Existe mas sem arquivos
- `uploads/receipts/` - Existe mas sem arquivos

**Por isso a unificação falha com erro 500:**
- Sistema busca arquivos que não existem
- `findHoleriteOriginalFileByNameAndPeriod()` retorna `null`
- `findReceiptOriginalFileByNameAndPeriod()` retorna `null`
- Backend lança exceção "arquivo não encontrado"

## 🎯 Causa Raiz

Os dados existem no **banco de dados** (`tb_payslips` e `tb_payment_receipts`) mas os **arquivos PDF físicos** não foram salvos ou foram movidos/deletados.

## 🔧 Soluções

### Opção 1: Reprocessar PDFs (Recomendado)

1. **Reprocessar Holerites:**
   - Ir para aba "Processados" 
   - Upload do PDF original com holerites
   - Sistema irá recriar os PDFs individuais

2. **Reprocessar Comprovantes:**
   - Ir para aba "Comprovantes"
   - Upload do PDF original com comprovantes
   - Sistema irá recriar os PDFs individuais

### Opção 2: Usar Unificação em Lote (Funciona mesmo sem PDFs físicos)

A **unificação em lote** foi implementada para funcionar mesmo quando alguns arquivos estão ausentes:

1. Acessar **"Unificação Individual"** → **"🎯 Unificação em Lote/Massa"**
2. Selecionar período específico (ex: Mês 7, Ano 2025)
3. Clicar **"Iniciar Unificação"**
4. Ver relatório detalhado:
   - ✅ **Sucessos:** Funcionários que têm PDFs físicos
   - ❌ **Falhas:** Funcionários sem PDFs físicos (com motivo detalhado)

### Opção 3: Verificar Outros Locais

Os PDFs podem estar em outros diretórios. Vou criar um script para buscar:
