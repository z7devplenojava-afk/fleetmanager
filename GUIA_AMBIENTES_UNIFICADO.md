# 🚀 SecuredGuard - Guia de Ambientes Unificado

Guia completo para configurar e gerenciar todos os ambientes do SecuredGuard: **Local**, **WSL**, **VPS** e **CI/CD**.

## 📋 Pré-requisitos

### Windows + Docker Desktop + WSL
- ✅ **Windows 10/11** com WSL2
- ✅ **Docker Desktop** instalado e rodando
- ✅ **WSL2** com Ubuntu/Debian
- ✅ **PowerShell** (versão 7+ recomendada)
- ✅ **Git** para versionamento

### VPS (Produção)
- ✅ **Ubuntu 20.04+** ou **CentOS 8+**
- ✅ **Docker** e **Docker Compose** instalados
- ✅ **SSH** configurado com chave
- ✅ **Domínio** apontado para IP da VPS (opcional)

## 🎯 Ambientes Disponíveis

| Ambiente | Descrição | Porta | Uso |
|----------|-----------|-------|-----|
| **Local** | Desenvolvimento no Windows | 5173 (Frontend)<br>8080 (Backend)<br>5432 (PostgreSQL)<br>6379 (Redis) | Desenvolvimento diário |
| **Dev** | Desenvolvimento no WSL | 3000 (Frontend)<br>8081 (Backend)<br>5432 (PostgreSQL)<br>6379 (Redis) | Desenvolvimento Linux |
| **Prod** | Produção na VPS | 80/443 (Frontend)<br>8080 (Backend)<br>5432 (PostgreSQL)<br>6379 (Redis) | Produção |
| **CI** | Integração Contínua | 5174 (Frontend)<br>8081 (Backend)<br>55432 (PostgreSQL)<br>6380 (Redis) | Testes automatizados |

## 🚀 Configuração Rápida

### 1. Configuração Automática (Recomendado)

```powershell
# Executar na raiz do projeto
.\setup-environments.ps1 -Environment all -WSL -VPS
```

### 2. Configuração Manual por Ambiente

#### 🏠 Ambiente Local (Windows + Docker Desktop)
```powershell
# Configurar ambiente local
.\setup-environments.ps1 -Environment local

# Ou usar o gerenciador
.\manage-environments.ps1 -Action setup -Environment local
.\manage-environments.ps1 -Action start -Environment local
```

#### 🐧 Ambiente WSL
```bash
# No WSL
cd /mnt/c/dev/secured-guard
chmod +x deploy/setup-wsl.sh
./deploy/setup-wsl.sh
```

#### ☁️ Ambiente VPS (Produção)
```powershell
# Deploy para VPS
.\manage-environments.ps1 -Action deploy -Environment prod
```

## 🎮 Gerenciador de Ambientes

O script `manage-environments.ps1` é o **centro de controle** de todos os ambientes:

### Comandos Principais

```powershell
# Iniciar ambiente
.\manage-environments.ps1 -Action start -Environment local

# Parar ambiente
.\manage-environments.ps1 -Action stop -Environment local

# Reiniciar ambiente
.\manage-environments.ps1 -Action restart -Environment local

# Ver status
.\manage-environments.ps1 -Action status -Environment all

# Ver logs
.\manage-environments.ps1 -Action logs -Environment prod -Service backend -Follow

# Deploy para VPS
.\manage-environments.ps1 -Action deploy -Environment prod

# Configurar ambiente
.\manage-environments.ps1 -Action setup -Environment dev

# Limpar ambiente (remove volumes)
.\manage-environments.ps1 -Action clean -Environment local -Force
```

### Exemplos Práticos

```powershell
# Desenvolvimento local completo
.\manage-environments.ps1 -Action start -Environment local
.\manage-environments.ps1 -Action logs -Environment local -Follow

# Deploy para produção
.\manage-environments.ps1 -Action deploy -Environment prod

# Monitoramento de todos os ambientes
.\manage-environments.ps1 -Action status -Environment all

# Logs do backend em produção
.\manage-environments.ps1 -Action logs -Environment prod -Service backend -Follow
```

## 🏗️ Estrutura de Arquivos

```
secured-guard/
├── 🎯 Scripts Principais
│   ├── setup-environments.ps1          # Configuração automática
│   ├── manage-environments.ps1         # Gerenciador unificado
│   └── deploy.sh                       # Deploy VPS (original)
│
├── 🐧 Scripts WSL
│   ├── deploy/setup-wsl.sh             # Configuração WSL
│   └── deploy/deploy-to-vps-wsl.sh     # Deploy VPS via WSL
│
├── 🐳 Docker Compose
│   ├── docker-compose.yml              # Desenvolvimento (original)
│   ├── deploy/docker-compose.local.yml # Local otimizado
│   ├── deploy/docker-compose.dev.yml   # Desenvolvimento
│   ├── deploy/docker-compose.prod.yml  # Produção
│   └── deploy/docker-compose.ci.yml    # CI/CD
│
├── ⚙️ Configurações
│   ├── .env.local                      # Ambiente local
│   ├── deploy/env.dev                  # Desenvolvimento
│   ├── deploy/env.prod                 # Produção
│   └── deploy/env.ci                   # CI/CD
│
└── 🌐 Nginx
    └── deploy/nginx/
        ├── nginx-local.conf            # Proxy local
        └── nginx.conf                  # Produção
```

## 🔧 Configurações por Ambiente

### 🏠 Local (Windows + Docker Desktop)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Características**: Hot reload, logs detalhados, volumes persistentes

### 🐧 WSL (Linux no Windows)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Características**: Performance Linux, rsync nativo, SSH otimizado

