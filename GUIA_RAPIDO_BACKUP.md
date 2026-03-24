# 🚀 Guia Rápido - Sistema de Backup

## ⚡ **Setup em 5 Minutos**

---

## 1️⃣ **Criar Bancos de Backup**

### **No Servidor Local (DBeaver):**

```sql
CREATE DATABASE secured_guard_backup;
```

### **Na VPS (via SSH + psql):**

```bash
ssh usuario@IP_DA_VPS
psql -U postgres
```

```sql
CREATE DATABASE vps_secured_guard_backup;
```

---

## 2️⃣ **Configurar Firewall na VPS**

```bash
# Permitir conexão do servidor principal
sudo ufw allow from SEU_IP_SERVIDOR to any port 5432

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

---

## 3️⃣ **Testar Conexão**

```bash
# Do servidor principal
psql -h IP_DA_VPS -p 5432 -U postgres -d vps_secured_guard_backup
```

Se conectar: ✅ Pronto!

---

## 4️⃣ **Configurar no Sistema**

1. Fazer login como SUPER_ADMIN
2. Menu: Configurações
3. Acessar: `/configuracoes/backup`
4. Aba "Backup Local":
   - Host: localhost
   - Porta: 5432
   - Banco: secured_guard_backup
   - Usuário: postgres
   - Senha: (sua senha)
   - **Testar Conexão** ✅
   - **Salvar**

5. Aba "Backup VPS":
   - IP: (IP da VPS)
   - Porta: 5432
   - Banco: vps_secured_guard_backup
   - Usuário: postgres
   - Senha: (senha da VPS)
   - **Testar Conexão** ✅
   - **Salvar**

---

## 5️⃣ **Executar Primeiro Backup**

- Clicar em **"Executar Agora"**
- Aguardar conclusão
- Verificar aba **"Histórico"**

---

## ✅ **Pronto!**

**Backups automáticos configurados:**
- 🕐 Local: Todo dia às 2h
- 🕒 VPS: Todo dia às 3h
- 🗑️ Limpeza: Meia-noite

---

## 📋 **Checklist**

- [ ] Banco `secured_guard_backup` criado localmente
- [ ] Banco `vps_secured_guard_backup` criado na VPS
- [ ] Firewall da VPS configurado
- [ ] Conexão VPS testada com sucesso
- [ ] Configuração local salva no sistema
- [ ] Configuração VPS salva no sistema
- [ ] Primeiro backup executado manualmente
- [ ] Histórico mostrando backup bem-sucedido

---

## 🆘 **Troubleshooting**

### **Erro: "pg_dump não encontrado"**

**Solução:**
```bash
# Windows
Adicionar ao PATH: C:\Program Files\PostgreSQL\17\bin
```

### **Erro: "Falha ao conectar na VPS"**

**Verificar:**
1. IP da VPS está correto?
2. Porta 5432 está aberta no firewall?
3. PostgreSQL está rodando na VPS?
4. Credenciais estão corretas?

### **Erro: "Permissão negada"**

**Solução na VPS:**
```bash
sudo -u postgres psql
ALTER DATABASE vps_secured_guard_backup OWNER TO postgres;
GRANT ALL PRIVILEGES ON DATABASE vps_secured_guard_backup TO postgres;
```

---

**SISTEMA DE BACKUP PRONTO!** ✅💾🔐

