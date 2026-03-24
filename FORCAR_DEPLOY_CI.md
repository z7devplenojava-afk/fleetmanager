# Como Forçar Deploy no Ambiente CI

## Situação Atual

O código está no repositório (commit `dfbc68f6`), mas o ambiente CI não está atualizado. O workflow `.github/workflows/deploy-ci-docker.yml` deveria executar automaticamente quando há push no branch `ci`, mas pode não estar funcionando.

## Solução 1: Executar Workflow Manualmente (Recomendado)

1. Acesse: https://github.com/zemarioramos/secured-guard/actions
2. Procure pelo workflow "🐳 Deploy CI Environment (Docker Compose)"
3. Clique em "Run workflow"
4. Selecione o branch `ci`
5. Clique em "Run workflow"

## Solução 2: Forçar Deploy Manual na VPS

Se o workflow não estiver funcionando, execute manualmente na VPS:

```bash
# 1. Acessar VPS via SSH
ssh usuario@ci.z7botsolutions.com.br

# 2. Acessar diretório do projeto
cd /var/www/secured_guard/ci

# 3. Parar containers atuais
docker-compose -f docker-compose.ci.yml down

# 4. Fazer pull das novas imagens do Docker Hub
echo "SENHA_DOCKER_HUB" | docker login -u "USUARIO_DOCKER_HUB" --password-stdin
docker pull z7design/secured-guard-frontend:ci
docker pull z7design/secured-guard-backend:ci

# 5. Subir containers com --force-recreate para garantir atualização
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always

# 6. Verificar se os containers estão rodando
docker-compose -f docker-compose.ci.yml ps

# 7. Verificar logs do frontend
docker logs secured-guard-frontend-ci --tail 50
```

## Solução 3: Rebuild Completo na VPS

Se as imagens Docker não estiverem atualizadas:

```bash
# 1. Acessar VPS
ssh usuario@ci.z7botsolutions.com.br

# 2. Acessar diretório
cd /var/www/secured_guard/ci

# 3. Parar e remover containers
docker-compose -f docker-compose.ci.yml down --remove-orphans

# 4. Remover imagens antigas (opcional, mas recomendado)
docker rmi z7design/secured-guard-frontend:ci z7design/secured-guard-backend:ci || true

# 5. Fazer pull das novas imagens
echo "SENHA_DOCKER_HUB" | docker login -u "USUARIO_DOCKER_HUB" --password-stdin
docker pull z7design/secured-guard-frontend:ci
docker pull z7design/secured-guard-backend:ci

# 6. Subir containers
docker-compose -f docker-compose.ci.yml up -d --force-recreate

# 7. Verificar status
docker-compose -f docker-compose.ci.yml ps
docker logs secured-guard-frontend-ci --tail 100
```

## Verificação do Deploy

Após o deploy, verifique:

1. **Verificar se o código está na imagem Docker:**
```bash
docker exec secured-guard-frontend-ci ls -la /usr/share/nginx/html/
docker exec secured-guard-frontend-ci grep -r "creditedAccount" /usr/share/nginx/html/ | head -5
```

2. **Verificar se o frontend está servindo os arquivos corretos:**
```bash
curl -s https://ci.z7botsolutions.com.br | grep -o "creditedAccount" | head -1
```

3. **Limpar cache do navegador:**
- Pressione `Ctrl+Shift+Delete` no navegador
- Ou `Ctrl+F5` para hard refresh

## Problema Comum: Cache do Docker

Se o problema persistir, pode ser cache do Docker. Force rebuild sem cache:

```bash
# Na VPS
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml build --no-cache frontend
docker-compose -f docker-compose.ci.yml up -d --force-recreate frontend
```

## Verificar se o Workflow está Executando

1. Acesse: https://github.com/zemarioramos/secured-guard/actions
2. Verifique se há execuções recentes do workflow "Deploy CI Environment"
3. Se não houver, o workflow pode não estar configurado corretamente
4. Verifique se os secrets estão configurados:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `VPS_HOST_CI`
   - `VPS_USER_CI`
   - `VPS_PASSWORD_CI`
   - `JWT_SECRET_CI`

## Próximos Passos

1. ✅ Verificar se o workflow está executando
2. ⏳ Executar workflow manualmente se necessário
3. ⏳ Verificar logs do workflow no GitHub Actions
4. ⏳ Fazer deploy manual na VPS se o workflow falhar
5. ⏳ Verificar se os containers estão rodando com as novas imagens
6. ⏳ Limpar cache do navegador e testar
