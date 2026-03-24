# Comandos para Descobrir Senhas de Todos os Ambientes via Docker

## 🐳 **Comandos para Cada Ambiente**

### **PRODUÇÃO (PROD)**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Ver senha do ambiente de produção
docker exec secured-guard-db-prod env | grep POSTGRES_PASSWORD

# Ver todas as variáveis de ambiente do container de produção
docker exec secured-guard-db-prod env | grep -i postgres

# Ver logs do container de produção
docker logs secured-guard-db-prod 2>&1 | grep -i password
```

### **DESENVOLVIMENTO (DEV)**
```bash
# Ver senha do ambiente de desenvolvimento
docker exec secured-guard-db-dev env | grep POSTGRES_PASSWORD

# Ver todas as variáveis de ambiente do container de desenvolvimento
docker exec secured-guard-db-dev env | grep -i postgres

# Ver logs do container de desenvolvimento
docker logs secured-guard-db-dev 2>&1 | grep -i password
```

### **CI/CD (CI)**
```bash
# Ver senha do ambiente de CI/CD
docker exec secured-guard-db-ci env | grep POSTGRES_PASSWORD

# Ver todas as variáveis de ambiente do container de CI/CD
docker exec secured-guard-db-ci env | grep -i postgres

# Ver logs do container de CI/CD
docker logs secured-guard-db-ci 2>&1 | grep -i password
```

## 🔍 **Comandos para Descobrir Nomes dos Containers**

### **Listar Todos os Containers PostgreSQL**
```bash
# Ver todos os containers rodando
docker ps

# Filtrar apenas containers PostgreSQL
docker ps | grep postgres

# Ver todos os containers (incluindo parados)
docker ps -a | grep postgres
```

### **Ver Configurações do Docker Compose**
```bash
# Ver configuração de produção
cat /opt/secured-guard/deploy/docker-compose.prod.yml | grep -A 10 -B 5 postgres

# Ver configuração de desenvolvimento
cat /opt/secured-guard/deploy/docker-compose.dev.yml | grep -A 10 -B 5 postgres

# Ver configuração de CI/CD
cat /opt/secured-guard/deploy/docker-compose.ci.yml | grep -A 10 -B 5 postgres
```

## 🚀 **Comando Completo para Todos os Ambientes**

### **Script para Descobrir Todas as Senhas**
```bash
#!/bin/bash

echo "🔍 Descobrindo senhas de todos os ambientes..."

echo ""
echo "=== PRODUÇÃO ==="
if docker ps | grep -q "secured-guard-db-prod"; then
    echo "Container de produção encontrado!"
    docker exec secured-guard-db-prod env | grep POSTGRES_PASSWORD
else
    echo "Container de produção não encontrado"
fi

echo ""
echo "=== DESENVOLVIMENTO ==="
if docker ps | grep -q "secured-guard-db-dev"; then
    echo "Container de desenvolvimento encontrado!"
    docker exec secured-guard-db-dev env | grep POSTGRES_PASSWORD
else
    echo "Container de desenvolvimento não encontrado"
fi

echo ""
echo "=== CI/CD ==="
if docker ps | grep -q "secured-guard-db-ci"; then
    echo "Container de CI/CD encontrado!"
    docker exec secured-guard-db-ci env | grep POSTGRES_PASSWORD
else
    echo "Container de CI/CD não encontrado"
fi

echo ""
echo "=== TODOS OS CONTAINERS POSTGRESQL ==="
docker ps | grep postgres
```

## 📋 **Comandos Alternativos**

### **Se os Nomes dos Containers Forem Diferentes**
```bash
# Ver todos os containers PostgreSQL
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep postgres

# Para cada container encontrado, executar:
docker exec NOME_DO_CONTAINER env | grep POSTGRES_PASSWORD
```

### **Via Docker Compose**
```bash
# Se estiver usando docker-compose
cd /opt/secured-guard/deploy

# Ver variáveis de ambiente de produção
docker-compose -f docker-compose.prod.yml exec postgres env | grep POSTGRES_PASSWORD

# Ver variáveis de ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml exec postgres env | grep POSTGRES_PASSWORD

# Ver variáveis de ambiente de CI/CD
docker-compose -f docker-compose.ci.yml exec postgres env | grep POSTGRES_PASSWORD
```

## 🔧 **Comandos de Diagnóstico**

### **Verificar Status dos Containers**
```bash
# Ver status de todos os containers
docker ps -a

# Ver logs de todos os containers PostgreSQL
docker logs $(docker ps -q --filter "ancestor=postgres")

# Ver configurações de rede
docker network ls
docker network inspect secured-guard-network
```

### **Verificar Volumes e Dados**
```bash
# Ver volumes Docker
docker volume ls | grep postgres

# Ver informações dos volumes
docker volume inspect postgres_data_prod
docker volume inspect postgres_data_dev
docker volume inspect postgres_data_ci
```

## ⚠️ **Problemas Comuns**

### **Container não encontrado**
```bash
# Verificar se o container existe
docker ps -a | grep postgres

# Verificar se está rodando
docker ps | grep postgres

# Verificar logs de erro
docker logs NOME_DO_CONTAINER
```

### **Erro de permissão**
```bash
# Executar com sudo se necessário
sudo docker exec secured-guard-db-prod env | grep POSTGRES_PASSWORD

# Verificar permissões do usuário
groups $USER
```

### **Container parado**
```bash
# Iniciar container parado
docker start NOME_DO_CONTAINER

# Ver status
docker ps -a | grep NOME_DO_CONTAINER
```

## 🎯 **Próximos Passos**

1. **Executar comandos** para descobrir as senhas
2. **Anotar as senhas** de cada ambiente
3. **Configurar conexões** no DBeaver
4. **Testar conexões** com cada ambiente
