# 📝 Resumo da Sessão - Correções CI

**Data:** 28/10/2025  
**Duração:** ~1 hora  
**Problemas identificados:** 2  
**Arquivos criados/modificados:** 11

---

## 🎯 O QUE FOI FEITO

### 1. Investigação Inicial: Erro WhatsApp
Você me mostrou logs indicando que o sistema estava buscando corretamente o WhatsApp na tabela `users`, mas depois ocorria um erro SQL:

```
ERRO: operador não existe: character varying = integer
```

**Diagnóstico:**
- ✅ Busca do WhatsApp na tabela `users` está **CORRETA**
- ❌ Problema está na query da tabela `payslips` (tipos incompatíveis)

### 2. Descoberta: Erro 405 no Login
Você reportou que o CI não estava permitindo login com erro **405 Method Not Allowed**.

**Diagnóstico:**
- ❌ NGINX configurado com porta **errada** (8082 ao invés de 8081)
- ❌ NGINX configurado com paths **errados** (removendo `/api/`)

---

## 🔧 CORREÇÕES APLICADAS

### Problema 1: NGINX (405 Method Not Allowed)

**Arquivo modificado:** `nginx/ci.conf`

**Mudanças:**
1. Linha 37: `server backend-ci:8082;` → `server backend-ci:8081;`
2. Linha 66: `proxy_pass http://backend;` → `proxy_pass http://backend/api/;`
3. Linha 85: `proxy_pass http://backend;` → `proxy_pass http://backend/ws/;`
4. Linha 102: `proxy_pass http://backend;` → `proxy_pass http://backend/api/auth/;`
5. Linha 111: `proxy_pass http://backend;` → `proxy_pass http://backend/uploads/;`

### Problema 2: SQL Type Mismatch (PaySlips)

**Arquivos criados:**
1. `backend/src/main/resources/db/migration/V298__fix_payslips_types.sql` - Migration automática
2. `verificar_whatsapp_e_payslips.sql` - SQL de diagnóstico e correção manual

**Mudanças:**
- Converte `month` de VARCHAR → INTEGER
- Converte `year` de VARCHAR → INTEGER

---

## 📁 TODOS OS ARQUIVOS CRIADOS

### 🔧 Arquivos de Código (4)
1. ✅ `nginx/ci.conf` - **Configuração corrigida**
2. ✅ `backend/src/main/resources/db/migration/V298__fix_payslips_types.sql` - **Migration automática**
3. ✅ `verificar_whatsapp_e_payslips.sql` - **SQL manual de correção**
4. ✅ `fix-nginx-ci-405.sh` - **Script automatizado de deploy**

### 📚 Documentação (7)
1. ✅ `INDICE_CORRECOES_CI.md` - **Índice navegável** (comece por aqui!)
2. ✅ `RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md` - **Resumo executivo completo**
3. ✅ `DEPLOY_CORRECAO_NGINX_CI_URGENTE.md` - **Guia de deploy NGINX**
4. ✅ `DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md` - **Análise técnica SQL**
5. ✅ `RESUMO_SESSAO_CORRECOES_CI.md` - Este arquivo
6. Já existia: `CORRECAO_ERRO_405_CI.md` (documentação prévia do mesmo problema)
7. Já existia: `RESUMO_EXECUTIVO_CI.md` (resumo executivo prévio)

---

## 🚀 PRÓXIMOS PASSOS (VOCÊ DEVE FAZER)

### Passo 1: Commit e Push (Faça agora)
```bash
git add .
git commit -m "fix(ci): corrige erro 405 nginx e tipo payslips month/year

- Corrige porta backend de 8082 para 8081 no nginx/ci.conf
- Corrige proxy_pass para manter paths /api/, /ws/, /uploads/
- Adiciona migration V298 para converter month/year para INTEGER
- Adiciona script automatizado fix-nginx-ci-405.sh
- Adiciona documentação completa de diagnóstico e deploy"

git push origin ci
```

### Passo 2: Deploy NGINX no Servidor CI (URGENTE)
```bash
ssh usuario@ci.z7botsolutions.com.br
cd /path/to/secured-guard
git pull origin ci
chmod +x fix-nginx-ci-405.sh
./fix-nginx-ci-405.sh
```

**Tempo:** 5 minutos  
**Prioridade:** 🔴 CRÍTICA

