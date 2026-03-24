# 🚀 Deploy da Correção do Erro 405 via GitHub Actions

## 📋 O que foi alterado

1. ✅ **docker-compose.ci.yml** - Labels do Traefik corrigidas
2. ✅ **deploy-ci-only.yml** - Workflow atualizado com validação do erro 405

## 🎯 Como fazer o deploy

### Opção 1: Push para branch `ci` (Automático)

```bash
# Commitar as alterações
git add docker-compose.ci.yml .github/workflows/deploy-ci-only.yml
git commit -m "fix: corrigir erro 405 no login CI (Traefik CORS)"

# Push para a branch ci
git push origin main:ci
```

O GitHub Actions vai:
1. ✅ Fazer build do backend e frontend
2. ✅ Criar imagens Docker
3. ✅ Fazer push para Docker Hub
4. ✅ Transferir arquivos para o VPS
5. ✅ Recriar containers com `--force-recreate` (aplica novas labels)
6. ✅ Validar que o erro 405 foi corrigido
7. ✅ Confirmar que o endpoint de login está funcionando

### Opção 2: Trigger Manual (Workflow Dispatch)

1. Acesse: https://github.com/seu-usuario/secured-guard/actions
2. Clique em "🐳 Deploy CI Environment Only"
3. Clique em "Run workflow"
4. Selecione branch `ci`
5. Clique em "Run workflow"

## 🔍 Acompanhar o Deploy

### No GitHub Actions:

1. Acesse: https://github.com/seu-usuario/secured-guard/actions
2. Clique no workflow em execução
3. Acompanhe os logs em tempo real

### Logs importantes:

```
🚀 Start CI containers
  ✅ Containers CI iniciados!

🏥 Health check
  ✅ Health check passou! Aplicação CI está respondendo.

🧪 Validate 405 fix
  HTTP Code recebido: 401
  ✅ Endpoint de login respondendo corretamente!
  ✅ Erro 405 foi corrigido com sucesso!

🎉 CI Deployment successful
  ✅ DEPLOY CI CONCLUÍDO COM SUCESSO!
  ✅ Erro 405 corrigido e validado
```

## ✅ Validação Pós-Deploy

### 1. Testar no navegador

1. Acesse: https://ci.z7botsolutions.com.br
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. Verifique que não há mais erro 405

### 2. Testar via curl

```bash
# Teste de preflight (OPTIONS)
curl -X OPTIONS https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Teste de login (POST)
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ci.z7botsolutions.com.br" \
  -d '{"username":"test","password":"test"}' \
  -v
```

**Resposta esperada:**
- ✅ HTTP 401 (credenciais inválidas) ou HTTP 200 (sucesso)
- ❌ Não deve retornar HTTP 405

### 3. Verificar logs no servidor

```bash
# SSH no servidor
ssh usuario@ci.z7botsolutions.com.br

# Ver logs do backend
docker logs secured-guard-backend-ci --tail 100 -f

# Ver logs do Traefik
docker logs traefik --tail 100 -f
```

## 🔄 Rollback (se necessário)

Se algo der errado, você pode fazer rollback:

```bash
# Reverter commit
git revert HEAD

# Push para ci
git push origin main:ci
```

Ou manualmente no servidor:

```bash
# SSH no servidor
ssh usuario@ci.z7botsolutions.com.br

# Restaurar backup
cd /var/www/secured_guard/ci
cp docker-compose.ci.yml.backup docker-compose.ci.yml

# Recriar containers
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

## 📊 Checklist de Deploy

- [ ] Commit das alterações feito
- [ ] Push para branch `ci` executado
- [ ] GitHub Actions iniciou automaticamente
- [ ] Build do backend concluído
- [ ] Build do frontend concluído
- [ ] Imagens Docker criadas e enviadas
- [ ] Containers recriados no servidor
- [ ] Health check passou
- [ ] Validação do erro 405 passou
- [ ] Login no frontend funciona
- [ ] Sem erros 405 no console do navegador

## 🎯 Resultado Esperado

Após o deploy bem-sucedido:

```
✅ POST /api/auth/login → HTTP 200/401 (não mais 405)
✅ OPTIONS /api/auth/login → HTTP 204
✅ CORS headers corretos nas respostas
✅ Login no frontend funcionando perfeitamente
✅ GitHub Actions com todos os checks verdes
```

## 🚨 Troubleshooting

### Se o workflow falhar no "Validate 405 fix":

1. Verifique os logs do Traefik no servidor
2. Confirme que o container backend-ci foi recriado
3. Teste manualmente o endpoint

### Se o health check falhar:

1. Verifique se o banco de dados está rodando
2. Verifique logs do backend
3. Confirme que as variáveis de ambiente estão corretas

### Se ainda retornar 405 após deploy:

1. SSH no servidor
2. Execute manualmente:
   ```bash
   cd /var/www/secured_guard/ci
   docker-compose down
   docker-compose up -d --force-recreate
   ```

---

**Data:** 29/10/2025  
**Método:** GitHub Actions (Automático)  
**Tempo estimado:** 5-10 minutos  
**Prioridade:** 🔴 CRÍTICA
