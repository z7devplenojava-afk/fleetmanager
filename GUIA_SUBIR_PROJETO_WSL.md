# 🚀 Guia: Como Subir o Projeto no WSL

Este guia explica como subir o projeto Secured Guard no WSL (Windows Subsystem for Linux).

## 📋 Pré-requisitos

1. **WSL instalado e configurado** (WSL2 recomendado)
2. **Docker e Docker Compose instalados no WSL**
3. **Acesso ao código do projeto** na pasta do WSL

## 🔧 Passo 1: Verificar Instalação do Docker

Abra o terminal do WSL e verifique:

```bash
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version

# Se não estiver instalado, instale:
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose -y

# Adicionar seu usuário ao grupo docker (para não usar sudo)
sudo usermod -aG docker $USER
# Depois faça logout e login novamente
```

## 📂 Passo 2: Navegar para o Diretório do Projeto

```bash
# Navegue para o diretório do projeto
cd /mnt/c/dev/secured-guard
# ou, se estiver em outra localização:
# cd ~/projetos/secured-guard
```

## 📁 Passo 3: Criar Diretórios Necessários

O `docker-compose.ci.yml` espera alguns diretórios existirem. Crie-os:

```bash
# Criar diretórios para dados persistentes
sudo mkdir -p /var/www/secured_guard/ci/postgres_data
sudo mkdir -p /var/www/secured_guard/ci/redis_data
sudo mkdir -p /var/www/secured_guard/ci/uploads
sudo mkdir -p /var/www/secured_guard/ci/logs
sudo mkdir -p /var/www/secured_guard/ci/whatsapp_sessions

# Ajustar permissões (substitua 'seu_usuario' pelo seu usuário do WSL)
sudo chown -R $USER:$USER /var/www/secured_guard/ci
sudo chmod -R 755 /var/www/secured_guard/ci
```

**Alternativa:** Se preferir usar volumes do Docker (mais simples), edite o `docker-compose.ci.yml` e substitua os volumes bind mounts por volumes nomeados. Veja exemplo abaixo.

## 🔗 Passo 4: Criar Redes Docker

O docker-compose precisa das redes. Elas serão criadas automaticamente, mas se quiser criar manualmente:

```bash
# Rede principal do projeto
docker network create secured-guard-ci-network 2>/dev/null || true

# Rede externa (se necessário para comunicação com outros serviços)
docker network create z7network 2>/dev/null || true
```

## 🔨 Passo 5: Ajustar Docker Compose (Opcional)

Se você quiser fazer **build local** das imagens ao invés de usar as imagens pré-buildadas do Docker Hub, você tem duas opções:

### Opção A: Usar Imagens do Docker Hub (Mais Rápido)

Mantenha o `docker-compose.ci.yml` como está. As imagens serão baixadas automaticamente:
- `z7design/secured-guard-backend:ci`
- `z7design/secured-guard-frontend:ci`
- `z7design/secured-guard-whatsapp:ci`

### Opção B: Build Local (Para Desenvolvimento)

Edite o `docker-compose.ci.yml` e comente as linhas `image:` e descomente as seções `build:`. Exemplo para o backend:

```yaml
backend-ci:
  # Comentar esta linha:
  # image: z7design/secured-guard-backend:ci
  
  # Descomentar estas linhas:
  build:
    context: ./backend
    dockerfile: Dockerfile.prod
  container_name: secured-guard-backend-ci
  # ... resto da configuração
```

### Opção C: Usar Volumes ao Invés de Bind Mounts (Mais Simples)

Se preferir não criar os diretórios em `/var/www/`, você pode usar volumes nomeados. Adicione na seção `volumes:` do docker-compose.ci.yml:

```yaml
services:
  postgres-ci:
    volumes:
      # Substituir:
      # - /var/www/secured_guard/ci/postgres_data:/var/lib/postgresql/data
      # Por:
      - postgres_data_ci:/var/lib/postgresql/data

  redis-ci:
    volumes:
      - redis_data_ci:/data

  backend-ci:
    volumes:
      - uploads_ci:/var/www/secured_guard/ci/uploads
      - logs_ci:/var/www/secured_guard/ci/logs

  whatsapp-service-ci:
    volumes:
      - whatsapp_sessions_ci:/app/sessions
      - uploads_ci:/app/uploads

# Adicionar no final do arquivo:
volumes:
  postgres_data_ci:
  redis_data_ci:
  uploads_ci:
  logs_ci:
  whatsapp_sessions_ci:
```

## 🚀 Passo 6: Subir os Containers

### Método 1: Usando o Script Automatizado

```bash
# Dar permissão de execução
chmod +x test-wsl-docker.sh

# Executar o script
./test-wsl-docker.sh
```

### Método 2: Comandos Manuais

```bash
# Parar containers existentes (se houver)
docker-compose -f docker-compose.ci.yml down

# Subir os containers em background
docker-compose -f docker-compose.ci.yml up -d

# Se precisar fazer build local, adicione --build:
# docker-compose -f docker-compose.ci.yml up -d --build

# Verificar status dos containers
docker-compose -f docker-compose.ci.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.ci.yml logs -f
```

## 🔍 Passo 7: Verificar se Está Funcionando

### Verificar Status dos Containers

```bash
docker-compose -f docker-compose.ci.yml ps
```

Todos devem estar com status "Up" e health check "healthy" (ou "starting" aguardando).

### Verificar Logs do Backend

