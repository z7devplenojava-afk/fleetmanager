# 🔐 Secrets Completos do GitHub Actions

## 📋 **LISTA COMPLETA DE SECRETS PARA CONFIGURAR**

Configure em: **Settings → Secrets and variables → Actions → New repository secret**

---

## 🌐 **1. URLs da Aplicação**

```yaml
# API Principal
API_URL: https://api.seu-dominio.com

# API Ambiente CI
CI_API_URL: https://ci.z7botsolutions.com.br/api

# URL do Frontend
VITE_API_URL: https://api.seu-dominio.com
VITE_WS_URL: wss://api.seu-dominio.com/ws
```

---

## 🔑 **2. Autenticação**

```yaml
# Token de SUPER_ADMIN (gerar via login no sistema)
API_ADMIN_TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb3NlLnJhbW9zIiwicm9sZXMiOlsiU1VQRVJfQURNSU4iXX0...

# JWT Secret (mesmo do application.properties)
JWT_SECRET: ChaveSecretaJWT789SuperSegura!
```

---

## 🖥️ **3. VPS Principal (Deploy)**

```yaml
# IP ou domínio da VPS principal
VPS_HOST: 192.168.1.100

# Usuário SSH
VPS_USER: deploy

# Porta SSH (padrão: 22)
VPS_PORT: 22

# Chave Privada SSH (COMPLETA)
VPS_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
  NhAAAAAwEAAQAAAYEAqL8...
  (sua chave privada completa aqui)
  ...
  -----END OPENSSH PRIVATE KEY-----

# URL da VPS (opcional)
VPS_URL: https://seu-dominio.com
```

---

## 💾 **4. VPS Remota de Backup (SEGUNDA VPS)**

```yaml
# IP da VPS de Backup Remoto
BACKUP_VPS_HOST: 62.169.27.98

# Usuário SSH da VPS de Backup
BACKUP_VPS_USER: root

# Senha da VPS de Backup
BACKUP_VPS_PASSWORD: YdV0EJCuQ6mmH58

# Porta SSH da VPS de Backup (padrão: 22)
BACKUP_VPS_PORT: 22

# Chave SSH da VPS de Backup (se usar chave ao invés de senha)
BACKUP_VPS_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  (chave privada da VPS de backup)
  -----END OPENSSH PRIVATE KEY-----
```

---

## 🗄️ **5. Banco de Dados - VPS Principal**

```yaml
# Nome do banco
POSTGRES_DB: secured_guard

# Usuário do PostgreSQL
POSTGRES_USER: postgres

# Senha do PostgreSQL (PRODUÇÃO)
POSTGRES_PASSWORD: SuaSenhaSuperSegura123!

# Senha do PostgreSQL (CI)
POSTGRES_PASSWORD_CI: SenhaDoAmbienteCI

# Porta do PostgreSQL
POSTGRES_PORT: 5432
```

---

## 💾 **6. Banco de Dados - VPS Remota de Backup**

```yaml
# Host do banco de backup remoto
BACKUP_DB_HOST: 62.169.27.98

# Porta do PostgreSQL na VPS remota
BACKUP_DB_PORT: 5432

# Usuário do PostgreSQL na VPS remota
BACKUP_DB_USER: postgres

# Senha do PostgreSQL na VPS remota
BACKUP_DB_PASSWORD: YdV0EJCuQ6mmH58

# Nome do banco de backup na VPS remota
BACKUP_DB_NAME: vps_secured_guard_backup

# Nome do banco local de backup
LOCAL_BACKUP_DB_NAME: secured_guard_backup
```

---

## 🔴 **7. Redis**

```yaml
# Senha do Redis
REDIS_PASSWORD: RedisSenhaSegura456!
```

---

## 🐳 **8. Docker Hub**

```yaml
# Usuário do Docker Hub
DOCKER_USERNAME: zemarioramos

# Senha/Token do Docker Hub
DOCKER_PASSWORD: dckr_pat_xxxxxxxxxxxxxxxxxxxxx
```

---

## 📧 **9. Notificações (Opcional)**

```yaml
# Slack Webhook (opcional)
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Email SMTP (opcional)
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: notificacoes@seu-dominio.com
SMTP_PASSWORD: SenhaDoEmail123
```

---

## 📝 **Como Adicionar no GitHub**

### **Passo a Passo:**

1. Vá no seu repositório GitHub
2. **Settings** (⚙️)
3. **Secrets and variables** (menu lateral esquerdo)
4. **Actions**
5. **New repository secret**
6. Cole o nome e valor
7. **Add secret**

---

## ✅ **Checklist de Configuração**

### **Essenciais (Obrigatórios):**
- [ ] `API_URL`
- [ ] `API_ADMIN_TOKEN`
- [ ] `VPS_HOST`
- [ ] `VPS_USER`
- [ ] `VPS_SSH_KEY`
- [ ] `POSTGRES_PASSWORD`
- [ ] `JWT_SECRET`

### **Backup Remoto (Segunda VPS):**
- [ ] `BACKUP_VPS_HOST` → `62.169.27.98`
- [ ] `BACKUP_VPS_USER` → `root`
- [ ] `BACKUP_VPS_PASSWORD` → `YdV0EJCuQ6mmH58`
- [ ] `BACKUP_DB_HOST` → `62.169.27.98`
- [ ] `BACKUP_DB_PASSWORD` → `YdV0EJCuQ6mmH58`
- [ ] `BACKUP_DB_NAME` → `vps_secured_guard_backup`

### **Opcionais:**
- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD`
- [ ] `SLACK_WEBHOOK_URL`
- [ ] `REDIS_PASSWORD`

---

## 🔐 **Segurança**

### ⚠️ **IMPORTANTE:**
- ✅ **NUNCA** commitar senhas no código
- ✅ **SEMPRE** usar GitHub Secrets
- ✅ Usar chaves SSH ao invés de senhas quando possível
- ✅ Renovar senhas periodicamente
- ✅ Usar senhas fortes (mínimo 16 caracteres)

### 🔒 **Boas Práticas:**
- Criar usuário específico para deploy (não usar `root` em produção)
- Usar autenticação de 2 fatores no GitHub
- Limitar acesso SSH por IP quando possível
- Fazer backup das chaves SSH

---

## 🧪 **Testar Conexão com VPS Remota**

### **SSH:**
```bash
ssh root@62.169.27.98
# Senha: YdV0EJCuQ6mmH58
```

### **PostgreSQL:**
```bash
psql -h 62.169.27.98 -U postgres -d postgres
# Senha: YdV0EJCuQ6mmH58
```

---

## 📊 **Estrutura de Backup**

```
VPS PRINCIPAL (192.168.x.x)
├── Banco: secured_guard (produção)
└── Banco: secured_guard_backup (backup local)

VPS REMOTA (62.169.27.98)
└── Banco: vps_secured_guard_backup (backup remoto)
```

**Redundância:** ✅ **3 cópias do banco de dados!**

---

**SECRETS CONFIGURADOS COM SUCESSO!** 🔐✅

