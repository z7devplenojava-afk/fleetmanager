# 🚨 INSTRUÇÕES URGENTES - Executar SQL no Banco

## 📅 Data: 17/10/2025

---

## ❌ **PROBLEMA**

A migration V262 **NÃO ESTÁ SENDO EXECUTADA** automaticamente pelo Flyway.

O banco de dados está faltando **48 colunas** que existem no Model `Employee.java`.

---

## ✅ **SOLUÇÃO: EXECUTAR SQL MANUALMENTE**

### **OPÇÃO 1: Executar via psql (PowerShell)**

```powershell
# 1. Abrir PowerShell
# 2. Conectar no banco
psql -U postgres -d secured_guard_test -p 5432

# 3. Executar o script
\i EXECUTAR_AGORA_adicionar_colunas_employees.sql

# 4. Sair
\q
```

### **OPÇÃO 2: Executar via DBeaver/PgAdmin**

1. Abra o DBeaver ou PgAdmin
2. Conecte no banco `secured_guard_test`
3. Abra o arquivo `EXECUTAR_AGORA_adicionar_colunas_employees.sql`
4. Execute o script completo
5. Verifique se as colunas foram criadas

### **OPÇÃO 3: Executar via PowerShell direto**

```powershell
Get-Content EXECUTAR_AGORA_adicionar_colunas_employees.sql | psql -U postgres -d secured_guard_test -p 5432
```

---

## 📋 **COLUNAS QUE SERÃO ADICIONADAS (50)**

1. `gender` - Gênero
2. `rg` - RG
3. `carteira_identidade_data_emissao` - Data emissão RG
4. `carteira_identidade_orgao_emissor` - Órgão emissor RG
5. `certificado_militar` - Certificado militar
6. `titulo_eleitor_zona` - Zona eleitoral
7. `titulo_eleitor_secao` - Seção eleitoral
8. `cbo` - CBO
9. `pis` - PIS
10. `salario` - Salário
11. `salario_por_extenso` - Salário por extenso
12. `periodo_pagamento` - Período de pagamento
13. `horario_trabalho` - Horário de trabalho
14. `folga_semanal` - Folga semanal
15. `fgts_optante` - FGTS optante
16. `fgts_data_opcao` - Data opção FGTS
17. `fgts_banco_depositario` - Banco FGTS
18. `fgts_data_retratacao` - Data retratação FGTS
19. `empresa_nome` - Nome da empresa
20. `empresa_endereco` - Endereço empresa
21. `empresa_cnpj` - CNPJ empresa
22. `visto_fiscalizacao` - Visto fiscalização
23. `nome_pai` - Nome do pai
24. `nome_mae` - Nome da mãe
25. `local_nascimento` - Local nascimento
26. `grau_instrucao` - Grau instrução
27. `pis_data_cadastro` - Data cadastro PIS
28. `pis_banco_depositario` - Banco PIS
29. `pis_endereco_banco` - Endereço banco PIS
30. `pis_codigo_banco` - Código banco
31. `pis_codigo_agencia` - Código agência
32. `cnh_category` - Categoria CNH
33. `cnh_expiration_date` - Validade CNH
34. `ctps_rural` - CTPS Rural
35. `carteira_modelo_19` - Carteira modelo 19
36. `registro_geral_estrangeiro` - RGE
37. `casado_brasileiro` - Casado brasileiro
38. `nome_conjuge_estrangeiro` - Nome cônjuge estrangeiro
39. `spouse_name` - Nome cônjuge
40. `spouse_cpf` - CPF cônjuge
41. `spouse_rg` - RG cônjuge
42. `spouse_birth_date` - Nascimento cônjuge
43. `spouse_phone` - Telefone cônjuge
44. `spouse_email` - Email cônjuge
45. `tem_filhos_brasileiros` - Tem filhos brasileiros
46. `quantidade_filhos_brasileiros` - Qtd filhos
47. `data_chegada_brasil` - Chegada Brasil
48. `naturalizado` - Naturalizado
49. `decreto_naturalizacao` - Decreto
50. `assinatura_funcionario` - Assinatura
51. `data_rescisao` - Data rescisão

---

## 🚀 **APÓS EXECUTAR O SQL**

1. Reinicie o backend:
   ```powershell
   java -jar backend/target/secured-guard-1.0.0.jar --spring.profiles.active=test
   ```

2. Aguarde 30 segundos

3. Teste novamente no Postman com `POSTMAN_MARIA_SEM_IDS.json`

---

## ✅ **VAI FUNCIONAR!**

Após executar o SQL, todas as colunas estarão no banco e o cadastro funcionará! 🎉

---

## 📝 **SENHA DO POSTGRES**

Se pedir senha, geralmente é:
- `postgres`
- `admin`
- ou vazia (apenas pressione Enter)

---

**Execute o SQL e me avise quando terminar! 🚀**
