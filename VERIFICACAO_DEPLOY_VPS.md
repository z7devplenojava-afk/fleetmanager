# Verificação de Deploy na VPS

## Problema Identificado

O código da funcionalidade "Conta creditada" está no repositório (commit `d7a56cf6`), mas não está aparecendo na VPS. Isso indica que o deploy não foi executado ou não atualizou os arquivos corretamente.

## Verificações Necessárias

### 1. Verificar se o código está no repositório remoto

✅ **Confirmado**: O código está no commit `d7a56cf6` no branch `ci`:
- Arquivo: `frontend/src/pages/Holerites.tsx`
- Linhas: 6437-6441
- Código: Exibição de `receipt.creditedAccount` como "Conta creditada"

### 2. Verificar processo de deploy na VPS

O deploy precisa:
1. Fazer `git pull` do branch `ci`
2. Rebuild do frontend (`npm run build:ci` ou similar)
3. Copiar arquivos para o diretório de produção
4. Reiniciar serviços se necessário

### 3. Comandos para verificar na VPS

```bash
# 1. Verificar branch atual
git branch

# 2. Verificar último commit
git log --oneline -5

# 3. Verificar se há atualizações no remoto
git fetch origin ci
git log HEAD..origin/ci --oneline

# 4. Se houver diferenças, fazer pull
git pull origin ci

# 5. Verificar se o arquivo tem o código
grep -A 3 "creditedAccount" frontend/src/pages/Holerites.tsx

# 6. Rebuild do frontend (se necessário)
cd frontend
npm install
npm run build:ci

# 7. Verificar se os arquivos foram atualizados
ls -la dist/ | head -20
```

### 4. Verificar se o build foi executado

O build do frontend precisa ser executado para gerar os arquivos estáticos:
- Verificar se `npm run build:ci` foi executado
- Verificar se os arquivos em `frontend/dist/` foram atualizados
- Verificar timestamp dos arquivos

### 5. Verificar cache do navegador/CDN

Mesmo após o deploy, pode ser necessário:
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Limpar cache do CDN (Cloudflare)
- Fazer hard refresh (Ctrl+F5)

## Solução Rápida

Se o deploy automático não está funcionando, execute manualmente na VPS:

```bash
# 1. Acessar diretório do projeto
cd /caminho/do/projeto

# 2. Atualizar código
git fetch origin ci
git checkout ci
git pull origin ci

# 3. Rebuild frontend
cd frontend
npm install
npm run build:ci

# 4. Copiar arquivos para produção (ajustar conforme sua configuração)
# Exemplo com nginx:
sudo cp -r dist/* /var/www/html/

# Ou se usar Docker:
docker-compose restart frontend
# ou
docker-compose up -d --build frontend
```

## Verificação do Código no Repositório

O código está presente no commit `d7a56cf6`:

```typescript
{receipt.creditedAccount && (
  <p className="text-gray-300 text-sm">
    Conta creditada: <span className="font-semibold">{receipt.creditedAccount}</span>
  </p>
)}
```

**Localização**: `frontend/src/pages/Holerites.tsx`, linhas 6437-6441

## Próximos Passos

1. ✅ Verificar se o código está no repositório (CONFIRMADO)
2. ⏳ Verificar processo de deploy na VPS
3. ⏳ Executar deploy manual se necessário
4. ⏳ Verificar se o build foi executado
5. ⏳ Limpar cache do navegador/CDN
6. ⏳ Testar na VPS após deploy

## Notas

- O código está correto e no repositório
- O problema é de deploy/infraestrutura, não de código
- Pode ser necessário verificar logs do processo de deploy
- Pode ser necessário verificar configuração do CI/CD se houver