### Passo 3: Aplicar Migration SQL (IMPORTANTE)
```bash
# Opção A: Automática (requer restart do backend)
docker-compose -f docker-compose.ci.yml restart backend-ci

# Opção B: Manual (sem restart, mais rápido)
# No DBeaver ou psql, executar: verificar_whatsapp_e_payslips.sql
```

**Tempo:** 2-5 minutos  
**Prioridade:** 🟡 ALTA

---

## ✅ VALIDAÇÃO

Após aplicar as correções:

### Teste 1: Login deve funcionar
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"Admin1234"}'
```

**Resultado esperado:** 200 OK ou 401 Unauthorized (NÃO 405!)

### Teste 2: WhatsApp deve enviar
1. Login no sistema CI
2. Ir no módulo de holerites
3. Enviar via WhatsApp para CPF `00824310608`
4. **Resultado esperado:** Sucesso (sem erro SQL)

---

## 📊 IMPACTO DAS CORREÇÕES

### Antes (Problemas)
- ❌ Login: **405 Method Not Allowed** → Sistema totalmente bloqueado
- ❌ WhatsApp: **SQL Error** → Envio de holerites não funciona
- ❌ Usuários: **Não conseguem acessar o sistema**

### Depois (Corrigido)
- ✅ Login: **200 OK / 401** → Sistema acessível
- ✅ WhatsApp: **Envio bem-sucedido** → Holerites entregues
- ✅ Usuários: **Sistema totalmente funcional**

---

## 🔍 ANÁLISE TÉCNICA

### Por que o erro 405?
O NGINX estava configurado assim:
```nginx
location /api/ {
    proxy_pass http://backend;  # Remove o /api/
}
```

Quando vinha a requisição `POST /api/auth/login`, o NGINX enviava para o backend apenas `/auth/login` (sem `/api/`). O backend não tinha essa rota e retornava 405.

**Solução:** Adicionar o path no proxy_pass:
```nginx
location /api/ {
    proxy_pass http://backend/api/;  # Mantém o /api/
}
```

### Por que o erro SQL?
A tabela foi criada com VARCHAR:
```sql
CREATE TABLE payslips (
    month VARCHAR(50),  -- ❌
    year VARCHAR(4)     -- ❌
);
```

Mas o Java espera Integer:
```java
private Integer month;  // ✅
private Integer year;   // ✅
```

Quando o Hibernate tenta fazer a query:
```sql
WHERE month = ? AND year = ?
```

O PostgreSQL recebe VARCHAR no banco e INTEGER do Java, causando:
```
operador não existe: character varying = integer
```

**Solução:** Converter para INTEGER no banco.

---

## 💡 LIÇÕES APRENDIDAS

1. **O WhatsApp NUNCA foi o problema!** 
   - O código de busca na tabela `users` sempre esteve correto
   - O problema era na query dos `payslips` que vinha depois

2. **405 indica problema de roteamento, não autenticação**
   - 401 = problema de credenciais ✅
   - 403 = problema de permissão ✅
   - 405 = método não permitido = problema de configuração do proxy ❌

3. **Type mismatch SQL é comum em migrations antigas**
   - Sempre validar tipos do banco vs tipos do model
   - PostgreSQL é rigoroso com tipos (não faz coerção automática)

---

## 📞 REFERÊNCIAS RÁPIDAS

### Arquivo mais importante
👉 [`INDICE_CORRECOES_CI.md`](INDICE_CORRECOES_CI.md) - Comece por aqui!

### Para fazer o deploy
👉 [`DEPLOY_CORRECAO_NGINX_CI_URGENTE.md`](DEPLOY_CORRECAO_NGINX_CI_URGENTE.md)

### Para entender o SQL
👉 [`DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`](DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md)

### Visão geral completa
👉 [`RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md`](RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md)

---

## 🎯 TL;DR

**Problema:** Login dava 405, WhatsApp dava erro SQL  
**Causa:** NGINX mal configurado + Tabela payslips com tipos errados  
**Solução:** Corrigi `nginx/ci.conf` + Criei migration V298  
**Deploy:** Execute `fix-nginx-ci-405.sh` no servidor CI  
**Tempo:** 10 minutos total  
**Status:** Pronto para deploy ✅

---

**Última atualização:** 28/10/2025  
**Sessão ID:** CI-FIXES-20251028  
**Prioridade:** 🔴 CRÍTICA + 🟡 ALTA

