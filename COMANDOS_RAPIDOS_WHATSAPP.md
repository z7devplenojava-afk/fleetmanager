# ⚡ Comandos Rápidos - Resolver Problema WhatsApp

## 🎯 EXECUTE AGORA (5 minutos)

### 1. Commit das Mudanças
```bash
git add .
git commit -m "fix: adiciona logs detalhados e migration payslip_delivery_logs

- Cria tabela payslip_delivery_logs (V299)
- Adiciona logs detalhados de busca de arquivo
- Mostra caminho absoluto e tamanho do arquivo
- Facilita diagnóstico de arquivo não encontrado"
git push origin ci
```

### 2. Aplicar Migration (Escolha UMA opção)

**Opção A: SQL Manual (Mais Rápido - 1 minuto)**
```sql
-- No DBeaver, conectar ao banco e executar:

CREATE TABLE IF NOT EXISTS payslip_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    channel VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 1,
    error_message VARCHAR(500),
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_cpf ON payslip_delivery_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_payslip_delivery_logs_created_at ON payslip_delivery_logs(created_at DESC);
```

**Opção B: Restart Backend (Automático - 3 minutos)**
```bash
# Windows local:
# Fechar o backend (Ctrl+C)
cd backend
mvn clean package
java -jar target/secured-guard-0.0.1-SNAPSHOT.jar

# A migration V299 será aplicada automaticamente
```

### 3. Verificar Holerites no Banco
```sql
-- No DBeaver:
SELECT 
    cpf, 
    month AS "Mês", 
    year AS "Ano", 
    file_name AS "Nome Arquivo",
    processed_at AS "Data"
FROM payslips
WHERE cpf = '00824310608'
ORDER BY year DESC, month DESC;
```

**Anote o nome do arquivo que aparece!**

### 4. Procurar Arquivo no Sistema
```bash
# Windows PowerShell:
cd C:\dev\secured-guard

# Procurar arquivo
Get-ChildItem -Recurse -Filter "*.pdf" | Where-Object { $_.Name -like "*00824310608*" -or $_.Name -like "*JOSE*" }

# OU procurar em diretório específico
Get-ChildItem uploads\payslips\ -Recurse -Filter "*.pdf"
Get-ChildItem backend\payslips_output\ -Recurse -Filter "*.pdf"
```

### 5. Testar Envio e Copiar Logs

**Teste novamente o envio via WhatsApp**

Os logs vão mostrar algo assim:
```
✅ WhatsApp encontrado: 31971731747
📋 Holerite encontrado: CPF=00824310608, Mês=9, Ano=2025, Arquivo=holerite.pdf
🔍 Verificando arquivo em: C:\dev\secured-guard\uploads\payslips\9-2025\holerite.pdf
❌ Arquivo não existe: C:\dev\secured-guard\uploads\payslips\9-2025\holerite.pdf
📂 Diretório pai existe? false
```

**Me envie esses logs!** Com eles, vou te dizer exatamente o que fazer.

---

## 🔍 DIAGNÓSTICO RÁPIDO

### Se o Arquivo Não Foi Encontrado

**1. Onde o sistema está procurando?**
```
Copie o caminho que aparece em: "🔍 Verificando arquivo em:"
```

**2. O arquivo existe em outro lugar?**
```bash
# Procurar em todo o projeto
Get-ChildItem -Path "C:\dev\secured-guard" -Recurse -Filter "*.pdf" | Select-Object FullName

# Ver últimos PDFs criados
Get-ChildItem -Path "C:\dev\secured-guard" -Recurse -Filter "*.pdf" | Sort-Object LastWriteTime -Descending | Select-Object -First 10
```

**3. O arquivo nunca foi criado?**
```sql
-- Verificar quando foi processado
SELECT * FROM payslips WHERE cpf = '00824310608';

-- Se há registro mas sem arquivo, precisa re-processar o holerite
```

---

## 🎯 SOLUÇÕES RÁPIDAS

### Solução 1: Arquivo Está em Lugar Errado
```bash
# Mover arquivo para onde o sistema espera
Move-Item "caminho\origem\arquivo.pdf" "caminho\destino\arquivo.pdf"
```

### Solução 2: Criar Diretório Faltante
```bash
# Se logs mostram: "📂 Diretório pai existe? false"
New-Item -Path "caminho\do\diretorio" -ItemType Directory -Force
```

### Solução 3: Re-processar Holerite
```bash
# Se arquivo nunca foi criado, re-upload do PDF original
# Via frontend: Documentos > Upload Holerites
```

### Solução 4: Atualizar Caminho no Banco
```sql
-- Se arquivo existe mas caminho está errado no código
-- (Solução temporária, melhor corrigir o código)
UPDATE payslips 
SET file_name = 'nome_correto.pdf'
WHERE cpf = '00824310608' AND month = 9 AND year = 2025;
```

---

## 📞 PRECISA DE AJUDA?

**Me envie:**
1. ✅ Os logs completos do teste
2. ✅ Resultado da query: `SELECT * FROM payslips WHERE cpf = '00824310608'`
3. ✅ Lista de PDFs encontrados no projeto

Com isso, vou te dar a solução exata em 1 minuto! 🎯

---

## 📚 DOCUMENTAÇÃO COMPLETA

- 📄 **Análise detalhada:** `DIAGNOSTICO_ARQUIVO_HOLERITE_NAO_ENCONTRADO.md`
- 📄 **Resumo:** `RESUMO_ARQUIVO_NAO_ENCONTRADO.md`
- 🗃️ **Script SQL:** `diagnostico_holerites_arquivos.sql`

---

**Tempo total:** ~5 minutos  
**Resultado esperado:** Logs detalhados mostrando exatamente onde procurar o arquivo

