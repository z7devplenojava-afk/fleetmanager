# 📋 Configuração do Flyway por Ambiente

## 🎯 Resumo das Mudanças

### ✅ Alterações Realizadas

1. **application-test.properties** → Otimizado para desenvolvimento/teste
2. **application-prod.properties** → Configuração segura para produção
3. **application-dev.properties** → Documentado (Flyway desabilitado, usa JPA)

---

## 📊 Comparação entre Ambientes

| Configuração | DEV | TEST | PROD | Descrição |
|-------------|-----|------|------|-----------|
| **enabled** | ❌ false | ✅ true | ✅ true | Flyway ativo |
| **clean-disabled** | N/A | ❌ false | ✅ true | Proteção contra apagar banco |
| **out-of-order** | N/A | ✅ true | ❌ false | Permite migrações fora de ordem |
| **validate-on-migrate** | N/A | ❌ false | ✅ true | Valida checksums |
| **baseline-on-migrate** | N/A | ✅ true | ✅ true | Suporta banco existente |
| **ignore-missing-migrations** | N/A | ✅ true | ❌ false | Ignora migrações removidas |
| **ignore-future-migrations** | N/A | ✅ true | ❌ false | Ignora migrações futuras |

---

## 🔧 Ambiente DEV (Desenvolvimento Local)

### Arquivo: `application-dev.properties`

```properties
# Flyway DESABILITADO
spring.flyway.enabled=false

# JPA cria/atualiza tabelas automaticamente
spring.jpa.hibernate.ddl-auto=update
```

### 💡 Por que assim?

- **Mais rápido:** JPA cria tabelas automaticamente baseado nas entidades
- **Mais simples:** Não precisa criar arquivos de migração para cada mudança
- **Ideal para:** Prototipagem rápida e desenvolvimento local

### ⚠️ Desvantagens:

- Não mantém histórico de alterações
- Pode gerar DDL diferente entre ambientes
- Menos controle sobre o schema

### 🔄 Como habilitar Flyway em DEV:

1. Descomentar as configurações no arquivo
2. Mudar `spring.jpa.hibernate.ddl-auto=validate`
3. Executar migrações pendentes

---

## 🧪 Ambiente TEST (Testes e Homologação)

### Arquivo: `application-test.properties`

```properties
# ✅ CONFIGURAÇÃO OTIMIZADA PARA DESENVOLVIMENTO/TESTE

spring.flyway.enabled=true                        # Ativa o Flyway
spring.flyway.locations=classpath:db/migration    # Localização das migrações
spring.flyway.clean-disabled=false                # Permite flyway:clean (reset)
spring.flyway.out-of-order=true                   # ⭐ Permite fora de ordem
spring.flyway.validate-on-migrate=false           # ⭐ Não valida checksums
spring.flyway.baseline-on-migrate=true            # Suporta banco existente
spring.flyway.baseline-version=1                  # Versão inicial
spring.flyway.ignore-missing-migrations=true      # ⭐ Ignora removidas
spring.flyway.ignore-future-migrations=true       # ⭐ Ignora futuras
```

### 💡 Por que assim?

#### ✅ `out-of-order=true`
**Cenário em equipe:**
```
DEV 1: Cria V230__feature_a.sql (aplica no banco)
DEV 2: Cria V229__feature_b.sql (depois)

Sem out-of-order:
❌ V229 é ignorada (banco já tem V230)

Com out-of-order:
✅ V229 é executada mesmo sendo "anterior" a V230
```

#### ✅ `validate-on-migrate=false`
**Cenário comum:**
```sql
-- V226__create_vehicle_maintenances.sql (original)
CREATE TABLE vehicle_maintenances (...);

-- Você adiciona um comentário ou ajusta
CREATE TABLE vehicle_maintenances (...);  -- Ajuste

Sem validate:
✅ Aceita a mudança, continua normalmente

Com validate:
❌ ERRO: "Migration checksum mismatch"
```

#### ✅ `ignore-missing-migrations=true`
**Cenário de refatoração:**
```
Código tinha:
V100, V101, V102, V103

Após limpeza:
V100, V102, V103 (V101 foi removida)

Sem ignore:
❌ ERRO: "Missing migration V101"

Com ignore:
✅ Continua normalmente
```

#### ✅ `ignore-future-migrations=true`
**Cenário de rollback:**
```
Banco tem: V1, V2, V3, V4
Código tem: V1, V2, V3 (rollback do V4)

Sem ignore:
❌ ERRO: "Detected future migration V4"

Com ignore:
✅ Continua trabalhando normalmente
```

### 🎯 Ideal para:

- ✅ Desenvolvimento em equipe
- ✅ Ambiente de testes
- ✅ Homologação
- ✅ Pode fazer reset do banco (`flyway:clean`)

---

## 🔒 Ambiente PROD (Produção)

### Arquivo: `application-prod.properties`

