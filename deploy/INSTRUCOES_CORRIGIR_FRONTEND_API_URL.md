# 🔧 Como Corrigir VITE_API_URL no Frontend CI

## ❌ Problema
O frontend está usando `http://localhost:8083/api` em vez de `https://ci.z7botsolutions.com.br/api`, causando erro 401 no login.

## ✅ Solução

### Passo 1: Verificar se o GitHub Actions terminou de buildar
1. Acesse: https://github.com/seu-usuario/secured-guard/actions
2. Verifique se o workflow `deploy-ci-docker.yml` ou `deploy-ci-only.yml` terminou com sucesso
3. Aguarde até ver ✅ (verde) no último build

### Passo 2: Aplicar correção na VPS

**Opção A: Usar o script automático (recomendado)**

```bash
# Na VPS, execute:
cd /var/www/secured_guard/ci
chmod +x deploy/fix-frontend-api-url-vps.sh
./deploy/fix-frontend-api-url-vps.sh
```

**Opção B: Comandos manuais**

```bash
# 1. Ir para o diretório do projeto
cd /var/www/secured_guard/ci

# 2. Parar e remover container antigo
docker-compose -f docker-compose.ci.yml stop frontend-ci
docker-compose -f docker-compose.ci.yml rm -f frontend-ci

# 3. Remover imagem antiga (força pull da nova)
docker rmi z7design/secured-guard-frontend:ci

# 4. Fazer pull da nova imagem do Docker Hub
docker pull z7design/secured-guard-frontend:ci

# 5. Recriar e iniciar container
docker-compose -f docker-compose.ci.yml up -d frontend-ci

# 6. Verificar logs
docker logs -f secured-guard-frontend-ci
```

### Passo 3: Verificar se funcionou

1. Abra o navegador em: `https://ci.z7botsolutions.com.br`
2. Abra o DevTools (F12) → Console
3. Procure por: `🔧 Usando VITE_API_URL: https://ci.z7botsolutions.com.br/api`
4. Se aparecer `http://localhost:8083/api`, a imagem ainda está antiga

### Passo 4: Se ainda não funcionar

Execute o script de verificação:

```bash
cd /var/www/secured_guard/ci
chmod +x deploy/verificar-frontend-api-url.sh
./deploy/verificar-frontend-api-url.sh
```

## 🔍 Diagnóstico

Se o problema persistir, verifique:

1. **A imagem foi realmente buildada?**
   ```bash
   docker images | grep secured-guard-frontend:ci
   # Verifique a data de criação
   ```

2. **O container está usando a imagem correta?**
   ```bash
   docker inspect secured-guard-frontend-ci | grep Image
   ```

3. **Há cache do navegador?**
   - Limpe o cache do navegador (Ctrl+Shift+Delete)
   - Ou use modo anônimo (Ctrl+Shift+N)

4. **O GitHub Actions buildou com os ARGs corretos?**
   - Verifique os logs do workflow no GitHub
   - Procure por: `--build-arg VITE_API_URL=https://ci.z7botsolutions.com.br/api`

## 📝 Notas

- A variável `VITE_API_URL` é "embutida" no código JavaScript durante o build do Docker
- Não adianta definir no `environment` do docker-compose, precisa estar no build
- O código já foi corrigido para aceitar ARGs no Dockerfile
- O workflow do GitHub Actions já foi corrigido para passar os ARGs

