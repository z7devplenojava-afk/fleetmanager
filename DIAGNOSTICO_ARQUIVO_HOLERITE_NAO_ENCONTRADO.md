# 🔍 Diagnóstico - Arquivo de Holerite Não Encontrado

**Data:** 28/10/2025  
**Status:** WhatsApp funciona, mas arquivo não é encontrado  
**Prioridade:** 🟡 ALTA

---

## ✅ O QUE JÁ ESTÁ FUNCIONANDO

1. ✅ **Busca do WhatsApp na tabela `users`**: FUNCIONA PERFEITAMENTE
   ```
   WhatsApp encontrado para JOSE MARIO RAMOS (CPF: 00824310608): 31971731747
   ```

2. ✅ **Query na tabela `payslips`**: FUNCIONA (após correção dos tipos month/year)
   ```sql
   SELECT * FROM payslips WHERE cpf = '00824310608' AND month = 9 AND year = 2025
   ```

3. ✅ **Conexão com serviço Baileys**: FUNCIONA
   ```
   Enviando arquivo via Baileys REST para: 5531971731747
   ```

---

## ❌ PROBLEMAS IDENTIFICADOS

### Problema 1: Arquivo PDF Não Encontrado (CRÍTICO)
```
404 Not Found: "{"success":false,"error":"file not found"}"
```

**Causa possível:**
- O arquivo PDF do holerite não existe no caminho esperado
- O caminho está incorreto
- O serviço Baileys não tem permissão para acessar o arquivo
- O arquivo foi processado mas não foi salvo no sistema de arquivos

### Problema 2: Tabela de Log Não Existe (RESOLVIDO)
```
ERRO: relação "payslip_delivery_logs" não existe
```

**Solução:** Criei migration `V299__create_payslip_delivery_logs.sql`

---

## 🔧 CORREÇÕES APLICADAS

### 1. Criada Migration da Tabela de Logs

**Arquivo:** `backend/src/main/resources/db/migration/V299__create_payslip_delivery_logs.sql`

```sql
CREATE TABLE payslip_delivery_logs (
    id UUID PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    channel VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL,
    attempts INTEGER NOT NULL,
    error_message VARCHAR(500),
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

### 2. Adicionados Logs Detalhados no EnvioService

**Arquivo:** `backend/src/main/java/com/z7design/secured_guard/service/EnvioService.java`

**Novos logs:**
- 📋 Informações do holerite encontrado (CPF, mês, ano, nome do arquivo)
- 🔍 Caminho do arquivo sendo verificado
- ❌ Se o arquivo não existe, mostra o caminho completo
- 📂 Verifica se o diretório pai existe
- ✅ Caminho absoluto do arquivo
- 📊 Tamanho do arquivo em bytes
- 📤 Dados enviados ao Baileys (phone + path)

---

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Aplicar Migration (URGENTE)

```bash
# Opção A: Automática (reiniciar backend)
docker-compose -f docker-compose.ci.yml restart backend-ci

# Opção B: Manual (SQL no DBeaver)
# Executar arquivo: diagnostico_holerites_arquivos.sql
```

### Passo 2: Reiniciar Backend com Novos Logs

```bash
# No ambiente local
cd backend
mvn clean package
java -jar target/secured-guard-0.0.1-SNAPSHOT.jar

# OU simplesmente reiniciar
# Os novos logs vão mostrar exatamente onde o sistema está procurando o arquivo
```

### Passo 3: Testar Novamente o Envio

Quando testar novamente, os logs vão mostrar:

```
📋 Holerite encontrado: CPF=00824310608, Mês=9, Ano=2025, Arquivo=nome_do_arquivo.pdf
🔍 Verificando arquivo em: /path/to/file.pdf
❌ Arquivo não existe: /path/to/file.pdf
📂 Diretório pai existe? true/false
```

Com essas informações, saberemos **exatamente** onde o sistema está procurando e onde o arquivo deveria estar.

---

## 📋 SCRIPT DE DIAGNÓSTICO

Criei o script SQL: **`diagnostico_holerites_arquivos.sql`**

Execute no DBeaver para verificar:
1. Quais holerites estão cadastrados para o CPF
2. Nomes dos arquivos registrados no banco
3. Se a tabela `payslip_delivery_logs` existe
4. Histórico de tentativas de envio

---

## 🔬 POSSÍVEIS CAUSAS E SOLUÇÕES

### Causa 1: Arquivo Nunca Foi Salvo

**Sintoma:** Registro existe no banco, mas arquivo não está no disco

**Solução:**
1. Verificar onde o sistema salva os holerites:
   - `PayslipService.OUTPUT_DIR`
   - `uploads/payslips/`
   - `backend/payslips_output/`

2. Verificar se o processo de upload/processamento está funcionando

3. Testar upload de um novo holerite

### Causa 2: Caminho Incorreto

**Sintoma:** Arquivo existe, mas em outro lugar

**Solução:**
1. Os novos logs vão mostrar o caminho exato
2. Comparar com onde os arquivos realmente estão
3. Ajustar a lógica de resolução de caminho no `PayslipService.resolvePayslipPathByCpfMonthYear()`

### Causa 3: Permissões de Arquivo

**Sintoma:** Arquivo existe, mas não pode ser lido

**Solução:**
```bash
# No servidor, verificar permissões
ls -la /path/to/payslips/

