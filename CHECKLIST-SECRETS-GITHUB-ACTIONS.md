# ✅ Checklist: Secrets do GitHub Actions

## 🔐 Secrets Obrigatórios para Deploy CI

Verifique se TODOS estes secrets estão configurados em:
`https://github.com/zemarioramos/secured-guard/settings/secrets/actions`

### ✅ Secrets Já Configurados:
- ✅ `USER_GITHUB` = zemarioramos
- ✅ `TOKEN_GITHUB` = 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

### ⚠️ Secrets Necessários (Verificar se estão configurados):

1. **`DOCKER_USERNAME`**
   - Descrição: Usuário do Docker Hub
   - Exemplo: `z7design`

2. **`DOCKER_PASSWORD`**
   - Descrição: Senha do Docker Hub
   - Exemplo: `sua_senha_docker_hub`

3. **`VPS_HOST`**
   - Descrição: IP ou hostname da VPS
   - Exemplo: `185.225.233.18`

4. **`VPS_USER`**
   - Descrição: Usuário SSH da VPS
   - Exemplo: `securedguard`

5. **`VPS_PASSWORD`**
   - Descrição: Senha SSH da VPS
   - Exemplo: `sua_senha_ssh`

6. **`POSTGRES_PASSWORD_CI`**
   - Descrição: Senha do PostgreSQL para ambiente CI
   - Exemplo: `senha_postgres_ci_123`

7. **`REDIS_PASSWORD`**
   - Descrição: Senha do Redis
   - Exemplo: `senha_redis_123`

8. **`JWT_SECRET`**
   - Descrição: Chave secreta JWT (mínimo 64 caracteres)
   - Exemplo: `jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key`

## 🚨 IMPORTANTE: Segurança do Token

**⚠️ O token `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` foi exposto!**

Você deve **REVOGAR este token imediatamente** e criar um novo:

1. **Revogar token:**
   - Acesse: `https://github.com/settings/tokens`
   - Encontre o token e clique em "Revoke"

2. **Criar novo token:**
   - Acesse: `https://github.com/settings/tokens/new`
   - Nome: "GitHub Actions - SecuredGuard CI"
   - Expiration: Escolha um prazo (ex: 90 dias)
   - Permissões:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
   - Clique em "Generate token"
   - **Copie o token** (não será mostrado novamente!)

3. **Atualizar secret:**
   - Acesse: `https://github.com/zemarioramos/secured-guard/settings/secrets/actions`
   - Edite `TOKEN_GITHUB` com o novo token

## 🔍 Como Verificar se Secrets Estão Configurados

1. Acesse: `https://github.com/zemarioramos/secured-guard/settings/secrets/actions`
2. Verifique se todos os secrets acima aparecem na lista
3. Se algum estiver faltando, clique em "New repository secret" e adicione

## 🐛 Se o Workflow Ainda Não Executar

Mesmo com todos os secrets configurados, verifique:

### 1. Workflow Habilitado
- Acesse: `https://github.com/zemarioramos/secured-guard/settings/actions`
- Em "Workflow permissions", selecione: **"Read and write permissions"**
- Salve as alterações

### 2. Branch Correta
```bash
git branch --show-current
# Deve mostrar: ci
```

### 3. Push Realizado
```bash
git push origin ci
```

### 4. Executar Manualmente (Teste)
1. Acesse: `https://github.com/zemarioramos/secured-guard/actions`
2. Clique em: **"🐳 Deploy CI Environment (Docker Compose)"**
3. Clique em: **"Run workflow"** (canto superior direito)
4. Selecione branch: `ci`
5. Clique em: **"Run workflow"**

Se funcionar manualmente, o problema é com o trigger automático.

## 📝 Próximos Passos

1. ✅ **Revogar o token exposto** e criar um novo
2. ✅ **Verificar se todos os secrets obrigatórios estão configurados**
3. ✅ **Verificar se o workflow está habilitado**
4. ✅ **Fazer push na branch `ci`**
5. ✅ **Verificar se o workflow executou**
