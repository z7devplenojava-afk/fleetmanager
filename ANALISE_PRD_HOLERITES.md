# 📋 Análise PRD - Sistema de Processamento de Holerites

## 🔍 Problemas Identificados

### 1. ❌ **Estrutura de Pastas Incorreta**

**PRD Exige:**
```
/storage/holerites/
  └── {empresa-cnpj}/
        └── {setor-normalizado}/
              └── {ano-mes}/
                    └── {funcionario-cpf}/
                          ├── holerite_v1.pdf
                          ├── holerite_v2.pdf
```

**Implementação Atual:**
```java
// PayslipService.java linha 1343
Path pastaCompleta = Paths.get(OUTPUT_DIR, empresaNome, setorNome, ano, mes, funcionarioNome);
// Resultado: backend/holerites/Empresa/Setor/Ano/Mês/Funcionário/
```

**Problemas:**
- ❌ Usa nome da empresa ao invés de CNPJ normalizado
- ❌ Período está separado em `ano/mes` ao invés de `ano-mes`
- ❌ Funcionário usa nome ao invés de CPF
- ❌ Não segue o padrão `/storage/holerites/` do PRD

---

### 2. ❌ **Versionamento Incorreto**

**PRD Exige:**
- Arquivos nomeados como `holerite_v1.pdf`, `holerite_v2.pdf`, `holerite_v3.pdf`
- Versionamento sequencial baseado em alterações detectadas

**Implementação Atual:**
```java
// PayslipService.java linha 1366-1376
String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
nomeArquivo = baseName + "_V" + timestamp + ".pdf";
// Resultado: holerite_123456_V789012.pdf (timestamp, não versão sequencial)
```

**Problemas:**
- ❌ Usa timestamp ao invés de versão sequencial (v1, v2, v3)
- ❌ Nome do arquivo inclui nome do funcionário e período (não segue PRD)
- ❌ Não detecta versão anterior corretamente para incrementar

---

### 3. ❌ **Campos Faltantes no Banco de Dados**

**PRD Exige na tabela `holerite`:**
```sql
versao INT
hash_conteudo VARCHAR(64)
arquivo_caminho VARCHAR
periodo_ano INT
periodo_mes INT
```

**Implementação Atual:**
- ✅ Tem `periodo_ano` e `periodo_mes` (como `year` e `month`)
- ❌ **FALTA** campo `versao`
- ❌ **FALTA** campo `hash_conteudo`
- ✅ Tem `arquivo_caminho` (como `file_name`, mas não o caminho completo)

---

### 4. ❌ **Índices Faltantes**

**PRD Exige:**
```sql
INDEX idx_holerite_empresa (empresa_cnpj)
INDEX idx_holerite_setor (setor)
INDEX idx_holerite_periodo (periodo_ano, periodo_mes)
INDEX idx_holerite_funcionario (funcionario_cpf)
```

**Implementação Atual:**
- ✅ Tem `idx_payslips_company_cpf_period` (parcial)
- ✅ Tem `idx_payslips_company_hierarchy` (parcial)
- ❌ **FALTA** índice específico por setor
- ❌ **FALTA** índice específico por funcionário (CPF)

---

### 5. ❌ **Lógica de Versionamento Incorreta**

**PRD Exige:**
- Detectar versão anterior no mesmo caminho (Empresa/Setor/Período/Funcionário)
- Comparar hash do conteúdo
- Se houver mudança, incrementar versão (v1 → v2 → v3)

**Implementação Atual:**
```java
// PayslipService.java linha 286-292
List<Payslip> holeritesExistentes = payslipRepository.findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(...)
// Busca no banco, mas não verifica versões no mesmo caminho físico
```

**Problemas:**
- ❌ Não busca versões anteriores no mesmo caminho físico
- ❌ Não incrementa versão sequencialmente
- ❌ Usa timestamp ao invés de número de versão

---

### 6. ❌ **Normalização de Setor**

**PRD Exige:**
- Setor deve ser normalizado removendo acentos e caracteres especiais

**Implementação Atual:**
```java
// PayslipService.java linha 1337
String setorNome = normalizeFolderName(payslip.getWorkPostName() != null ? payslip.getWorkPostName() : "SETOR_NAO_INFORMADO");
```

**Status:** ✅ Parece estar correto, mas precisa verificar se a normalização está completa

---

## ✅ Correções Necessárias

### 1. Corrigir Estrutura de Pastas
- [ ] Usar CNPJ normalizado (apenas números) como primeiro nível
- [ ] Usar formato `ano-mes` para período (ex: `2025-10`)
- [ ] Usar CPF normalizado para funcionário
- [ ] Seguir padrão `/storage/holerites/` ou `backend/holerites/`

### 2. Implementar Versionamento Correto
- [ ] Buscar versões existentes no mesmo caminho físico
- [ ] Incrementar versão sequencialmente (v1, v2, v3)
- [ ] Nomear arquivos como `holerite_v1.pdf`, `holerite_v2.pdf`

### 3. Adicionar Campos no Banco
- [ ] Adicionar campo `versao INT`
- [ ] Adicionar campo `hash_conteudo VARCHAR(64)`
- [ ] Adicionar campo `arquivo_caminho VARCHAR` (caminho completo)

### 4. Criar Índices Adequados
- [ ] Índice por empresa (CNPJ)
- [ ] Índice por setor
- [ ] Índice por período (ano, mês)
- [ ] Índice por funcionário (CPF)

### 5. Ajustar Lógica de Versionamento
- [ ] Buscar versões no mesmo caminho físico
- [ ] Comparar hash do conteúdo
- [ ] Incrementar versão corretamente

---

## 📝 Próximos Passos

1. Criar migration para adicionar campos faltantes
2. Atualizar entidade Payslip
3. Corrigir método `organizarEmPastas()`
4. Implementar lógica de versionamento correta
5. Criar índices no banco de dados
6. Testar com dados reais

