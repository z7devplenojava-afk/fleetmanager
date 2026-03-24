# Instruções para Configurar o Ambiente CI no Servidor

## ⚠️ Problemas Identificados

1. **Docker está em modo Swarm** - precisa sair do modo Swarm
2. **Diretório do projeto** - pode estar em `/root/secured_guard/ci` ou `/var/www/secured_guard/ci`
3. **Redes Docker não existem** - precisam ser criadas

## 🔧 Solução Rápida

### Opção 1: Script Rápido (Recomendado)

```bash
# 1. Baixar e executar o script de configuração rápida
cd /root/secured_guard
wget -O configurar-ci-rapido.sh https://raw.githubusercontent.com/zmarioramos/secured-guard/ci/configurar-ci-rapido.sh
# OU se já tiver o arquivo:
chmod +x configurar-ci-rapido.sh
./configurar-ci-rapido.sh

# 2. Iniciar os containers
cd /root/secured_guard/ci
docker-compose -f docker-compose.ci.yml up -d
```

### Opção 2: Configuração Manual Completa

```bash
# 1. Sair do modo Swarm
docker swarm leave --force

# 2. Criar redes Docker
docker network create z7network
docker network create secured-guard-ci-network

# 3. Criar diretórios de volumes
mkdir -p /var/www/secured_guard/ci/postgres_data
mkdir -p /var/www/secured_guard/ci/redis_data
mkdir -p /var/www/secured_guard/ci/uploads
mkdir -p /var/www/secured_guard/ci/logs
mkdir -p /var/www/secured_guard/ci/whatsapp_sessions

# 4. Ir para o diretório do projeto
cd /root/secured_guard/ci

# 5. Iniciar containers
docker-compose -f docker-compose.ci.yml up -d
```

### Opção 2: Configuração Manual

```bash
# 1. Sair do modo Swarm
docker swarm leave --force

# 2. Criar diretório correto
mkdir -p /var/www/secured_guard/ci
cd /var/www/secured_guard

# 3. Clonar o repositório (se ainda não tiver)
git clone https://github.com/zmarioramos/secured-guard.git . || cd secured_guard
git checkout ci

# 4. Criar redes Docker
docker network create z7network 2>/dev/null || echo "Rede z7network já existe"
docker network create secured-guard-ci-network 2>/dev/null || echo "Rede secured-guard-ci-network já existe"

# 5. Criar diretórios necessários
cd ci
mkdir -p postgres_data redis_data uploads logs whatsapp_sessions backups

# 6. Iniciar containers
docker-compose -f docker-compose.ci.yml up -d
```

## 📋 Verificações

### Verificar se os containers estão rodando:
```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml ps
```

### Verificar logs:
```bash
# Todos os containers
docker-compose -f docker-compose.ci.yml logs -f

# Container específico
docker logs secured-guard-backend-ci -f
docker logs secured-guard-nginx-ci -f
docker logs secured-guard-frontend-ci -f
```

### Verificar redes:
```bash
docker network ls | grep -E "(z7network|secured-guard)"
```

## ⚠️ Importante

- **NÃO use** `docker-compose up -d` no diretório raiz
- **USE** `docker-compose -f docker-compose.ci.yml up -d` no diretório `/var/www/secured_guard/ci`
- O diretório correto é `/var/www/secured_guard/ci` (com underscore `_`, não hífen `-`)

## 🔍 Troubleshooting

### Se o Docker ainda estiver em modo Swarm:
```bash
docker swarm leave --force
```

### Se as redes não existirem:
```bash
docker network create z7network
docker network create secured-guard-ci-network
```

### Se os containers não iniciarem:
```bash
cd /var/www/secured_guard/ci
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

### Verificar se o arquivo nginx/ci.conf existe:
```bash
ls -la /var/www/secured_guard/ci/nginx/ci.conf
```

Se não existir, certifique-se de que o projeto foi clonado corretamente:
```bash
cd /var/www/secured_guard
git pull origin ci
```

