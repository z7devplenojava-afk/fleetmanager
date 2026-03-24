# 🔍 Como Identificar e Corrigir Falha no Workflow

## 📋 Passo a Passo para Ver o Erro

### 1. Acessar os Logs Detalhados

1. Acesse: https://github.com/zmarioramos/secured-guard/actions
2. Clique no workflow #100 que falhou
3. Clique no job "🚀 Build & Deploy to CI (Docker)"
4. **Expandir as annotations** (deve mostrar "1 error" no topo)
5. **Expandir cada step** que falhou (marcado com ❌)

### 2. Verificar os Steps em Ordem

O workflow executa os seguintes steps. Verifique qual está falhando:

1. ✅ **📥 Checkout code** - Baixa o código
2. ✅ **☕ Setup Java 17** - Configura Java
3. ✅ **📦 Setup Node.js 20** - Configura Node.js
4. ✅ **🔨 Build Backend (Maven)** - Compila backend
5. ✅ **🎨 Build Frontend (Vite)** - Compila frontend
6. ✅ **🐳 Build Docker images** - Cria imagens Docker
7. ✅ **🔐 Login to Docker Hub** - Login no Docker Hub
8. ✅ **📤 Push images to Docker Hub** - Envia imagens
9. ✅ **🔑 Install sshpass and configure SSH** - Configura SSH
10. ✅ **📤 Transfer files to VPS** - Transfere arquivos
11. ✅ **🔐 Validate and configure JWT_SECRET** - Valida JWT
12. ✅ **⚙️ Create .env file on VPS** - Cria arquivo .env
13. ⚠️ ... e mais steps

## 🔍 Possíveis Causas de Falha

### Erro no Build Backend
**Sintoma:** Falha no step "🔨 Build Backend (Maven)"
**Possíveis causas:**
- Erros de compilação Java
- Dependências Maven não encontradas
- Memória insuficiente
- Problemas com testes (mesmo com -DskipTests)

**Solução:**
```bash
# Verificar logs do Maven no GitHub Actions
# Procurar por: "ERROR", "FAILED", "Exception"
```

### Erro no Build Frontend
**Sintoma:** Falha no step "🎨 Build Frontend (Vite)"
**Possíveis causas:**
- Erros de compilação TypeScript/React
- Dependências npm não encontradas
- Variáveis de ambiente faltando (VITE_API_URL)
- Problemas com node_modules

**Solução:**
```bash
# Verificar logs do npm no GitHub Actions
# Procurar por: "ERROR", "failed", "missing"
```

### Erro no Build Docker
**Sintoma:** Falha no step "🐳 Build Docker images"
**Possíveis causas:**
- Dockerfile com erros
- Dependências faltando nas imagens
- Problemas de permissão
- Espaço insuficiente no runner

**Solução:**
- Verificar se os Dockerfiles existem
- Verificar logs do docker build

### Erro no Login Docker Hub
**Sintoma:** Falha no step "🔐 Login to Docker Hub"
**Possíveis causas:**
- Secrets `DOCKER_USERNAME` ou `DOCKER_PASSWORD` não configurados
- Credenciais inválidas
- Problema de conectividade

**Solução:**
1. Verificar secrets em: Settings → Secrets and variables → Actions
2. Garantir que `DOCKER_USERNAME` e `DOCKER_PASSWORD` estão configurados

### Erro no Push Docker Hub
**Sintoma:** Falha no step "📤 Push images to Docker Hub"
**Possíveis causas:**
- Imagens não foram criadas
- Problema de permissão no Docker Hub
- Rate limit do Docker Hub

**Solução:**
- Verificar se as imagens foram criadas no step anterior
- Verificar logs do docker push

### Erro no SSH/VPS
**Sintoma:** Falha em steps relacionados a SSH/VPS
**Possíveis causas:**
- Secrets `VPS_HOST`, `VPS_USER`, `VPS_PASSWORD` não configurados
- VPS não acessível
- Problema de autenticação SSH
- Firewall bloqueando conexão

**Solução:**
1. Verificar secrets em: Settings → Secrets and variables → Actions
2. Garantir que todos os secrets estão configurados:
   - `VPS_HOST`
   - `VPS_USER`
   - `VPS_PASSWORD`
   - `POSTGRES_PASSWORD_CI`
   - `REDIS_PASSWORD`
   - `JWT_SECRET`

### Erro no JWT_SECRET
**Sintoma:** Falha no step "🔐 Validate and configure JWT_SECRET"
**Possíveis causas:**
- `JWT_SECRET` não configurado
- `JWT_SECRET` muito curto (menos de 64 caracteres)
- Formato incorreto

**Solução:**
1. Verificar secret `JWT_SECRET` em Settings → Secrets
2. Garantir que tem pelo menos 64 caracteres

## 🔧 Checklist Rápido

Verifique se todos estes secrets estão configurados:

- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD`
- [ ] `VPS_HOST`
- [ ] `VPS_USER`
- [ ] `VPS_PASSWORD`
- [ ] `POSTGRES_PASSWORD_CI`
- [ ] `REDIS_PASSWORD`
- [ ] `JWT_SECRET` (mínimo 64 caracteres)

## 📞 Próximos Passos

1. **Expandir a annotation de erro** no GitHub Actions
2. **Clicar no step que falhou** para ver logs detalhados
3. **Copiar a mensagem de erro** completa
4. **Enviar para mim** para análise específica

## 💡 Dica

Para ver o erro completo:
1. No GitHub Actions, clique no workflow #100
2. Clique no job "🚀 Build & Deploy to CI (Docker)"
3. Clique no step que tem ❌ (vermelho)
4. Role para baixo até ver a mensagem de erro completa
5. Copie toda a mensagem de erro

Com a mensagem de erro completa, posso identificar exatamente o problema e fornecer a solução específica!








































