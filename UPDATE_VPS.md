# 📋 Guia de Atualização do Projeto na VPS

## 🚀 Atualização Rápida

Execute os seguintes comandos na VPS via SSH:

```bash
# 1. Navegar para o diretório do projeto
cd ~/secured_guard

# 2. Verificar status atual
git status
git log --oneline -5

# 3. Fazer backup (opcional, mas recomendado)
cp -r ~/secured_guard ~/backup_secured_guard_$(date +%Y%m%d_%H%M%S)

# 4. Buscar atualizações
git fetch origin

# 5. Verificar diferenças
git log HEAD..origin/ci --oneline

# 6. Atualizar o projeto
git pull origin ci

# 7. Limpar containers antigos (se houver conflitos)
docker-compose -f docker-compose.ci.yml stop
docker-compose -f docker-compose.ci.yml rm -f
docker rm -f secured-guard-db-ci secured-guard-redis-ci secured-guard-backend-ci secured-guard-frontend-ci secured-guard-nginx-ci secured-guard-whatsapp-ci secured-guard-evolution-api-ci 2>/dev/null || true
docker network rm secured-guard-ci 2>/dev/null || true
docker network prune -f

# 8. Reconstruir containers Docker
docker-compose -f docker-compose.ci.yml build --no-cache
docker-compose -f docker-compose.ci.yml up -d

# 9. Verificar status
docker-compose -f docker-compose.ci.yml ps
docker-compose -f docker-compose.ci.yml logs --tail=50 backend-ci
```

## 🧹 Script de Limpeza Completa (Recomendado se houver conflitos)

Se você encontrar erros de containers em conflito, use o script de limpeza:

```bash
# Na VPS, criar o arquivo
nano cleanup-and-update.sh
# Cole o conteúdo do arquivo cleanup-and-update.sh
chmod +x cleanup-and-update.sh
./cleanup-and-update.sh
```

Este script:
- Remove todos os containers antigos
- Limpa redes Docker
- Atualiza o código
- Reconstrui e inicia tudo novamente

## 🔄 Usando o Script Automatizado

1. **Copiar o script para a VPS:**
   ```bash
   # No seu computador local, copie o arquivo update-vps.sh para a VPS
   scp update-vps.sh root@seu-servidor:/root/
   ```

2. **Executar o script na VPS:**
   ```bash
   ssh root@seu-servidor
   chmod +x update-vps.sh
   ./update-vps.sh
   ```

## ⚠️ Resolução de Problemas

### Se houver conflitos de merge:
```bash
# Ver conflitos
git status

# Resolver manualmente ou abortar
git merge --abort

# Ou resolver e continuar
# (editar arquivos com conflitos)
git add .
git commit -m "Resolve merge conflicts"
```

### Se os containers não iniciarem:
```bash
# Ver logs detalhados
docker-compose -f docker-compose.ci.yml logs backend-ci
docker-compose -f docker-compose.ci.yml logs frontend-ci

# Verificar se há containers antigos
docker ps -a

# Limpar containers e volumes (CUIDADO: remove dados!)
docker-compose -f docker-compose.ci.yml down -v
docker system prune -f
```

### Se o banco de dados não conectar:
```bash
# Verificar se o PostgreSQL está rodando
docker-compose -f docker-compose.ci.yml ps postgres-ci

# Ver logs do PostgreSQL
docker-compose -f docker-compose.ci.yml logs postgres-ci

# Reiniciar apenas o banco
docker-compose -f docker-compose.ci.yml restart postgres-ci
```

## 📝 Comandos Úteis

```bash
# Ver status dos containers
docker-compose -f docker-compose.ci.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.ci.yml logs -f

# Reiniciar um serviço específico
docker-compose -f docker-compose.ci.yml restart backend-ci

# Ver uso de recursos
docker stats

# Limpar imagens não utilizadas
docker image prune -a
```

## 🔐 Verificação Pós-Atualização

1. **Verificar se o backend está respondendo:**
   ```bash
   curl http://localhost:8081/api/health
   ```

2. **Verificar se o frontend está acessível:**
   ```bash
   curl -I http://localhost:5173
   ```

3. **Testar login na aplicação:**
   - Acesse: https://ci.z7botsolutions.com.br
   - Tente fazer login
   - Verifique se não há erros no console do navegador

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `docker-compose -f docker-compose.ci.yml logs`
2. Verifique o status: `docker-compose -f docker-compose.ci.yml ps`
3. Verifique o espaço em disco: `df -h`
4. Verifique a memória: `free -h`

