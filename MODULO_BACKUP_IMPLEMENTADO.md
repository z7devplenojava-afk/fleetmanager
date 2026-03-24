# 🔐 Módulo de Backup Implementado

## ✅ **SISTEMA DE BACKUP COMPLETO!**

---

## 🎯 **Funcionalidades**

### **1. Backup Dual (Local + VPS)**

**Banco Local:**
- Nome: `secured_guard_backup`
- Host: localhost
- Porta: 5432

**Banco VPS:**
- Nome: `vps_secured_guard_backup`
- Host: IP da VPS (configurável)
- Porta: 5432 (configurável)

---

## 📋 **Componentes Criados**

### **Backend (8 arquivos):**

1. ✅ `BackupConfiguration.java` - Modelo de configuração
2. ✅ `BackupHistory.java` - Modelo de histórico
3. ✅ `BackupConfigurationRepository.java` - Repository config
4. ✅ `BackupHistoryRepository.java` - Repository histórico
5. ✅ `BackupService.java` - Lógica de backup
6. ✅ `BackupScheduler.java` - Agendamento automático
7. ✅ `BackupController.java` - API REST
8. ✅ `BackupConfigurationDTO.java` - DTO validação

### **Frontend (1 arquivo):**

9. ✅ `ConfiguracaoBackup.tsx` - Interface de configuração

### **Database:**

10. ✅ `V305__create_backup_tables.sql` - Migration

---

## 🔧 **Como Funciona**

### **1. Configuração**

Acesse: `http://localhost:3000/configuracoes/backup`

**Aba "Backup Local":**
- Host: localhost
- Porta: 5432
- Banco: secured_guard_backup
- Usuário: postgres
- Senha: (sua senha)

**Aba "Backup VPS":**
- IP: (IP da sua VPS)
- Porta: 5432
- Banco: vps_secured_guard_backup
- Usuário: postgres
- Senha: (senha da VPS)

---

### **2. Testar Conexão**

Botão **"Testar Conexao"**:
- Valida credenciais
- Testa conectividade
- Confirma que banco existe

---

### **3. Executar Backup**

**Manual:**
- Botão "Executar Agora"
- Backup imediato

**Automático:**
- Configurado via cron expression
- Padrão: Todo dia às 2h (`0 0 2 * * ?`)

---

### **4. Processo de Backup**

```
1. pg_dump no banco principal (secured_guard)
2. Gera arquivo SQL
3. Comprime com GZIP (se habilitado)
4. Salva localmente em ./backups/
5. Se VPS: Conecta e restaura no banco remoto
6. Registra histórico
7. Limpa backups antigos (retention policy)
```

---

## 📊 **Configurações Disponíveis**

| Campo | Descrição | Padrão |
|-------|-----------|--------|
| **Host** | IP ou hostname | localhost |
| **Porta** | Porta PostgreSQL | 5432 |
| **Banco** | Nome do banco de backup | secured_guard_backup |
| **Usuário** | Usuário do PostgreSQL | postgres |
| **Senha** | Senha (criptografada no banco) | - |
| **Habilitado** | Ativar backup | true |
| **Auto Backup** | Backup automático | true |
| **Agendamento** | Expressão cron | 0 0 2 * * ? |
| **Retenção** | Dias para manter backups | 30 |
| **Comprimir** | Comprimir com GZIP | true |

---

## 🔄 **Agendamento (Cron)**

### **Exemplos de Expressões Cron:**

```
0 0 2 * * ?   = Todo dia às 2h da manhã
0 0 */6 * * ? = A cada 6 horas
0 30 1 * * ?  = Todo dia à 1h30
0 0 0 * * ?   = Todo dia à meia-noite
0 0 12 * * ?  = Todo dia ao meio-dia
```

**Formato:** `segundo minuto hora dia mês dia-da-semana`

---

## 🗜️ **Compressão**

**GZIP:**
- Reduz tamanho em ~70-80%
- Arquivo `.sql.gz`
- Descompressão automática ao restaurar

**Exemplo:**
```
Backup original: 500 MB
Comprimido: 100 MB (80% de redução)
```

---

## 📁 **Estrutura de Arquivos**

```
./backups/
├── backup_local_20251101_020000.sql.gz
├── backup_local_20251102_020000.sql.gz
├── backup_vps_20251101_030000.sql.gz
└── backup_vps_20251102_030000.sql.gz
```

---

## 🔒 **Segurança**

### **Senhas Criptografadas:**

```java
// Senhas são criptografadas com BCrypt antes de salvar
config.setPassword(passwordEncoder.encode(password));
```

### **Acesso Restrito:**

```java
@PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
```

**Apenas SUPER_ADMIN pode:**
- Ver configurações
- Executar backups
- Ver histórico

---

## 📝 **API Endpoints**

### **GET /api/backup/configurations**
Listar todas as configurações

### **POST /api/backup/configurations**
Criar nova configuração

**Body:**
```json
{
  "name": "vps",
  "type": "REMOTE",
  "host": "192.168.1.100",
  "port": 5432,
  "database": "vps_secured_guard_backup",
  "username": "postgres",
  "password": "senha_vps",
  "enabled": true,
  "autoBackup": true,
  "schedule": "0 0 3 * * ?",
  "retentionDays": 90,
  "compressBackup": true
}
```

### **POST /api/backup/test-connection**
Testar conexão com banco

### **POST /api/backup/execute/{configId}**
Executar backup manualmente

