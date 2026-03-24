# 🔍 Diagnóstico: Erro React #310 no CI

## ❌ Erro

```
Error: Minified React error #310
```

**Significado:** Hook (useEffect) sendo chamado de forma incorreta ou em ordem diferente.

## 🎯 Possíveis Causas

1. **Build minificado** - Dificulta debug
2. **Hook condicional** - useEffect dentro de if/else
3. **Ordem de hooks diferente** - Entre renders
4. **Erro em dependência** - Array de dependências incorreto
5. **Problema no build** - Frontend não foi rebuildo corretamente

## 🔧 Soluções

### Solução 1: Rebuild do Frontend (Mais Provável)

O frontend CI pode estar com build antigo. Rebuildar:

```bash
# No servidor CI
cd /var/www/secured_guard/ci

# Parar frontend
docker stop secured-guard-frontend-ci

# Remover container e imagem antiga
docker rm secured-guard-frontend-ci
docker rmi z7design/secured-guard-frontend:ci

# Pull nova imagem
docker pull z7design/secured-guard-frontend:ci

# Iniciar novamente
docker-compose up -d secured-guard-frontend-ci

# Verificar logs
docker logs secured-guard-frontend-ci
```

### Solução 2: Limpar Cache do Navegador

O erro pode ser cache antigo do navegador:

1. Abrir DevTools (F12)
2. Clicar com botão direito no ícone de reload
3. Selecionar "Empty Cache and Hard Reload"
4. Ou usar Ctrl+Shift+Delete para limpar cache

### Solução 3: Verificar Variáveis de Ambiente

O frontend pode estar com URL errada:

```bash
# Verificar variáveis do frontend
docker exec secured-guard-frontend-ci env | grep VITE

# Deve mostrar:
# VITE_API_URL=https://ci.z7botsolutions.com.br/api
# VITE_WS_URL=wss://ci.z7botsolutions.com.br/ws
```

Se estiver errado, corrigir no `docker-compose.ci.yml`:

```yaml
frontend-ci:
  environment:
    VITE_API_URL: https://ci.z7botsolutions.com.br/api
    VITE_WS_URL: wss://ci.z7botsolutions.com.br/ws
```

### Solução 4: Trigger Novo Build via GitHub Actions

Forçar rebuild completo:

```bash
# No seu computador local
git commit --allow-empty -m "trigger: rebuild frontend CI"
git push origin main:ci
```

Isso vai:
1. Fazer build novo do frontend
2. Criar nova imagem Docker
3. Fazer deploy no CI

### Solução 5: Verificar se Backend Está Respondendo

O erro pode ser causado por falha na API:

```bash
# Testar endpoints básicos
curl https://ci.z7botsolutions.com.br/api/health
curl https://ci.z7botsolutions.com.br/api/auth/me

# Ver logs do backend
docker logs secured-guard-backend-ci --tail 100
```

## 🧪 Teste Rápido

Abrir o console do navegador e executar:

```javascript
// Verificar se API está acessível
fetch('https://ci.z7botsolutions.com.br/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Verificar variáveis de ambiente do frontend
console.log('API URL:', import.meta.env.VITE_API_URL)
```

## 📊 Informações Adicionais

### Onde o erro está acontecendo:

```
at tn (index-OX6o7KN3.js:110:120221)
```

Isso indica que o erro está em um componente específico no arquivo `index-OX6o7KN3.js` (build minificado).

### Para ver erro completo (não minificado):

Seria necessário:
1. Build de desenvolvimento (não minificado)
2. Ou source maps habilitados

## 🎯 Solução Recomendada

**Passo 1:** Rebuild do frontend via GitHub Actions

```bash
git commit --allow-empty -m "fix: rebuild frontend CI para corrigir erro React #310"
git push origin main:ci
```

**Passo 2:** Aguardar deploy (5-10 minutos)

**Passo 3:** Limpar cache do navegador

**Passo 4:** Testar novamente

## 🔄 Se Persistir

Se o erro continuar após rebuild:

1. **Verificar logs do frontend:**
   ```bash
   docker logs secured-guard-frontend-ci
   ```

2. **Verificar se Nginx está servindo arquivos corretos:**
   ```bash
   docker exec secured-guard-frontend-ci ls -la /usr/share/nginx/html
   ```

3. **Testar acesso direto ao frontend:**
   ```bash
   curl -I https://ci.z7botsolutions.com.br
   ```

4. **Verificar se há erro de CORS:**
   - Abrir DevTools → Network
   - Tentar fazer login
   - Ver se há erros de CORS

## 💡 Nota Importante

Esse erro é **diferente e independente** do erro 405 que foi resolvido. O erro 405 era no backend/Traefik, este erro #310 é no frontend React.

---

**Prioridade:** 🟡 Média  
**Impacto:** Frontend não carrega corretamente  
**Tempo estimado:** 10-15 minutos (rebuild)
