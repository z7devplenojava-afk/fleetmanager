# 📑 Índice de Correções - Ambiente CI

**Data:** 28/10/2025  
**Status:** Correções aplicadas, aguardando deploy

---

## 🎯 INÍCIO RÁPIDO

### Problema 1: Erro 405 no Login (CRÍTICO)
**Ação:** Executar no servidor CI:
```bash
git pull origin ci && ./fix-nginx-ci-405.sh
```
**Tempo:** 5 minutos  
**Leia:** [`DEPLOY_CORRECAO_NGINX_CI_URGENTE.md`](DEPLOY_CORRECAO_NGINX_CI_URGENTE.md)

### Problema 2: Erro SQL no WhatsApp (IMPORTANTE)
**Ação:** Executar no DBeaver/psql:
```sql
-- Ver arquivo: verificar_whatsapp_e_payslips.sql
ALTER TABLE payslips ALTER COLUMN month TYPE INTEGER USING month::integer;
ALTER TABLE payslips ALTER COLUMN year TYPE INTEGER USING year::integer;
```
**Tempo:** 2 minutos  
**Leia:** [`DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`](DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md)

---

## 📚 DOCUMENTAÇÃO COMPLETA

### 📊 Visão Geral
| Arquivo | Propósito | Prioridade |
|---------|-----------|-----------|
| [`RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md`](RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md) | **Resumo executivo completo** | 🔴 LER PRIMEIRO |
| Este arquivo | Índice de navegação | 📑 Referência |

### 🔧 Problema 1: NGINX 405 Method Not Allowed

#### Arquivos de Código
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `nginx/ci.conf` | Config | **Configuração corrigida do NGINX** |
| `fix-nginx-ci-405.sh` | Script | **Script automatizado de correção** |

#### Documentação
| Arquivo | Descrição |
|---------|-----------|
| [`DEPLOY_CORRECAO_NGINX_CI_URGENTE.md`](DEPLOY_CORRECAO_NGINX_CI_URGENTE.md) | **Guia completo de deploy** (3 opções) |
| [`CORRECAO_ERRO_405_CI.md`](CORRECAO_ERRO_405_CI.md) | Análise técnica detalhada |
| [`RESUMO_EXECUTIVO_CI.md`](RESUMO_EXECUTIVO_CI.md) | Resumo executivo original |

### 🗄️ Problema 2: SQL Type Mismatch (PaySlips)

#### Arquivos de Código
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `backend/src/main/resources/db/migration/V298__fix_payslips_types.sql` | Migration | **Migration automática** |
| `verificar_whatsapp_e_payslips.sql` | SQL | **Script de diagnóstico e correção manual** |

#### Documentação
| Arquivo | Descrição |
|---------|-----------|
| [`DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`](DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md) | **Documentação técnica completa** |

---

## 🔍 NAVEGAÇÃO POR TAREFA

### Quero fazer o deploy do NGINX
1. 📖 Leia: [`DEPLOY_CORRECAO_NGINX_CI_URGENTE.md`](DEPLOY_CORRECAO_NGINX_CI_URGENTE.md)
2. 🔧 Use o arquivo: `nginx/ci.conf`
3. 🤖 Execute o script: `fix-nginx-ci-405.sh`

### Quero corrigir o erro SQL do WhatsApp
1. 📖 Leia: [`DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`](DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md)
2. 🗄️ Execute o SQL: `verificar_whatsapp_e_payslips.sql`
3. 🔄 OU deixe a migration: `V298__fix_payslips_types.sql` aplicar automaticamente

### Quero entender o contexto completo
1. 📊 Leia: [`RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md`](RESUMO_PROBLEMA_CI_405_E_WHATSAPP.md)

### Quero apenas saber o que fazer
**NGINX (Urgente):**
```bash
ssh usuario@ci.z7botsolutions.com.br
cd /path/to/secured-guard
git pull origin ci
chmod +x fix-nginx-ci-405.sh
./fix-nginx-ci-405.sh
```

**SQL (Importante):**
```bash
# No DBeaver, executar arquivo: verificar_whatsapp_e_payslips.sql
```

---

## 📋 CHECKLIST DE DEPLOY

### Etapa 1: NGINX (CRÍTICO - Faça primeiro!)
- [ ] Conectar ao servidor CI
- [ ] Pull das mudanças: `git pull origin ci`
- [ ] Executar script: `./fix-nginx-ci-405.sh`
- [ ] Testar login: https://ci.z7botsolutions.com.br
- [ ] ✅ Deve retornar 200/401, NÃO 405

### Etapa 2: Migration PaySlips (IMPORTANTE - Pode esperar)
- [ ] Conectar ao banco CI
- [ ] Executar: `verificar_whatsapp_e_payslips.sql`
- [ ] Verificar tipos: `month` e `year` devem ser `integer`
- [ ] Testar envio via WhatsApp no sistema
- [ ] ✅ Não deve mais dar erro SQL

### Validação Final
- [ ] Login funciona (sem 405)
- [ ] WhatsApp envia corretamente
- [ ] Backend responde em 8081
- [ ] Logs sem erros críticos

---

## 🚨 TROUBLESHOOTING RÁPIDO

### Ainda retorna 405 após correção NGINX?
1. Verificar se o backend está rodando: `docker ps | grep backend-ci`
2. Verificar logs: `docker logs secured-guard-backend-ci --tail 50`
3. Testar direto no backend: `curl http://localhost:8081/api/health`
4. Verificar Cloudflare (pode estar cacheando/bloqueando)

### Ainda erro SQL após migration?
1. Verificar tipos: 
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'payslips' AND column_name IN ('month', 'year');
   ```
2. Deve retornar `integer`, não `character varying`
3. Se ainda VARCHAR, executar manualmente o ALTER TABLE

### Backend não inicia?
1. Verificar logs: `docker logs secured-guard-backend-ci -f`
2. Verificar banco: `docker ps | grep postgres`
3. Verificar migrations pendentes nos logs

---

## 📊 RESUMO DOS PROBLEMAS

| Problema | Causa | Correção | Arquivo Principal |
|----------|-------|----------|-------------------|
| **405 Login** | NGINX com porta e paths errados | Corrigir `nginx/ci.conf` | [`DEPLOY_CORRECAO_NGINX_CI_URGENTE.md`](DEPLOY_CORRECAO_NGINX_CI_URGENTE.md) |
| **SQL WhatsApp** | Tabela payslips com VARCHAR ao invés de INTEGER | Migration V298 ou SQL manual | [`DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md`](DIAGNOSTICO_ERRO_WHATSAPP_PAYSLIPS.md) |

---

## 🎯 ORDEM RECOMENDADA

1. **Primeiro:** Corrigir NGINX (5 min) - Sistema volta a funcionar
2. **Depois:** Aplicar migration SQL (2 min) - WhatsApp volta a funcionar
3. **Por último:** Validar tudo está OK

**Tempo total:** ~10 minutos

---

## 📞 INFORMAÇÕES ADICIONAIS

- **Ambiente:** CI (ci.z7botsolutions.com.br)
- **Backend:** secured-guard-backend-ci (porta 8081)
- **Banco:** secured_guard_ci
- **Branch:** ci

---

**Última atualização:** 28/10/2025  
**Autor:** AI Assistant  
**Prioridade:** 🔴 CRÍTICA (NGINX) + 🟡 ALTA (SQL)