### **GET /api/backup/history**
Obter histórico de backups

### **DELETE /api/backup/clean/{configId}**
Limpar backups antigos

---

## 🚀 **Como Usar**

### **1. Criar Bancos de Backup**

**Local:**
```sql
CREATE DATABASE secured_guard_backup;
```

**VPS (conectar via SSH e executar):**
```sql
CREATE DATABASE vps_secured_guard_backup;
```

---

### **2. Configurar no Sistema**

1. Login como SUPER_ADMIN
2. Menu: Configurações → Backup
3. Aba "Backup Local":
   - Preencher dados do banco local
   - Testar conexão
   - Salvar
4. Aba "Backup VPS":
   - Preencher IP da VPS
   - Dados do banco remoto
   - Testar conexão
   - Salvar

---

### **3. Executar Backup Manual**

- Clicar em "Executar Agora"
- Aguardar conclusão
- Verificar histórico

---

### **4. Backup Automático**

**Configurado e pronto!**

- Backup Local: 2h da manhã
- Backup VPS: 3h da manhã
- Limpeza de antigos: Meia-noite

---

## ⏰ **Agenda Padrão**

| Tarefa | Horário | Frequência |
|--------|---------|------------|
| **Backup Local** | 02:00 | Diário |
| **Backup VPS** | 03:00 | Diário |
| **Limpeza** | 00:00 | Diário |
| **Verificação** | A cada hora | Contínuo |

---

## 📊 **Histórico de Backups**

### **Informações Registradas:**

- 📅 Data/hora do backup
- ✅ Status (SUCCESS, FAILED, PARTIAL)
- 📦 Tamanho do arquivo
- ⏱️ Duração da execução
- 📊 Número de tabelas
- 📈 Total de registros
- 💬 Mensagem de status

---

## 🛠️ **Requisitos do Sistema**

### **Servidor:**

- ✅ PostgreSQL instalado
- ✅ `pg_dump` disponível no PATH
- ✅ `psql` disponível no PATH
- ✅ Java 17+
- ✅ Spring Boot 3.x

### **VPS (Backup Remoto):**

- ✅ PostgreSQL instalado
- ✅ Porta 5432 acessível
- ✅ Firewall liberado para IP do servidor principal
- ✅ Banco `vps_secured_guard_backup` criado
- ✅ Usuário com permissões de escrita

---

## 🔍 **Logs**

### **Backup Bem-Sucedido:**

```
🔄 Iniciando processo de backup para configuração: xxx
📁 Diretório de backup criado: ./backups
📦 Executando pg_dump para: backup_local_20251101_020000.sql
🔧 Executando: pg_dump -h localhost -p 5432 -U postgres -d secured_guard_backup
✅ pg_dump executado com sucesso
🗜️ Comprimindo backup...
✅ Compressão concluída! 500 MB → 100 MB (80% de redução)
✅ Backup concluído! Tamanho: 100 MB, Duração: 45s
```

### **Backup para VPS:**

```
📤 Enviando backup para VPS...
✅ Conexão com banco remoto estabelecida
🔧 Executando psql restore para: vps_secured_guard_backup
✅ Backup restaurado com sucesso no banco remoto
```

---

## ⚠️ **Importante**

### **Antes de Usar:**

1. ✅ Criar bancos de backup:
   - Local: `secured_guard_backup`
   - VPS: `vps_secured_guard_backup`

2. ✅ Garantir que `pg_dump` e `psql` estão no PATH

3. ✅ Testar conexões antes de habilitar backups automáticos

4. ✅ Configurar firewall da VPS para aceitar conexões

---

## 🎯 **Benefícios**

### **Redundância:**
- ✅ 2 cópias do banco (local + VPS)
- ✅ Proteção contra falha de hardware
- ✅ Proteção contra ransomware
- ✅ Disaster recovery

### **Automação:**
- ✅ Backups automáticos diários
- ✅ Limpeza automática de antigos
- ✅ Sem intervenção manual

### **Auditoria:**
- ✅ Histórico completo
- ✅ Status de cada backup
- ✅ Tamanho e duração
- ✅ Logs detalhados

---

## 📝 **Configuração Recomendada**

### **Backup Local:**
```
Host: localhost
Porta: 5432
Banco: secured_guard_backup
Agendamento: 0 0 2 * * ? (2h da manhã)
Retenção: 30 dias
Compressão: SIM
```

### **Backup VPS:**
```
Host: (IP da VPS)
Porta: 5432
Banco: vps_secured_guard_backup
Agendamento: 0 0 3 * * ? (3h da manhã)
Retenção: 90 dias (3 meses)
Compressão: SIM
```

---

## 🚀 **Próximos Passos**

1. Execute a migration V305
2. Crie os bancos de backup
3. Configure no sistema
4. Teste as conexões
5. Execute backup manual
6. Verifique o histórico

---

## ✅ **Checklist de Implementação**

- [x] Modelos criados (BackupConfiguration, BackupHistory)
- [x] Repositories criados
- [x] BackupService com lógica de pg_dump
- [x] BackupScheduler com agendamento
- [x] BackupController com API REST
- [x] Frontend com interface completa
- [x] Migration V305 criada
- [x] Rota adicionada no App.tsx
- [x] Documentação completa

---

**MÓDULO DE BACKUP 100% IMPLEMENTADO!** ✅🔐💾

**Acesse:** `http://localhost:3000/configuracoes/backup`

