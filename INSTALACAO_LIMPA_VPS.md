# 🚀 Guia de Instalação Limpa da VPS - Secured Guard CI

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso root ou usuário com sudo
- Mínimo 2GB RAM, 20GB disco
- Portas abertas: 22 (SSH), 80, 443, 8081, 8082, 3333

## 🔧 Passo 1: Atualizar Sistema

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git vim nano htop ufw
```

## 🐳 Passo 2: Instalar Docker

```bash
# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências
apt install -y ca-certificates gnupg lsb-release

# Adicionar chave GPG oficial do Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Adicionar usuário ao grupo docker (se não for root)
usermod -aG docker $USER
```

## 🔐 Passo 3: Configurar Firewall

```bash
# Permitir SSH
ufw allow 22/tcp

# Permitir HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Permitir portas da aplicação
ufw allow 8081/tcp  # Backend
ufw allow 8082/tcp  # Nginx
ufw allow 3333/tcp  # WhatsApp

# Ativar firewall
ufw --force enable
ufw status
```

## 📁 Passo 4: Criar Estrutura de Diretórios

```bash
# Criar diretórios
mkdir -p /var/www/secured_guard/ci/{postgres_data,redis_data,uploads,logs,whatsapp_sessions,backups}
mkdir -p /root/secured_guard

# Ajustar permissões
chmod -R 755 /var/www/secured_guard
chmod -R 755 /root/secured_guard
```

## 🌐 Passo 5: Configurar Redes Docker

```bash
# Criar rede z7network (se não existir)
docker network create z7network 2>/dev/null || echo "Rede z7network já existe"

# Criar rede secured-guard-ci-network
docker network create secured-guard-ci-network 2>/dev/null || echo "Rede já existe"

# Verificar redes
docker network ls
```

## 📥 Passo 6: Clonar Repositório

```bash
# Ir para diretório home
cd /root

# Clonar repositório
git clone https://github.com/zmarioramos/secured-guard.git secured_guard

# Ir para o diretório
cd secured_guard

# Mudar para branch ci
git checkout ci

# Verificar
git branch --show-current
```

## 🔑 Passo 7: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env na raiz do projeto
cd /root/secured_guard
cat > .env << 'EOF'
# PostgreSQL
POSTGRES_PASSWORD_CI=4KaCiJc6an@7sgbdcid2025
POSTGRES_DB=secured_guard_ci
POSTGRES_USER=secured_guard_ci

# Redis
REDIS_PASSWORD=redis_ci_2025

# JWT (mínimo 64 bytes para HS512)
JWT_SECRET=jwt_secret_ci_2025_secure_key_64bytes_minimum_required_for_hmac_sha512_algorithm_secure_extra_long_key

# URLs
API_URL=https://ci.z7botsolutions.com.br/api
FRONTEND_URL=https://ci.z7botsolutions.com.br
EOF

# Ajustar permissões
chmod 600 .env
```

## 🐳 Passo 8: Verificar Docker Compose

```bash
# Ir para diretório CI
cd /root/secured_guard/ci

# Verificar se docker-compose.ci.yml existe
ls -la docker-compose.ci.yml

# Verificar configuração do Nginx
ls -la nginx/ci.conf
```

## 🚀 Passo 9: Primeiro Deploy (via GitHub Actions)

O deploy automático via GitHub Actions irá:
1. Buildar as imagens Docker
2. Fazer push para Docker Hub
3. Fazer pull no servidor
4. Iniciar os containers

**Para ativar o deploy:**
1. Vá para: https://github.com/zmarioramos/secured-guard/actions
2. Selecione o workflow "Deploy CI Environment"
3. Clique em "Run workflow"
4. Selecione branch `ci`
5. Clique em "Run workflow"

## 🔧 Passo 10: Deploy Manual (Alternativa)

Se preferir fazer deploy manual:

```bash
# Fazer login no Docker Hub
docker login

# Fazer pull das imagens
docker pull z7design/secured-guard-backend:ci
docker pull z7design/secured-guard-frontend:ci
docker pull z7design/secured-guard-whatsapp:ci

# Ir para diretório CI
cd /root/secured_guard/ci

# Iniciar containers
docker compose -f docker-compose.ci.yml up -d

# Verificar status
docker compose -f docker-compose.ci.yml ps

# Ver logs
docker compose -f docker-compose.ci.yml logs -f
```

## ✅ Passo 11: Verificação

```bash
# Verificar containers rodando
docker ps

# Verificar redes
docker network ls | grep -E "(z7network|secured-guard)"

# Verificar logs do backend
docker logs secured-guard-backend-ci --tail 50

# Verificar logs do Nginx
docker logs secured-guard-nginx-ci --tail 50

# Testar conectividade
curl -I http://localhost:8081/api/health
curl -I http://localhost:8082
```

## 🔍 Troubleshooting

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose -f docker-compose.ci.yml logs

# Reiniciar containers
docker compose -f docker-compose.ci.yml restart

# Recriar containers
docker compose -f docker-compose.ci.yml up -d --force-recreate
```

### Erro de permissões

```bash
# Ajustar permissões dos volumes
chmod -R 755 /var/www/secured_guard/ci
chown -R root:root /var/www/secured_guard/ci
```

### Erro de rede

```bash
# Remover e recriar redes
docker network rm z7network secured-guard-ci-network
docker network create z7network
docker network create secured-guard-ci-network
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs do PostgreSQL
docker logs secured-guard-db-ci

# Testar conexão
docker exec -it secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci
```

## 📝 Checklist Final

- [ ] Sistema atualizado
- [ ] Docker instalado e funcionando
- [ ] Docker Compose instalado
- [ ] Firewall configurado
- [ ] Diretórios criados
- [ ] Redes Docker criadas
- [ ] Repositório clonado (branch `ci`)
- [ ] Arquivo `.env` criado
- [ ] Containers iniciados
- [ ] Backend respondendo em `http://localhost:8081/api/health`
- [ ] Frontend acessível em `http://localhost:8082`
- [ ] Nginx funcionando

## 🎯 Próximos Passos

1. Configurar domínio `ci.z7botsolutions.com.br` apontando para o IP da VPS
2. Configurar SSL/HTTPS (Let's Encrypt)
3. Configurar backup automático
4. Configurar monitoramento

## 📚 Documentação Adicional

- `COMANDOS_EXECUTAR_SERVIDOR.md` - Comandos úteis
- `COMANDOS_GIT_CI.md` - Comandos Git
- `INSTRUCOES_CONFIGURACAO_CI.md` - Instruções detalhadas

