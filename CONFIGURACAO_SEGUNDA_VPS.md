# 🖥️ Configuração da Segunda VPS de Backup

## 📋 **Informações da VPS Remota**

```yaml
IP: 62.169.27.98
Usuário: root
Senha: YdV0EJCuQ6mmH58
Porta SSH: 22
Finalidade: Backup Remoto Offsite
```

---

## 🎯 **Estratégia de Backup Multi-VPS**

```
┌─────────────────────────────────────────────────────┐
│  APLICAÇÃO PRINCIPAL                                 │
│  secured_guard (banco produção)                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ BACKUP AUTOMÁTICO
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌─────────────┐         ┌──────────────┐
│ LOCAL       │         │ VPS REMOTA 1 │
│ Mesmo       │         │ (Principal)  │
│ Servidor    │         │              │
└─────────────┘         └──────────────┘
      │                         │
      │                         │
      └────────────┬────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ VPS REMOTA 2     │
         │ 62.169.27.98     │
         │ (Offsite Backup) │
         └──────────────────┘
```

**Redundância:** ✅ **3 CÓPIAS COMPLETAS!**

---

## 🔧 **1. Preparar a Segunda VPS (62.169.27.98)**

### **1.1. Conectar via SSH:**

```bash
ssh root@62.169.27.98
# Senha: YdV0EJCuQ6mmH58
```

---

### **1.2. Atualizar Sistema:**

```bash
apt update && apt upgrade -y
```

---

### **1.3. Instalar PostgreSQL:**

```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Verificar instalação
psql --version
```

---

### **1.4. Configurar PostgreSQL:**

```bash
# Editar configuração
nano /etc/postgresql/*/main/postgresql.conf
```

**Adicionar/Modificar:**
```conf
listen_addresses = '*'
max_connections = 100
shared_buffers = 256MB
```

**Configurar acesso remoto:**
```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

**Adicionar no final:**
```conf
# Permitir conexões da VPS principal
host    all             all             0.0.0.0/0               md5
```

**Reiniciar PostgreSQL:**
```bash
systemctl restart postgresql
systemctl enable postgresql
```

---

### **1.5. Criar Banco de Backup:**

```bash
# Conectar como postgres
su - postgres

# Criar banco
createdb vps_secured_guard_backup

# Definir senha do usuário postgres
psql
ALTER USER postgres PASSWORD 'YdV0EJCuQ6mmH58';
\q

# Voltar ao root
exit
```

---

### **1.6. Criar Diretórios de Backup:**

```bash
# Criar estrutura de diretórios
mkdir -p /var/backups/secured-guard/vps2/{full,incremental,logs}

# Permissões
chmod -R 755 /var/backups/secured-guard
```

---

### **1.7. Configurar Firewall (UFW):**

```bash
# Permitir SSH
ufw allow 22/tcp

# Permitir PostgreSQL
ufw allow 5432/tcp

# Ativar firewall
ufw enable
ufw status
```

---

## 🔐 **2. Configurar Secrets no GitHub**

Adicione estes secrets em: **Settings → Secrets → Actions**

```yaml
# VPS 2 - SSH
BACKUP_VPS2_HOST: 62.169.27.98
BACKUP_VPS2_USER: root
BACKUP_VPS2_PASSWORD: YdV0EJCuQ6mmH58
BACKUP_VPS2_PORT: 22

# VPS 2 - PostgreSQL
BACKUP_DB2_HOST: 62.169.27.98
BACKUP_DB2_PORT: 5432
BACKUP_DB2_USER: postgres
BACKUP_DB2_PASSWORD: YdV0EJCuQ6mmH58
BACKUP_DB2_NAME: vps_secured_guard_backup
```

---

## 📝 **3. Criar Configuração de Backup no Sistema**

### **Via API (Postman/Curl):**

```bash
POST https://api.seu-dominio.com/api/backup/configurations
Authorization: Bearer {SEU_TOKEN}
Content-Type: application/json

{
  "name": "Backup VPS Remota 2 (Offsite)",
  "type": "REMOTE",
  "host": "62.169.27.98",
  "port": 5432,
  "database": "vps_secured_guard_backup",
  "username": "postgres",
  "password": "YdV0EJCuQ6mmH58",
  "backupPath": "/var/backups/secured-guard/vps2",
  "enabled": true,
  "autoBackup": true,
  "schedule": "0 0 3 * * ?",
  "retentionDays": 30,
  "compressBackup": true,
  "environment": "PROD",
  "backupType": "FULL",
  "encryptionEnabled": true,
  "encryptionKey": "ChaveCriptografia256bits!",
  "checksumEnabled": true
}
```

---

## 🧪 **4. Testar Conexão**

### **4.1. Testar SSH:**

```bash
# Da VPS principal ou do seu computador
ssh root@62.169.27.98
# Senha: YdV0EJCuQ6mmH58
```

---

### **4.2. Testar PostgreSQL:**

```bash
# Testar conexão remota
psql -h 62.169.27.98 -U postgres -d vps_secured_guard_backup
# Senha: YdV0EJCuQ6mmH58

