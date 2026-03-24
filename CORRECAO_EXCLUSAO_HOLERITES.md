# 🔧 Correção: Exclusão de Holerites e Pastas

## 🐛 Problema Identificado

Quando o usuário selecionava todos os holerites e excluía, o sistema estava:
1. ❌ Usando a estrutura antiga de pastas (`mes-ano/arquivo.pdf`)
2. ❌ Não usando o campo `arquivo_caminho` do banco de dados
3. ❌ Excluindo pastas incorretamente
4. ❌ Não removendo pastas vazias da hierarquia completa

## ✅ Correções Implementadas

### 1. Uso do Campo `arquivo_caminho`

**Antes:**
```java
String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
String nomeArquivo = generateFileName(payslip);
Path arquivo = pastaMesAno.resolve(nomeArquivo);
```

**Depois:**
```java
// Usar arquivo_caminho se disponível (nova estrutura PRD)
Path arquivo = null;
if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
    arquivo = Paths.get(payslip.getArquivoCaminho());
} else {
    // Fallback: construir caminho conforme nova estrutura PRD
    // empresa-cnpj/setor/ano-mes/funcionario-cpf/holerite_v1.pdf
}
```

### 2. Remoção Hierárquica de Pastas Vazias

**Antes:**
- Removia apenas a pasta do mês se ficasse vazia
- Não verificava a hierarquia completa

**Depois:**
- Remove pastas vazias da hierarquia completa:
  1. Pasta do funcionário (CPF)
  2. Pasta do período (ano-mes)
  3. Pasta do setor
  4. Pasta da empresa (CNPJ)
- Verifica cada nível antes de remover
- Remove apenas se realmente estiver vazia

### 3. Exclusão em Massa Melhorada

**Melhorias:**
- ✅ Coleta informações de todos os payslips primeiro
- ✅ Usa `arquivo_caminho` quando disponível
- ✅ Fallback para nova estrutura PRD
- ✅ Fallback para estrutura antiga (compatibilidade)
- ✅ Remove pastas vazias de forma hierárquica
- ✅ Logs mais detalhados

## 📁 Estrutura de Pastas (PRD)

```
backend/holerites/
  └── {empresa-cnpj}/              # Nível 4: Empresa
        └── {setor}/                # Nível 3: Setor
              └── {ano-mes}/        # Nível 2: Período
                    └── {cpf}/      # Nível 1: Funcionário
                          └── holerite_v1.pdf
```

**Remoção:**
1. Remove arquivo `holerite_v1.pdf`
2. Se pasta `{cpf}` ficar vazia → remove
3. Se pasta `{ano-mes}` ficar vazia → remove
4. Se pasta `{setor}` ficar vazia → remove
5. Se pasta `{empresa-cnpj}` ficar vazia → remove

## 🔍 Fluxo de Exclusão

### Exclusão Individual (`deletePayslip`)

1. Busca payslip no banco de dados
2. Obtém caminho do arquivo:
   - Primeiro: usa `arquivo_caminho` do banco
   - Segundo: constrói caminho conforme PRD
   - Terceiro: usa estrutura antiga (fallback)
3. Remove arquivo se existir
4. Remove pastas vazias hierarquicamente
5. Remove registro do banco de dados

### Exclusão em Massa (`deleteMultiplePayslips`)

1. Coleta informações de todos os payslips
2. Remove registros do banco de dados
3. Remove todos os arquivos
4. Coleta todas as pastas afetadas
5. Remove pastas vazias (da mais específica para a mais geral)

## ⚠️ Observações Importantes

1. **Compatibilidade**: O código mantém compatibilidade com estrutura antiga
2. **Segurança**: Verifica se pasta está vazia antes de remover
3. **Logs**: Logs detalhados para debug
4. **Erros**: Tratamento de erros individual para cada arquivo/pasta

## ✅ Resultado Esperado

- ✅ Arquivos são encontrados corretamente (usando `arquivo_caminho`)
- ✅ Pastas vazias são removidas hierarquicamente
- ✅ Não remove pastas que ainda contêm arquivos
- ✅ Logs claros mostrando o que foi removido
- ✅ Compatível com estrutura antiga e nova