```properties
# ⚠️ CONFIGURAÇÃO SEGURA E RIGOROSA PARA PRODUÇÃO

spring.flyway.enabled=true                        # Ativa o Flyway
spring.flyway.locations=classpath:db/migration    # Localização das migrações
spring.flyway.clean-disabled=true                 # ⚠️ BLOQUEIA flyway:clean
spring.flyway.out-of-order=false                  # ⚠️ Somente em ordem
spring.flyway.validate-on-migrate=true            # ⚠️ Valida checksums
spring.flyway.baseline-on-migrate=true            # Suporta banco existente
spring.flyway.baseline-version=1                  # Versão inicial
spring.flyway.ignore-missing-migrations=false     # ⚠️ Falha se faltar migração
spring.flyway.ignore-future-migrations=false      # ⚠️ Falha se migração futura
```

### 💡 Por que assim?

#### ⚠️ `clean-disabled=true`
**Proteção crítica:**
```bash
# Sem proteção (clean-disabled=false):
$ flyway clean
❌ TODO O BANCO DE PRODUÇÃO É APAGADO!

# Com proteção (clean-disabled=true):
$ flyway clean
✅ ERRO: "Unable to execute clean as it has been disabled"
```

#### ⚠️ `out-of-order=false`
**Controle rigoroso:**
```
Deploy deve ser linear e sequencial:
V230 → V231 → V232 → V233

Não permite "pular" ou executar fora de ordem
Garante que todos seguem o mesmo fluxo
```

#### ⚠️ `validate-on-migrate=true`
**Detecta alterações:**
```sql
-- Se alguém modificou um arquivo de migração:
❌ ERRO: "Migration checksum mismatch"

Evita que migrações sejam alteradas acidentalmente
Garante integridade do histórico
```

#### ⚠️ `ignore-missing-migrations=false`
**Detecta arquivos faltando:**
```
Se uma migração V230 foi removida do código:
❌ ERRO: "Missing migration V230"

Garante que todos os arquivos estão presentes
Evita deploy incompleto
```

#### ⚠️ `ignore-future-migrations=false`
**Detecta rollback acidental:**
```
Banco está em V250
Código tem apenas até V240

❌ ERRO: "Detected future migration"

Evita deploy de versão antiga sobre versão nova
```

### 🎯 Ideal para:

- ✅ Máxima segurança
- ✅ Controle rigoroso
- ✅ Auditoria completa
- ✅ Zero tolerância a erros

---

## 🚀 Como Executar as Migrações

### Para Ambiente TEST (atual):

```powershell
# Opção 1: Script automatizado
.\executar_migrations_flyway.ps1

# Opção 2: Maven direto
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=test

# Verificar resultado
.\verificar_migrations.ps1
```

### O que acontece:

1. Spring Boot inicia com perfil `test`
2. Flyway conecta ao banco `secured_guard_test`
3. Verifica tabela `flyway_schema_history`
4. Identifica migrações pendentes (V226, V227, V228, etc.)
5. Executa em ordem (ou fora de ordem se `out-of-order=true`)
6. Registra no histórico
7. Backend inicia normalmente

---

## 📝 Boas Práticas

### ✅ DO (Fazer):

1. **Sempre testar migrações em TEST antes de PROD**
2. **Usar baseline para bancos existentes**
3. **Numerar migrações sequencialmente** (V230, V231, V232...)
4. **Documentar o que cada migração faz**
5. **Fazer backup antes de migrar em PROD**
6. **Usar transações nas migrações** (BEGIN/COMMIT)
7. **Testar rollback quando possível**

### ❌ DON'T (Não fazer):

1. **Modificar migrações já aplicadas em PROD**
2. **Remover arquivos de migração do repositório**
3. **Pular números de versão arbitrariamente**
4. **Executar `flyway:clean` em PROD**
5. **Ignorar erros de checksum em PROD**
6. **Usar `ddl-auto=update` em PROD**
7. **Aplicar migrações sem revisar**

---

## 🔍 Comandos de Verificação

### Histórico do Flyway:
```sql
SELECT 
    version,
    description,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 20;
```

### Verificar tabelas criadas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Ver migrações pendentes:
```powershell
cd backend
mvn flyway:info -Dflyway.configFiles=src/main/resources/application-test.properties
```

---

## 📚 Documentação Oficial

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Flyway Spring Boot](https://flywaydb.org/documentation/usage/plugins/springboot)
- [Flyway Configuration](https://flywaydb.org/documentation/configuration/parameters)

---

## ✨ Resumo Final

| Ambiente | Flyway | Filosofia | Uso |
|----------|--------|-----------|-----|
| **DEV** | ❌ OFF | Rapidez | JPA cria tudo |
| **TEST** | ✅ ON (Flexível) | Equilíbrio | Testa migrações |
| **PROD** | ✅ ON (Rigoroso) | Segurança | Deploy controlado |

---

**Última Atualização:** 2025-10-16  
**Configurações Atualizadas:** ✅ application-test.properties, application-prod.properties, application-dev.properties