# Se conectar, está OK!
\q
```

---

### **4.3. Testar via API:**

```bash
POST https://api.seu-dominio.com/api/backup/test-connection
Authorization: Bearer {SEU_TOKEN}
Content-Type: application/json

{
  "host": "62.169.27.98",
  "port": 5432,
  "database": "vps_secured_guard_backup",
  "username": "postgres",
  "password": "YdV0EJCuQ6mmH58"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Conexão testada com sucesso!"
}
```

---

## 🚀 **5. Executar Primeiro Backup**

### **Via API:**

```bash
POST https://api.seu-dominio.com/api/backup/execute/{configId}
Authorization: Bearer {SEU_TOKEN}
```

**Verificar logs:**
```bash
# Na VPS 2
ls -lh /var/backups/secured-guard/vps2/
```

---

## 📊 **6. Monitorar Backups**

### **Via API:**

```bash
GET https://api.seu-dominio.com/api/backup/history
Authorization: Bearer {SEU_TOKEN}
```

### **Logs na VPS 2:**

```bash
# Listar backups
ls -lh /var/backups/secured-guard/vps2/

# Ver tamanho total
du -sh /var/backups/secured-guard/vps2/

# Ver backups mais recentes
ls -lt /var/backups/secured-guard/vps2/ | head -10
```

---

## 🔄 **7. Workflow GitHub Actions**

O sistema já está configurado para usar múltiplas VPS!

### **Fluxo Automático:**

```
1. DEPLOY → Backup Pré-Deploy
   ↓
2. Backup executado em TODAS as VPS:
   ├── Local (mesmo servidor)
   ├── VPS 1 (principal)
   └── VPS 2 (62.169.27.98) ✅
   ↓
3. Deploy da aplicação
   ↓
4. Backup Pós-Deploy (marcar como estável)
```

---

## 📅 **8. Agendamento Automático**

| Horário | Local | VPS 1 | VPS 2 | Tipo |
|---------|-------|-------|-------|------|
| 00:00 | ✅ | ✅ | ✅ | LOGS |
| 02:00 | ✅ | ✅ | ✅ | INCREMENTAL |
| 02:00 (Dom) | ✅ | ✅ | ✅ | FULL |

---

## 🛡️ **9. Segurança**

### **✅ Implementado:**
- 🔒 Senhas fortes
- 🔒 Firewall (UFW)
- 🔒 Criptografia AES-256
- 🔒 Checksum SHA-256
- 🔒 Backup offsite (localização diferente)

### **🔧 Recomendações Adicionais:**

```bash
# Na VPS 2:

# 1. Criar usuário específico para backup (não usar root)
adduser backupuser
usermod -aG sudo backupuser

# 2. Configurar chave SSH (mais seguro que senha)
ssh-keygen -t rsa -b 4096 -C "backup@secured-guard"

# 3. Desabilitar login root via SSH
nano /etc/ssh/sshd_config
# Alterar: PermitRootLogin no
systemctl restart sshd

# 4. Instalar fail2ban (proteção contra brute force)
apt install -y fail2ban
systemctl enable fail2ban
```

---

## 📊 **10. Monitoramento**

### **Espaço em Disco:**

```bash
# Verificar espaço
df -h /var/backups

# Alerta se < 20%
df -h | awk '/\/$/ {if ($(NF-1) > 80) print "ALERTA: Disco com " $(NF-1) " de uso!"}'
```

### **Backups Recentes:**

```bash
# Listar backups dos últimos 7 dias
find /var/backups/secured-guard/vps2 -type f -mtime -7 -ls
```

---

## ✅ **Checklist de Configuração**

- [ ] VPS 2 acessível via SSH
- [ ] PostgreSQL instalado e rodando
- [ ] Banco `vps_secured_guard_backup` criado
- [ ] Firewall configurado (22, 5432)
- [ ] Diretórios de backup criados
- [ ] Conexão PostgreSQL testada remotamente
- [ ] Secrets adicionados no GitHub
- [ ] Configuração de backup criada via API
- [ ] Primeiro backup executado com sucesso
- [ ] Monitoramento configurado

---

## 🎯 **Resultado Final**

```
✅ 3 CÓPIAS DO BANCO DE DADOS:
   1. Local (mesmo servidor) - Acesso rápido
   2. VPS 1 (rede principal) - Redundância local
   3. VPS 2 (62.169.27.98) - Backup offsite/remoto

✅ AUTOMAÇÃO COMPLETA:
   - Backup pré-deploy
   - Backup pós-deploy
   - Backups agendados
   - Rollback automático

✅ SEGURANÇA:
   - Criptografia AES-256
   - Checksum SHA-256
   - Múltiplas localizações
   - Retenção de 30 dias
```

---

**SEGUNDA VPS CONFIGURADA COM SUCESSO!** 🖥️✅🔐

