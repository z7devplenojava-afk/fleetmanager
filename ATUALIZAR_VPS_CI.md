# Guia Completo: Atualizar VPS CI com Código Mais Recente

## Problema
Após `git pull`, a VPS ainda está desatualizada porque:
- O frontend precisa ser reconstruído
- Os containers Docker podem estar usando imagens antigas em cache
- O código pode não ter sido deployado corretamente

## Solução: Atualização Completa

### Passo 1: Conectar na VPS
```bash
ssh usuario@vps-ip
cd /var/www/secured_guard/ci
```

### Passo 2: Verificar Status do Git
```bash
# Verificar se há mudanças não commitadas
git status

# Verificar branch atual
git branch

# Verificar último commit
git log -1

# Se não estiver na branch correta, mudar para 'ci'
git checkout ci

# Forçar pull (descartar mudanças locais se necessário)
git fetch origin
git reset --hard origin/ci
```

### Passo 3: Parar Todos os Containers
```bash
# Parar todos os containers
docker-compose -f docker-compose.ci.yml down

# Verificar se pararam
docker ps | grep secured-guard
```

### Passo 4: Limpar Cache do Docker (IMPORTANTE)
```bash
# Remover imagens antigas do frontend
docker rmi secured-guard-frontend-ci 2>/dev/null || true
docker rmi $(docker images | grep secured-guard-frontend-ci | awk '{print $3}') 2>/dev/null || true

# Limpar cache de build do Docker
docker builder prune -f

# Verificar imagens
docker images | grep secured-guard
```

### Passo 5: Reconstruir Frontend (SEM CACHE)
```bash
# Navegar para diretório do frontend
cd /var/www/secured_guard/ci/frontend

# Limpar node_modules e dist (opcional, mas recomendado)
rm -rf node_modules dist .next

# Reinstalar dependências (se necessário)
npm install

# Reconstruir frontend SEM cache
npm run build

# Verificar se build foi bem-sucedido
ls -la dist/
```

### Passo 6: Reconstruir e Recriar Containers (SEM CACHE)
```bash
# Voltar para diretório raiz
cd /var/www/secured_guard/ci

# Reconstruir imagens SEM cache
docker-compose -f docker-compose.ci.yml build --no-cache frontend
docker-compose -f docker-compose.ci.yml build --no-cache backend

# Recriar containers (forçar recriação)
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans

# Verificar status
docker-compose -f docker-compose.ci.yml ps
```

### Passo 7: Verificar Logs
```bash
# Verificar logs do frontend
docker logs secured-guard-frontend-ci --tail 50 -f

# Verificar logs do backend
docker logs secured-guard-backend-ci --tail 50 -f

# Verificar se não há erros
docker-compose -f docker-compose.ci.yml logs --tail 100 | grep -i error
```

### Passo 8: Verificar se Atualização Funcionou
```bash
# Verificar versão do frontend (se houver endpoint de versão)
curl https://ci.z7botsolutions.com.br/api/health

# Verificar se arquivos foram atualizados
docker exec secured-guard-frontend-ci ls -la /usr/share/nginx/html/assets/ | head -20

# Verificar data de modificação dos arquivos
docker exec secured-guard-frontend-ci stat /usr/share/nginx/html/index.html
```

## Script Completo (Copiar e Colar)

```bash
#!/bin/bash
# Script para atualizar completamente a VPS CI

set -e  # Parar em caso de erro

echo "🔄 Iniciando atualização completa da VPS CI..."

# 1. Navegar para diretório
cd /var/www/secured_guard/ci
echo "📁 Diretório: $(pwd)"

# 2. Atualizar código
echo "📥 Atualizando código do Git..."
git fetch origin
git checkout ci
git reset --hard origin/ci
echo "✅ Código atualizado. Último commit:"
git log -1 --oneline

# 3. Parar containers
echo "🛑 Parando containers..."
docker-compose -f docker-compose.ci.yml down

# 4. Limpar cache
echo "🧹 Limpando cache do Docker..."
docker rmi secured-guard-frontend-ci 2>/dev/null || true
docker builder prune -f

# 5. Reconstruir frontend
echo "🔨 Reconstruindo frontend..."
cd frontend
npm install
npm run build
cd ..

# 6. Reconstruir containers
echo "🔨 Reconstruindo containers (sem cache)..."
docker-compose -f docker-compose.ci.yml build --no-cache frontend backend

# 7. Recriar containers
echo "🚀 Recriando containers..."
docker-compose -f docker-compose.ci.yml up -d --force-recreate --pull always --remove-orphans

# 8. Aguardar inicialização
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# 9. Verificar status
echo "✅ Verificando status..."
docker-compose -f docker-compose.ci.yml ps

echo "🎉 Atualização completa! Verifique os logs se necessário:"
echo "   docker logs secured-guard-frontend-ci --tail 50 -f"
echo "   docker logs secured-guard-backend-ci --tail 50 -f"
```

## Comandos Rápidos (Se Script Não Funcionar)

```bash
# Atualização rápida (sem reconstruir frontend)
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml restart frontend backend

# Atualização completa (recomendado)
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml build --no-cache
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

## Verificação Final

1. **Acessar o sistema:**
   - Abrir https://ci.z7botsolutions.com.br
   - Verificar se a interface está atualizada
   - Testar funcionalidade de comprovantes

2. **Verificar console do navegador:**
   - Abrir DevTools (F12)
   - Verificar se não há erros 404 para arquivos JavaScript
   - Verificar se os arquivos carregados têm data recente

3. **Verificar logs do backend:**
   ```bash
   docker logs secured-guard-backend-ci --tail 100 | grep -i "receipts\|comprovante"
   ```

## Problemas Comuns

### Problema 1: Frontend ainda mostra versão antiga
**Solução:**
```bash
# Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
# Ou limpar completamente o cache do Docker
docker system prune -a -f
docker-compose -f docker-compose.ci.yml build --no-cache frontend
docker-compose -f docker-compose.ci.yml up -d --force-recreate frontend
```

### Problema 2: Erro ao reconstruir frontend
**Solução:**
```bash
cd /var/www/secured_guard/ci/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema 3: Containers não iniciam
**Solução:**
```bash
# Verificar logs de erro
docker-compose -f docker-compose.ci.yml logs

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```

## Nota Importante

**Sempre use `--no-cache` e `--force-recreate`** quando quiser garantir que as mudanças foram aplicadas. O Docker pode usar imagens antigas em cache mesmo após `git pull`.