```bash
# Logs em tempo real
docker logs -f secured-guard-backend-ci

# Últimas 100 linhas
docker logs --tail 100 secured-guard-backend-ci

# Verificar se as migrations foram executadas
docker logs secured-guard-backend-ci | grep -i flyway
```

### Testar Health Check

```bash
# Backend (deve retornar {"status":"UP"})
curl http://localhost:8081/api/health

# Frontend
curl http://localhost:3000

# Nginx proxy
curl http://localhost:8082
```

### Verificar Migrations no Banco

```bash
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT COUNT(*) as total_migrations, MAX(version) as ultima_migration FROM flyway_schema_history;"
```

### Ver Todas as Migrations Executadas

```bash
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"
```

## 🌐 Acessar a Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8081/api
- **Nginx Proxy:** http://localhost:8082
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379
- **WhatsApp Service:** http://localhost:3333

## 🔧 Comandos Úteis

### Ver Logs
```bash
# Todos os serviços
docker-compose -f docker-compose.ci.yml logs -f

# Serviço específico
docker logs -f secured-guard-backend-ci
docker logs -f secured-guard-db-ci
docker logs -f secured-guard-frontend-ci
```

### Parar os Containers
```bash
# Parar sem remover volumes
docker-compose -f docker-compose.ci.yml stop

# Parar e remover containers (mantém volumes)
docker-compose -f docker-compose.ci.yml down

# Parar e remover containers + volumes (LIMPA TUDO)
docker-compose -f docker-compose.ci.yml down -v
```

### Reiniciar um Container Específico
```bash
docker-compose -f docker-compose.ci.yml restart backend-ci
```

### Entrar no Container
```bash
# Backend
docker exec -it secured-guard-backend-ci sh

# Banco de dados
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci
```

### Reconstruir e Subir Novamente
```bash
# Parar tudo
docker-compose -f docker-compose.ci.yml down

# Reconstruir imagens e subir
docker-compose -f docker-compose.ci.yml up -d --build

# Ou apenas forçar reconstrução do backend
docker-compose -f docker-compose.ci.yml up -d --build backend-ci
```

## ❌ Resolução de Problemas

### Erro: "Cannot connect to Docker daemon"

```bash
# Verificar se o Docker está rodando
sudo service docker status

# Iniciar Docker
sudo service docker start

# Ou no WSL2:
sudo service docker restart
```

### Erro: "Permission denied" ao criar diretórios

```bash
# Usar sudo ou ajustar permissões
sudo mkdir -p /var/www/secured_guard/ci
sudo chown -R $USER:$USER /var/www/secured_guard
```

### Erro: "Port already in use"

Verifique se alguma porta está em uso:

```bash
# Ver portas em uso
sudo netstat -tulpn | grep -E ':(5432|6379|8081|3000|8082|3333)'

# Ou usar ss
ss -tulpn | grep -E ':(5432|6379|8081|3000|8082|3333)'
```

Se necessário, pare o processo ou altere as portas no `docker-compose.ci.yml`.

### Erro: "Network not found"

```bash
# Criar as redes manualmente
docker network create secured-guard-ci-network
docker network create z7network
```

### Backend não inicia / Erro nas migrations

```bash
# Ver logs detalhados
docker logs secured-guard-backend-ci

# Verificar se o banco está pronto
docker exec secured-guard-db-ci pg_isready -U secured_guard_ci

# Limpar e tentar novamente (CUIDADO: apaga dados)
docker-compose -f docker-compose.ci.yml down -v
docker-compose -f docker-compose.ci.yml up -d
```

### Limpar Tudo e Começar do Zero

```bash
# ⚠️ ATENÇÃO: Isso apaga TODOS os dados!

# Parar e remover containers + volumes
docker-compose -f docker-compose.ci.yml down -v

# Remover imagens (opcional)
docker rmi z7design/secured-guard-backend:ci z7design/secured-guard-frontend:ci z7design/secured-guard-whatsapp:ci

# Limpar cache do Docker (opcional)
docker system prune -a

# Subir novamente
docker-compose -f docker-compose.ci.yml up -d --build
```

## 📝 Notas Importantes

1. **Primeira execução:** Pode levar alguns minutos para fazer download das imagens e executar todas as migrations.

2. **Migrations:** O Flyway executará todas as migrations automaticamente na primeira inicialização do backend.

3. **Health Checks:** Os containers podem levar alguns minutos para ficarem "healthy", especialmente o backend que precisa executar as migrations.

4. **Dados Persistentes:** Os dados do banco, Redis e uploads são persistidos nos volumes. Use `down -v` apenas se quiser limpar tudo.

5. **Rede Externa:** O projeto usa uma rede externa `z7network`. Se você não tiver outros serviços nessa rede, pode remover essa configuração do docker-compose.

## ✅ Checklist Final

- [ ] Docker e Docker Compose instalados
- [ ] Diretórios criados (ou usando volumes)
- [ ] Redes Docker criadas
- [ ] Containers subindo sem erros
- [ ] Backend respondendo em http://localhost:8081/api/health
- [ ] Frontend acessível em http://localhost:3000
- [ ] Migrations executadas com sucesso

## 🆘 Precisa de Ajuda?

- Verifique os logs: `docker logs -f secured-guard-backend-ci`
- Verifique o status: `docker-compose -f docker-compose.ci.yml ps`
- Verifique as migrations: `docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;"`