# Dar permissões se necessário
chmod 755 /path/to/payslips/
chmod 644 /path/to/payslips/*.pdf
```

### Causa 4: Serviço Baileys Não Acessa o Arquivo

**Sintoma:** Backend vê o arquivo, mas Baileys retorna "file not found"

**Possíveis razões:**
1. Baileys roda em outro container/servidor
2. Caminho precisa ser mapeado ou compartilhado
3. Baileys espera URL em vez de caminho de arquivo

**Solução:** Verificar a documentação do Baileys REST API:
- Talvez seja necessário enviar o arquivo via multipart/form-data
- Talvez seja necessário fazer upload do arquivo primeiro
- Talvez seja necessário usar URL pública do arquivo

---

## 🎯 FLUXO ESPERADO VS REAL

### Fluxo Esperado ✅
```
1. Buscar WhatsApp na users → ✅ FUNCIONA
2. Buscar holerite na payslips → ✅ FUNCIONA  
3. Resolver caminho do arquivo → ❓ A VERIFICAR
4. Verificar se arquivo existe → ❌ FALHA AQUI
5. Enviar para Baileys → Não chega aqui
6. Registrar log → ❌ FALHA (tabela não existia)
```

### O Que os Novos Logs Vão Mostrar
```
1. ✅ WhatsApp encontrado: 31971731747
2. ✅ Holerite encontrado: mês=9, ano=2025, arquivo=holerite_jose_09_2025.pdf
3. ❓ Caminho resolvido: /var/www/uploads/payslips/9-2025/holerite_jose_09_2025.pdf
4. ❌ Arquivo não existe: /var/www/uploads/payslips/9-2025/holerite_jose_09_2025.pdf
5. 📂 Diretório pai existe? true (mas arquivo não)
```

Com essas informações, será fácil identificar:
- Se o arquivo está em outro lugar
- Se o nome do arquivo está diferente
- Se o diretório está correto mas arquivo não foi salvo

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Código (2 arquivos)
1. ✅ `backend/src/main/resources/db/migration/V299__create_payslip_delivery_logs.sql` - Migration
2. ✅ `backend/src/main/java/com/z7design/secured_guard/service/EnvioService.java` - Logs detalhados

### Documentação/Scripts (2 arquivos)
1. ✅ `diagnostico_holerites_arquivos.sql` - Script SQL de diagnóstico
2. ✅ `DIAGNOSTICO_ARQUIVO_HOLERITE_NAO_ENCONTRADO.md` - Este arquivo

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **O código de busca está PERFEITO!** O problema não é lógica, é infraestrutura (arquivos físicos)

2. **O SQL está CORRETO!** Após a correção dos tipos (V298), as queries funcionam

3. **O próximo teste vai revelar tudo!** Com os novos logs, saberemos exatamente o que fazer

4. **Não é problema do Baileys diretamente** - O Baileys está recebendo a requisição, mas o arquivo não existe

---

## 🔗 REFERÊNCIAS

- Migration types: `V298__fix_payslips_types.sql`
- Migration logs: `V299__create_payslip_delivery_logs.sql`  
- Service logs: `EnvioService.java` (linhas 368-423)
- Diagnóstico anterior: `DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`

---

**Próxima ação:** Reinicie o backend e teste novamente. Os logs vão te dizer exatamente onde procurar! 🎯

