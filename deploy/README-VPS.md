# 🚀 Deploy SecuredGuard na VPS Ubuntu

Este guia mostra como fazer deploy completo do SecuredGuard em uma VPS Ubuntu limpa.

## 📋 Pré-requisitos

- VPS Ubuntu 20.04/22.04
- Acesso SSH com chave configurada
- Domínio apontando para a VPS (opcional)

## 🛠️ Instalação Automática

### Opção 1: Script Automático (Recomendado)

```bash
# 1. Execute o script de deploy automático
chmod +x deploy/deploy-to-vps.sh
./deploy/deploy-to-vps.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar firewall e segurança
- ✅ Criar estrutura de diretórios
- ✅ Configurar SSL self-signed
- ✅ Copiar código do projeto
- ✅ Fazer deploy automático

### Opção 2: Instalação Manual

#### 1. Conectar na VPS
```bash
ssh usuario@ip-da-vps
```

#### 2. Executar instalação
```bash
# Copiar script de instalação
scp deploy/install-vps.sh usuario@ip-da-vps:/tmp/

# Conectar e executar
ssh usuario@ip-da-vps
chmod +x /tmp/install-vps.sh
/tmp/install-vps.sh
```

#### 3. Fazer logout e login novamente
```bash
exit
ssh usuario@ip-da-vps
```

#### 4. Copiar código do projeto
```bash
# Do seu computador local
rsync -avz --exclude='node_modules/' --exclude='target/' --exclude='.git/' \
  ./ usuario@ip-da-vps:/opt/secured-guard/
```

#### 5. Fazer deploy
```bash
# Na VPS
cd /opt/secured-guard
./deploy.sh
```

## 🔧 Configuração Pós-Instalação

### 1. Configurar Domínio (Opcional)

Se você tem um domínio:

```bash
# Editar arquivo de ambiente
nano /opt/secured-guard/.env

# Adicionar:
DOMAIN=seudominio.com
```

### 2. Configurar SSL Real (Opcional)

Para SSL real com Let's Encrypt:

```bash
# Instalar Certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem /opt/secured-guard/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem /opt/secured-guard/ssl/key.pem
sudo chown $USER:$USER /opt/secured-guard/ssl/*

# Reiniciar nginx
docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml restart nginx
```

### 3. Configurar Backup Automático

O backup automático já está configurado para rodar diariamente às 2h da manhã.

Para fazer backup manual:
```bash
/opt/secured-guard/backup.sh
```

## 📊 Monitoramento

### Ver Status dos Serviços
```bash
cd /opt/secured-guard
docker compose -f deploy/docker-compose.prod.yml ps
```

### Ver Logs
```bash
# Todos os serviços
docker compose -f deploy/docker-compose.prod.yml logs -f

# Apenas backend
docker compose -f deploy/docker-compose.prod.yml logs -f backend

# Apenas frontend
docker compose -f deploy/docker-compose.prod.yml logs -f frontend
```

### Verificar Saúde
```bash
# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost/
```

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# 1. Fazer backup
/opt/secured-guard/backup.sh

# 2. Parar serviços
cd /opt/secured-guard
docker compose -f deploy/docker-compose.prod.yml down

# 3. Copiar novo código (do seu computador)
rsync -avz --exclude='node_modules/' --exclude='target/' --exclude='.git/' \
  ./ usuario@ip-da-vps:/opt/secured-guard/

# 4. Fazer deploy
cd /opt/secured-guard
./deploy.sh
```

## 🛡️ Segurança

### Firewall
O firewall está configurado para permitir apenas:
- SSH (porta 22)
- HTTP (porta 80)
- HTTPS (porta 443)

### Fail2Ban
Configurado para proteger contra ataques de força bruta no SSH.

### SSL
Certificados SSL configurados (self-signed por padrão).

## 📁 Estrutura na VPS

```
/opt/secured-guard/
├── deploy/                    # Arquivos de deploy
├── backend/                   # Código do backend
├── frontend/                  # Código do frontend
├── .env                       # Variáveis de ambiente
├── deploy.sh                  # Script de deploy
├── backup.sh                  # Script de backup
├── ssl/                       # Certificados SSL
│   ├── cert.pem
│   └── key.pem
└── backups/                   # Backups automáticos
```

## 🆘 Solução de Problemas

### Serviços não sobem
```bash
# Ver logs detalhados
docker compose -f deploy/docker-compose.prod.yml logs

# Verificar recursos
docker system df
docker system prune  # Limpar recursos não utilizados
```

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker exec secured-guard-db-prod pg_isready -U postgres

# Conectar no banco
docker exec -it secured-guard-db-prod psql -U postgres -d secured_guard
```

### Frontend não carrega
```bash
# Verificar nginx
docker compose -f deploy/docker-compose.prod.yml logs nginx

# Verificar se frontend está rodando
docker compose -f deploy/docker-compose.prod.yml logs frontend
```

### Problemas de permissão
```bash
# Corrigir permissões
sudo chown -R $USER:$USER /opt/secured-guard
sudo chmod +x /opt/secured-guard/*.sh
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker compose -f deploy/docker-compose.prod.yml logs -f`
2. Verifique o status: `docker compose -f deploy/docker-compose.prod.yml ps`
3. Verifique recursos: `docker system df`
4. Reinicie os serviços: `./deploy.sh`

## 🎉 Pronto!

Sua aplicação SecuredGuard está rodando na VPS!

- **Frontend**: https://seu-ip-ou-dominio
- **Backend**: https://seu-ip-ou-dominio/api
- **Logs**: `/var/log/secured-guard/`
- **Backups**: `/opt/secured-guard/backups/`