### ☁️ Produção (VPS)
- **Frontend**: http://IP_VPS ou https://seudominio.com
- **Backend**: http://IP_VPS:8080
- **Database**: localhost:5432 (interno)
- **Redis**: localhost:6379 (interno)
- **Características**: SSL, domínio, monitoramento, backup automático

### 🧪 CI/CD (GitHub Actions)
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8081
- **Database**: localhost:55432
- **Redis**: localhost:6380
- **Características**: Testes automatizados, builds isolados

## 🚀 Workflows de Desenvolvimento

### 1. Desenvolvimento Local
```powershell
# 1. Configurar ambiente
.\setup-environments.ps1 -Environment local

# 2. Iniciar desenvolvimento
.\manage-environments.ps1 -Action start -Environment local

# 3. Ver logs em tempo real
.\manage-environments.ps1 -Action logs -Environment local -Follow

# 4. Fazer alterações no código
# (Hot reload automático)

# 5. Parar quando terminar
.\manage-environments.ps1 -Action stop -Environment local
```

### 2. Desenvolvimento WSL
```bash
# 1. Abrir WSL
wsl

# 2. Navegar para projeto
cd /mnt/c/dev/secured-guard

# 3. Configurar WSL
./deploy/setup-wsl.sh

# 4. Desenvolvimento normal
# (Mesma experiência que Linux)
```

### 3. Deploy para Produção
```powershell
# 1. Testar localmente
.\manage-environments.ps1 -Action start -Environment local
.\manage-environments.ps1 -Action logs -Environment local

# 2. Deploy para VPS
.\manage-environments.ps1 -Action deploy -Environment prod

# 3. Verificar produção
.\manage-environments.ps1 -Action status -Environment prod
.\manage-environments.ps1 -Action logs -Environment prod -Service backend
```

## 🔍 Monitoramento e Logs

### Ver Status de Todos os Ambientes
```powershell
.\manage-environments.ps1 -Action status -Environment all
```

### Logs em Tempo Real
```powershell
# Todos os serviços
.\manage-environments.ps1 -Action logs -Environment prod -Follow

# Serviço específico
.\manage-environments.ps1 -Action logs -Environment local -Service backend -Follow

# Apenas erros
.\manage-environments.ps1 -Action logs -Environment prod -Service backend | Select-String "ERROR"
```

### Health Checks
```bash
# Backend
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost:5173

# Database (via container)
docker exec secured-guard-db-local pg_isready -U postgres

# Redis (via container)
docker exec secured-guard-redis-local redis-cli ping
```

## 🛠️ Solução de Problemas

### Problemas Comuns

#### 1. Docker Desktop não está rodando
```powershell
# Verificar se Docker está rodando
docker --version
docker info

# Se não estiver rodando, iniciar Docker Desktop
```

#### 2. Portas em uso
```powershell
# Verificar portas em uso
netstat -an | findstr ":8080"
netstat -an | findstr ":5432"

# Parar outros serviços ou usar portas diferentes
```

#### 3. Problemas de permissão WSL
```bash
# Corrigir permissões
sudo chown -R $USER:$USER /mnt/c/dev/secured-guard
```

#### 4. Problemas de rede Docker
```powershell
# Limpar redes Docker
docker network prune -f
docker system prune -f
```

#### 5. Problemas de volume
```powershell
# Limpar volumes (CUIDADO: remove dados)
.\manage-environments.ps1 -Action clean -Environment local -Force
```

### Comandos de Diagnóstico

```powershell
# Status geral
.\manage-environments.ps1 -Action status -Environment all

# Logs de erro
.\manage-environments.ps1 -Action logs -Environment local | Select-String "ERROR"

# Verificar containers
docker ps -a

# Verificar volumes
docker volume ls

# Verificar redes
docker network ls

# Verificar imagens
docker images
```

## 🔐 Segurança

### Variáveis de Ambiente
- ✅ Senhas geradas automaticamente
- ✅ Arquivos `.env` não versionados
- ✅ Diferentes senhas por ambiente
- ✅ JWT secrets únicos

### Produção
- ✅ SSL/TLS configurado
- ✅ Firewall configurado
- ✅ Backup automático
- ✅ Logs centralizados
- ✅ Monitoramento de saúde

## 📚 Comandos Úteis

### Desenvolvimento
```powershell
# Início rápido
.\manage-environments.ps1 -Action start -Environment local

# Logs em tempo real
.\manage-environments.ps1 -Action logs -Environment local -Follow

# Reiniciar após mudanças
.\manage-environments.ps1 -Action restart -Environment local
```

### Produção
```powershell
# Deploy completo
.\manage-environments.ps1 -Action deploy -Environment prod

# Monitoramento
.\manage-environments.ps1 -Action status -Environment prod
.\manage-environments.ps1 -Action logs -Environment prod -Service backend -Follow
```

### Manutenção
```powershell
# Limpeza geral
.\manage-environments.ps1 -Action clean -Environment local -Force

# Backup (na VPS)
ssh usuario@vps '/opt/secured-guard/backup.sh'

# Atualização
git pull origin main
.\manage-environments.ps1 -Action restart -Environment prod
```

## 🎉 Pronto!

Com essa configuração unificada, você tem:

- ✅ **Ambiente local** otimizado para Windows + Docker Desktop
- ✅ **Ambiente WSL** para desenvolvimento Linux
- ✅ **Deploy automatizado** para VPS
- ✅ **CI/CD** configurado
- ✅ **Gerenciamento centralizado** de todos os ambientes
- ✅ **Monitoramento** e logs unificados
- ✅ **Segurança** por ambiente
- ✅ **Backup** e recuperação

**Execute `.\setup-environments.ps1 -Environment all` e comece a desenvolver!** 🚀
