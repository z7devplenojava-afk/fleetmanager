# 🚨 Resumo Executivo: Erro 405 no Login CI

## Problema

```
❌ POST https://ci.z7botsolutions.com.br/api/auth/login
❌ Status: 405 Not Allowed
❌ Server: nginx/1.29.2
```

## Causa Raiz

O proxy reverso (NGINX ou Traefik) no servidor CI está bloqueando requisições POST para `/api/auth/login`.

## Arquivos Corrigidos

### 1. `deploy/nginx/nginx-ci.conf`
- ✅ Adicionado suporte a método POST
- ✅ Configurado CORS adequadamente
- ✅ Rate limiting mais permissivo (burst=20)
- ✅ Headers CORS com `always` flag
- ✅ Tratamento de preflight OPTIONS

### 2. Scripts Criados

- ✅ `TROUBLESHOOTING_CI_LOGIN_405.md` - Guia completo de troubleshooting
- ✅ `fix-ci-login-405.sh` - Script automático de correção

## Ação Necessária no Servidor CI

### Opção 1: Script Automático (Recomendado)

```bash
# No servidor CI
cd /var/www/secured_guard
bash fix-ci-login-405.sh
```

### Opção 2: Manual

```bash
# No servidor CI
cd /var/www/secured_guard/deploy

# Recarregar NGINX
docker exec secured-guard-nginx-ci nginx -t
docker exec secured-guard-nginx-ci nginx -s reload

# OU reiniciar container
docker restart secured-guard-nginx-ci
```

## Verificação

Após aplicar a correção, testar:

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"sua_senha"}'
```

**Resposta esperada:** HTTP 401 (credenciais inválidas) ou HTTP 200 (sucesso)
**NÃO deve retornar:** HTTP 405

## Status

- ✅ Código corrigido localmente
- ⏳ Aguardando deploy no servidor CI
- ⏳ Aguardando teste de validação

## Próximos Passos

1. Fazer SSH no servidor CI
2. Executar `fix-ci-login-405.sh`
3. Testar login no frontend
4. Confirmar correção

---

**Data:** 28/10/2025
**Prioridade:** 🔴 ALTA
**Impacto:** Login bloqueado no ambiente CI
