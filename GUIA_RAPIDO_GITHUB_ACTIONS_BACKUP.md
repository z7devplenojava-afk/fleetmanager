# 🚀 Guia Rápido: Configurar GitHub Actions + Backup

## ⚡ **5 Passos para Ativar CI/CD com Backup**

---

## 📋 **1. Configurar Secrets no GitHub**

No seu repositório: **Settings → Secrets and variables → Actions → New repository secret**

### **Adicione os seguintes secrets:**

```yaml
# API URLs
API_URL: https://api.seu-dominio.com
CI_API_URL: https://ci.z7botsolutions.com.br/api

# Token de Admin (gerar no sistema)
API_ADMIN_TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# VPS Credentials
VPS_HOST: 192.168.1.100
VPS_USER: deploy
VPS_PORT: 22
VPS_SSH_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  sua_chave_privada_ssh_aqui
  -----END OPENSSH PRIVATE KEY-----

# Database
POSTGRES_DB: secured_guard
POSTGRES_USER: postgres
POSTGRES_PASSWORD: SuaSenhaSuperSegura123!
POSTGRES_PASSWORD_CI: SenhaDoAmbienteCI

# Redis
REDIS_PASSWORD: RedisSenhaSegura456!

# JWT
JWT_SECRET: ChaveSecretaJWT789SuperSegura!
```

---

## 🔑 **2. Gerar Token de Admin**

### **Via SQL direto no banco:**

```sql
-- 1. Gerar um JWT token de SUPER_ADMIN
-- Usar a API /api/auth/login com usuário SUPER_ADMIN
-- O token estará na resposta JSON

-- OU criar script para gerar token
-- Exemplo: POST /api/auth/login
-- Body: { "username": "jose.ramos", "password": "Admin1234" }
-- Resposta: { "accessToken": "eyJhbGc..." }
```

### **Copiar o `accessToken` e adicionar como `API_ADMIN_TOKEN` nos secrets**

---

## 🗄️ **3. Criar Configuração de Backup para PROD**

### **Via API ou Frontend:**

```bash
POST https://api.seu-dominio.com/api/backup/configurations
Authorization: Bearer {SEU_TOKEN}
Content-Type: application/json

{
  "name": "Backup PROD",
  "type": "REMOTE",
  "host": "192.168.1.100",
  "port": 5432,
  "database": "secured_guard",
  "username": "postgres",
  "password": "SuaSenha",
  "backupPath": "/var/backups/secured-guard/prod",
  "enabled": true,
  "autoBackup": true,
  "schedule": "0 0 2 * * ?",
  "retentionDays": 30,
  "compressBackup": true,
  "environment": "PROD",
  "backupType": "INCREMENTAL",
  "encryptionEnabled": true,
  "checksumEnabled": true
}
```

### **Repetir para CI, DEV, TEST se necessário**

---

## 🔐 **4. Configurar Chave SSH**

### **Gerar chave SSH (se ainda não tiver):**

```bash
ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"
```

### **Adicionar chave pública na VPS:**

```bash
# Na sua VPS:
mkdir -p ~/.ssh
echo "sua_chave_publica_aqui" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### **Copiar chave PRIVADA e adicionar como `VPS_SSH_KEY` nos secrets**

---

## ✅ **5. Testar o Pipeline**

### **Opção 1: Deploy Manual**

No GitHub:
1. Vá em **Actions**
2. Selecione **"Deploy PROD com Backup"**
3. Clique **"Run workflow"**
4. Branch: `main`
5. Skip backup: `false`
6. Clique **"Run workflow"**

---

### **Opção 2: Push Automático**

```bash
# No seu projeto local:
git add .
git commit -m "feat: ativar CI/CD com backup"
git push origin main
```

O pipeline será executado automaticamente! 🚀

---

## 📊 **6. Verificar Logs**

No GitHub Actions, você verá:

```
✅ PRÉ-DEPLOY BACKUP
  💾 Backup executado com sucesso!
  📦 Backup ID: backup_prod_20251101_140530

✅ BUILD
  🔨 Backend build concluído!
  🎨 Frontend build concluído!

✅ DEPLOY
  🚀 Deploy concluído!

✅ HEALTH CHECK
  🏥 Aplicação respondendo!

✅ VERIFICAÇÃO
  🔍 Integridade verificada!

✅ PÓS-DEPLOY BACKUP
  💾 Backup marcado como estável!

🎉 DEPLOY CONCLUÍDO COM SUCESSO!
```

---

## 🔄 **7. Testar Rollback**

### **Simular falha de deploy:**

```yaml
# No workflow, forçar falha no health check
# Você verá:

❌ HEALTH CHECK FALHOU

🚨 ROLLBACK AUTOMÁTICO
  🔄 Restaurando backup...
  ✅ Rollback executado!

📧 EQUIPE NOTIFICADA
```

---

## 📅 **8. Verificar Backups Agendados**

O workflow **backup-scheduled.yml** roda automaticamente:

| Horário | Ambiente | Tipo | Frequência |
|---------|----------|------|------------|
| 00:00 | CI | LOGS_ONLY | Diário |
| 02:00 | PROD | INCREMENTAL | Diário |
| 01:00 (Dom) | PROD | FULL | Semanal |

---

## 🧪 **Endpoints Disponíveis para CI/CD**

### **1. Executar Backup por Ambiente**
```bash
POST /api/backup/execute/env/{environmentName}
# environmentName: ci, dev, test, prod
```

### **2. Restaurar Último Backup Estável**
```bash
POST /api/backup/restore/last-stable
Body: { "environment": "PROD" }
```

### **3. Marcar Backup como Estável**
```bash
POST /api/backup/mark-stable/{backupId}
```

---

## ✅ **Checklist de Configuração**

- [ ] Secrets configurados no GitHub
- [ ] Token de SUPER_ADMIN gerado
- [ ] Configuração de backup PROD criada
- [ ] Chave SSH configurada na VPS
- [ ] Banco de backup criado (`secured_guard_backup`)
- [ ] Diretório de backup criado (`/var/backups/secured-guard/prod`)
- [ ] Teste manual do backup via API
- [ ] Teste do pipeline completo
- [ ] Verificar logs do GitHub Actions
- [ ] Testar rollback

---

## 🎯 **Próximos Passos Opcionais**

1. **Configurar notificações Slack/Telegram** (adicionar ao workflow)
2. **Integrar Prometheus/Grafana** para monitoramento
3. **Configurar Vault** para gerenciar secrets
4. **Adicionar testes automatizados** antes do deploy
5. **Implementar backup para S3/Backblaze** via Rclone

---

## 🆘 **Troubleshooting**

### **Erro: "Nenhuma configuração ativa encontrada"**
→ Criar configuração de backup via API (passo 3)

### **Erro: "Backup não encontrado"**
→ Executar pelo menos 1 backup manual primeiro

### **Erro: "Authentication failed"**
→ Verificar `API_ADMIN_TOKEN` nos secrets

### **Erro: "Connection refused" na VPS**
→ Verificar `VPS_SSH_KEY` e `VPS_HOST`

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verificar logs do GitHub Actions
2. Verificar logs do backend Spring Boot
3. Testar endpoints via Postman/Curl
4. Verificar banco de dados (tabela `backup_configurations` e `backup_history`)

---

**SISTEMA DE CI/CD COM BACKUP PRONTO PARA USO!** ✅🔗🚀

---

**Estimativa de tempo total de configuração: 15-30 minutos**

