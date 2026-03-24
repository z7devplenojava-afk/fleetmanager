# 📤 Arquivos Transferidos para VPS pelo Workflow

## ✅ Sim, o workflow envia arquivos para a VPS!

### 📋 Arquivos Transferidos

O workflow `deploy-ci-docker.yml` transfere os seguintes arquivos:

#### 1. **docker-compose.ci.yml**
- **Origem:** Raiz do projeto
- **Destino:** `/var/www/secured_guard/ci/docker-compose.ci.yml`
- **Uso:** Arquivo principal do Docker Compose para o ambiente CI

#### 2. **nginx/ci.conf**
- **Origem:** `nginx/ci.conf` (raiz do projeto)
- **Destino:** `/var/www/secured_guard/ci/nginx/ci.conf`
- **Uso:** Configuração do Nginx para o ambiente CI

#### 3. **.env** (criado dinamicamente)
- **Origem:** Criado localmente no workflow
- **Destino:** `/var/www/secured_guard/ci/.env`
- **Conteúdo:**
  - `ENVIRONMENT=ci`
  - `APP_URL=https://ci.z7botsolutions.com.br`
  - `POSTGRES_PASSWORD_CI` (do secret)
  - `REDIS_PASSWORD` (do secret)
  - `JWT_SECRET` (validado e configurado)
  - `DOCKER_USERNAME` e `DOCKER_PASSWORD` (do secrets)

### 📁 Diretórios Criados na VPS

O workflow também cria os seguintes diretórios na VPS:

```
/var/www/secured_guard/ci/
├── uploads/
├── logs/
├── nginx/
├── postgres_data/
├── redis_data/
├── evolution_instances/
├── holerites/
└── whatsapp_sessions/
```

### 🔄 Processo de Transferência

1. **Criação de diretórios:**
   - Cria todos os diretórios necessários na VPS
   - Usa retry (3 tentativas) se falhar

2. **Transferência de arquivos:**
   - Usa `scp` (Secure Copy) via SSH
   - Usa `sshpass` para autenticação com senha
   - Retry automático (3 tentativas) se falhar
   - Timeout de 30 segundos por conexão

3. **Configuração de .env:**
   - Cria arquivo `.env` localmente
   - Valida JWT_SECRET (mínimo 64 caracteres)
   - Transfere para VPS
   - Define permissões 600 (apenas leitura/escrita pelo dono)

### 🔐 Autenticação

- **Método:** SSH com senha (usando `sshpass`)
- **Credenciais:** Vindas dos secrets do GitHub:
  - `VPS_HOST`
  - `VPS_USER`
  - `VPS_PASSWORD`

### ⚙️ Configurações SSH

O workflow usa estas opções SSH para conexões robustas:

```bash
SSH_OPTS="-o StrictHostKeyChecking=no 
          -o UserKnownHostsFile=/dev/null 
          -o LogLevel=ERROR 
          -o ConnectTimeout=30 
          -o ServerAliveInterval=60 
          -o ServerAliveCountMax=3 
          -o BatchMode=no"
```

### 📊 Resumo

| Arquivo | Status | Localização VPS |
|---------|--------|----------------|
| `docker-compose.ci.yml` | ✅ Transferido | `/var/www/secured_guard/ci/` |
| `nginx/ci.conf` | ✅ Transferido | `/var/www/secured_guard/ci/nginx/` |
| `.env` | ✅ Criado e transferido | `/var/www/secured_guard/ci/.env` |

### 🚀 O que NÃO é transferido

- **Código fonte:** Não é transferido (as imagens Docker já contêm o código compilado)
- **Imagens Docker:** São enviadas para Docker Hub, não diretamente para VPS
- **Arquivos de build:** Não são transferidos (apenas as imagens Docker)

### 💡 Fluxo Completo

1. ✅ Build do código (Backend e Frontend)
2. ✅ Build das imagens Docker
3. ✅ Push das imagens para Docker Hub
4. ✅ **Transferência de arquivos de configuração para VPS**
5. ✅ Pull das imagens na VPS
6. ✅ Inicialização dos containers

### 🔍 Verificar se os arquivos foram transferidos

Para verificar se os arquivos foram transferidos corretamente, você pode executar na VPS:

```bash
ssh usuario@vps
cd /var/www/secured_guard/ci
ls -la
# Deve mostrar: docker-compose.ci.yml e .env

ls -la nginx/
# Deve mostrar: ci.conf
```

### ⚠️ Problemas Comuns

1. **Arquivo não encontrado:**
   - Verificar se `docker-compose.ci.yml` existe na raiz do projeto
   - Verificar se `nginx/ci.conf` existe

2. **Falha na transferência:**
   - Verificar credenciais SSH (VPS_HOST, VPS_USER, VPS_PASSWORD)
   - Verificar conectividade com a VPS
   - Verificar permissões na VPS

3. **Arquivo .env não criado:**
   - Verificar se os secrets estão configurados
   - Verificar logs do workflow para ver erros de validação

