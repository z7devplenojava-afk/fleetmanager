# 🔧 Como Corrigir docker-compose.ci.yml no WSL

O arquivo no servidor WSL ainda está com bind mounts antigos. Execute os comandos abaixo **diretamente no terminal do WSL**:

## Opção 1: Usando sed (Recomendado)

```bash
# Navegue para o diretório do projeto
cd /var/www/secured-guard

# Faça backup
cp docker-compose.ci.yml docker-compose.ci.yml.backup

# Substitua todos os bind mounts por volumes nomeados
sed -i 's|/var/www/secured_guard/ci/postgres_data:/var/lib/postgresql/data|postgres_data_ci:/var/lib/postgresql/data|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/redis_data:/data|redis_data_ci:/data|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/uploads:/var/www/secured_guard/ci/uploads|uploads_ci:/var/www/secured_guard/ci/uploads|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/logs:/var/www/secured_guard/ci/logs|logs_ci:/var/www/secured_guard/ci/logs|g' docker-compose.ci.yml
sed -i 's|/var/www/secured_guard/ci/whatsapp_sessions:/app/sessions|whatsapp_sessions_ci:/app/sessions|g' docker-compose.ci.yml

# Verificar se ainda há bind mounts problemáticos
grep "/var/www.*:" docker-compose.ci.yml

# Se aparecer alguma linha, você precisará corrigir manualmente
# Se não aparecer nada, está correto!
```

## Opção 2: Editar Manualmente

Abra o arquivo `docker-compose.ci.yml` no WSL e substitua manualmente:

1. **Linha ~21** (postgres-ci volumes):
   ```yaml
   # ANTES:
   - /var/www/secured_guard/ci/postgres_data:/var/lib/postgresql/data
   # DEPOIS:
   - postgres_data_ci:/var/lib/postgresql/data
   ```

2. **Linha ~41** (redis-ci volumes):
   ```yaml
   # ANTES:
   - /var/www/secured_guard/ci/redis_data:/data
   # DEPOIS:
   - redis_data_ci:/data
   ```

3. **Linhas ~76-77** (backend-ci volumes):
   ```yaml
   # ANTES:
   - /var/www/secured_guard/ci/uploads:/var/www/secured_guard/ci/uploads
   - /var/www/secured_guard/ci/logs:/var/www/secured_guard/ci/logs
   # DEPOIS:
   - uploads_ci:/var/www/secured_guard/ci/uploads
   - logs_ci:/var/www/secured_guard/ci/logs
   ```

4. **Linhas ~112-113** (whatsapp-service-ci volumes):
   ```yaml
   # ANTES:
   - /var/www/secured_guard/ci/whatsapp_sessions:/app/sessions
   - /var/www/secured_guard/ci/uploads:/app/uploads
   # DEPOIS:
   - whatsapp_sessions_ci:/app/sessions
   - uploads_ci:/app/uploads
   ```

5. **Verifique se a seção `volumes:` existe no final do arquivo** (antes de `networks:`):
   ```yaml
   volumes:
     postgres_data_ci:
       driver: local
     redis_data_ci:
       driver: local
     uploads_ci:
       driver: local
     logs_ci:
       driver: local
     whatsapp_sessions_ci:
       driver: local
   ```

## Opção 3: Copiar arquivo do Git (Se estiver usando Git)

```bash
# No WSL
cd /var/www/secured-guard

# Se você fez commit das mudanças, pode fazer pull
git pull

# Ou copiar diretamente do repositório local (se estiver sincronizado)
```

## Após corrigir:

```bash
# 1. Parar containers e limpar volumes antigos
docker-compose -f docker-compose.ci.yml down -v

# 2. Verificar que não há mais bind mounts problemáticos
grep "/var/www.*:" docker-compose.ci.yml

# 3. Subir novamente
docker-compose -f docker-compose.ci.yml up -d

# 4. Verificar status
docker-compose -f docker-compose.ci.yml ps
```

## Verificação Rápida

Execute para verificar se está tudo correto:

```bash
# Não deve retornar nenhuma linha (se retornar, ainda há problemas)
grep -E "/var/www.*:/" docker-compose.ci.yml

# Deve mostrar os volumes nomeados
grep -E "(postgres_data_ci|redis_data_ci|uploads_ci|logs_ci|whatsapp_sessions_ci):" docker-compose.ci.yml
```





