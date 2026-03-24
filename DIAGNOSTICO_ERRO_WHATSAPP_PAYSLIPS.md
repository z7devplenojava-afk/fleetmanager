# Diagnóstico e Solução - Erro no Envio via WhatsApp

## 🔍 Problema Identificado

O erro que está ocorrendo é:

```
ERRO: operador não existe: character varying = integer
Dica: Nenhum operador corresponde ao nome e tipo de dados dos argumentos fornecidos.
```

### Causa Raiz

A tabela `payslips` foi criada inicialmente com os campos `month` e `year` como **VARCHAR**:

```sql
-- V52__create_payslips_table.sql
month VARCHAR(50) NOT NULL,
year VARCHAR(4) NOT NULL,
```

Porém, o model Java espera que esses campos sejam do tipo **INTEGER**:

```java
// Payslip.java
@Column(nullable = false)
private Integer month;

@Column(nullable = false)
private Integer year;
```

Quando o Spring Data JPA tenta executar a query:

```sql
SELECT * FROM payslips 
WHERE cpf = ? AND month = ? AND year = ?
```

O PostgreSQL recebe:
- `month` (VARCHAR no banco)
- Valor INTEGER passado pelo Java

Resultando no erro: **"character varying = integer"**

## ✅ Solução

### Opção 1: Aplicar a Migration Automática (Recomendado)

Criei a migration **V298__fix_payslips_types.sql** que será aplicada automaticamente ao reiniciar o backend:

```bash
# No Windows:
cd backend
mvn clean package
java -jar target/secured-guard-0.0.1-SNAPSHOT.jar

# Ou use o script de compilação:
compilar.bat
```

### Opção 2: Executar SQL Manual (Mais Rápido)

Execute o script SQL **verificar_whatsapp_e_payslips.sql** no DBeaver ou psql:

1. Abra o DBeaver e conecte ao banco de dados CI
2. Abra o arquivo `verificar_whatsapp_e_payslips.sql`
3. Execute todo o script (Ctrl+Enter ou botão "Execute")

O script irá:
1. ✅ Verificar os dados da tabela `users` (name, username/CPF, whatsapp)
2. ✅ Verificar a estrutura da tabela `payslips`
3. ✅ Corrigir automaticamente os tipos dos campos `month` e `year`
4. ✅ Validar a correção

## 📋 Validação da Tabela Users

O código já está buscando corretamente na tabela `users`:

```java
// EnvioService.java - Linha 334
Optional<User> userOpt = userRepository.findByUsername(cpf);

if (userOpt.isEmpty()) {
    detalhe.setErro("Usuário não encontrado na tabela users para CPF: " + cpf);
    return detalhe;
}

User user = userOpt.get();
String whatsappNumber = user.getWhatsapp();

if (whatsappNumber == null || whatsappNumber.trim().isEmpty()) {
    detalhe.setErro("WhatsApp não cadastrado na tabela users para CPF: " + cpf);
    return detalhe;
}

log.info("✅ WhatsApp encontrado para {} (CPF: {}): {}", 
        employee.getName(), cpf, whatsappNumber);
```

O problema não é na busca do WhatsApp na tabela `users`, mas sim na **query da tabela payslips** que ocorre depois.

## 🔬 Verificar no Banco

Execute a primeira query do script para verificar o usuário específico:

```sql
SELECT 
    u.id,
    u.name AS "Nome",
    u.username AS "CPF (username)",
    u.whatsapp AS "WhatsApp",
    u.email AS "Email"
FROM users u
WHERE u.username = '00824310608';
```

Resultado esperado:
```
| id | Nome | CPF (username) | WhatsApp | Email |
|----|------|----------------|----------|-------|
| ... | JOSE MARIO RAMOS | 00824310608 | 31971731747 | ... |
```

## 🚀 Após a Correção

Depois de aplicar a correção (migration ou SQL manual):

1. ✅ Reinicie o backend
2. ✅ Teste o envio via WhatsApp novamente
3. ✅ Verifique os logs - o erro SQL não deve mais aparecer

## 📊 Log de Sucesso Esperado

Após a correção, os logs devem mostrar:

```
2025-10-28 05:48:08 [http-nio-8081] INFO  EnvioService - ✅ WhatsApp encontrado para JOSE MARIO RAMOS (CPF: 00824310608): 31971731747
2025-10-28 05:48:08 [http-nio-8081] INFO  EnvioService - ✅ Holerite encontrado: setembro/2024
2025-10-28 05:48:08 [http-nio-8081] INFO  BaileysRestService - ✅ Arquivo enviado via WhatsApp para 5531971731747
```

## 🔗 Arquivos Criados

1. **backend/src/main/resources/db/migration/V298__fix_payslips_types.sql**
   - Migration automática que será aplicada ao reiniciar

2. **verificar_whatsapp_e_payslips.sql**
   - Script manual para diagnóstico e correção imediata

3. **DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md** (este arquivo)
   - Documentação completa do problema e solução

