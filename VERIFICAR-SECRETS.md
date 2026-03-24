# 🔐 Verificação de Secrets do GitHub Actions

## ✅ Secrets Configurados

Você configurou:
- `USER_GITHUB` = zemarioramos
- `TOKEN_GITHUB` = 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

## 📋 Secrets Necessários para o Workflow Atual

O workflow `deploy-ci-docker.yml` precisa dos seguintes secrets:

### **Obrigatórios:**
1. ✅ `DOCKER_USERNAME` - Usuário do Docker Hub
2. ✅ `DOCKER_PASSWORD` - Senha do Docker Hub
3. ✅ `VPS_HOST` - IP ou hostname da VPS (ex: 185.225.233.18)
4. ✅ `VPS_USER` - Usuário SSH da VPS (ex: securedguard)
5. ✅ `VPS_PASSWORD` - Senha SSH da VPS
6. ✅ `POSTGRES_PASSWORD_CI` - Senha do PostgreSQL para ambiente CI
7. ✅ `REDIS_PASSWORD` - Senha do Redis
8. ✅ `JWT_SECRET` - Chave secreta JWT (mínimo 64 caracteres)

### **Opcionais (para funcionalidades extras):**
- `USER_GITHUB` - Seu usuário do GitHub (já configurado)
- `TOKEN_GITHUB` - Token de acesso pessoal do GitHub (já configurado)

## 🔍 Verificar Secrets Configurados

1. Acesse: `https://github.com/zemarioramos/secured-guard/settings/secrets/actions`
2. Verifique se TODOS os secrets obrigatórios estão configurados
3. Se algum estiver faltando, adicione-o

## ⚠️ Importante sobre TOKEN_GITHUB

O token que você configurou (`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`) é um **Personal Access Token (PAT)**.

**⚠️ SEGURANÇA:** Este token foi exposto na mensagem. Você deve:
1. **Revogar este token imediatamente** no GitHub
2. **Criar um novo token** com as permissões necessárias
3. **Nunca compartilhar tokens** em mensagens ou código

### Como Revogar e Criar Novo Token:

1. **Revogar token atual:**
   - Acesse: `https://github.com/settings/tokens`
   - Encontre o token e clique em "Revoke"

2. **Criar novo token:**
   - Acesse: `https://github.com/settings/tokens/new`
   - Nome: "GitHub Actions - SecuredGuard"
   - Permissões necessárias:
     - `repo` (acesso completo ao repositório)
     - `workflow` (se quiser que o workflow atualize outros workflows)
   - Clique em "Generate token"
   - **Copie o token imediatamente** (não será mostrado novamente)

3. **Atualizar secret:**
   - Acesse: `https://github.com/zemarioramos/secured-guard/settings/secrets/actions`
   - Edite `TOKEN_GITHUB` com o novo token

## 🔧 Se o Workflow Ainda Não Executar

Mesmo com os secrets configurados, verifique:

1. **Workflow habilitado:**
   - `Settings > Actions > General > Workflow permissions`
   - Deve estar: "Read and write permissions"

2. **Branch correta:**
   ```bash
   git branch --show-current
   # Deve mostrar: ci
   ```

3. **Push realizado:**
   ```bash
   git push origin ci
   ```

4. **Executar manualmente:**
   - Acesse: `https://github.com/zemarioramos/secured-guard/actions`
   - Clique em "🐳 Deploy CI Environment (Docker Compose)"
   - Clique em "Run workflow"
   - Selecione branch: `ci`

## 📝 Nota sobre USER_GITHUB e TOKEN_GITHUB

Esses secrets não são usados pelo workflow atual de deploy. Eles podem ser úteis para:
- Criar releases automáticos
- Criar tags
- Atualizar outros workflows
- Acessar API do GitHub

Se você quiser usar esses secrets no workflow, podemos adicionar funcionalidades que os utilizem.
