# Configuração do DBeaver para VPS via SSH Tunnel

## 🔧 Configuração de Conexão com SSH Tunnel

### 📊 **Parâmetros de Conexão:**

| Ambiente | Host | Porta | Banco | Usuário | Senha |
|----------|------|-------|-------|---------|-------|
| **PRODUÇÃO** | `localhost` | `5432` | `secured_guard_prod` | `postgressg` | `${POSTGRES_PASSWORD}` |
| **DESENVOLVIMENTO** | `localhost` | `5432` | `secured_guard_dev` | `postgressg` | `${POSTGRES_PASSWORD}` |
| **CI/CD** | `localhost` | `5432` | `secured_guard_ci` | `postgressg` | `${POSTGRES_PASSWORD}` |

## 🚀 **Passo a Passo no DBeaver:**

### 1. **Criar Nova Conexão**
- Clique em "Nova Conexão" (ícone de plug)
- Selecione "PostgreSQL"

### 2. **Configurar SSH Tunnel**
- Aba "SSH"
- ✅ **Use SSH Tunnel:** Marcar como habilitado
- **Host/IP:** `IP_DA_SUA_VPS`
- **Port:** `22` (porta SSH padrão)
- **User Name:** `usuario_da_vps`
- **Authentication:** 
  - **Method:** Password ou Key Pair
  - **Password:** `senha_do_usuario_vps` (ou chave privada)

### 3. **Configurar Conexão Principal**
- **Host:** `localhost` (ou `127.0.0.1`)
- **Porta:** `5432`
- **Database:** `secured_guard_prod` (ou dev/ci)
- **Username:** `postgressg`
- **Password:** `SENHA_DO_BANCO`

### 4. **Configurações Avançadas**
- **SSL Mode:** `disable`
- **Connection Timeout:** `30`
- **Socket Timeout:** `30`

### 5. **Testar Conexão**
- Clique em "Test Connection"
- Deve aparecer "Connected"

## 🔐 **Obter Senha do Banco:**

### **Opção 1: Via SSH**
```bash
ssh usuario@ip-da-vps
cat /opt/secured-guard/.env | grep POSTGRES_PASSWORD
```

### **Opção 2: Via Docker**
```bash
docker exec secured-guard-db-prod env | grep POSTGRES_PASSWORD
```

### **Opção 3: Via Arquivo .env**
```bash
# Na VPS
grep POSTGRES_PASSWORD /opt/secured-guard/.env
```

## 📋 **Criar Múltiplas Conexões:**

### **Conexão 1: Produção**
- Nome: `SecuredGuard - Produção (SSH)`
- Database: `secured_guard_prod`
- SSH Tunnel: ✅ Habilitado

### **Conexão 2: Desenvolvimento**
- Nome: `SecuredGuard - Desenvolvimento (SSH)`
- Database: `secured_guard_dev`
- SSH Tunnel: ✅ Habilitado

### **Conexão 3: CI/CD**
- Nome: `SecuredGuard - CI/CD (SSH)`
- Database: `secured_guard_ci`
- SSH Tunnel: ✅ Habilitado

## ⚠️ **Problemas Comuns:**

### **Erro: SSH Connection Failed**
- Verificar se SSH está habilitado na VPS
- Verificar usuário e senha/chave SSH
- Verificar se a porta 22 está aberta

### **Erro: Connection Refused (PostgreSQL)**
- Verificar se PostgreSQL está rodando na VPS
- Verificar se a porta 5432 está aberta internamente

### **Erro: Authentication Failed**
- Verificar usuário e senha do PostgreSQL
- Verificar se o usuário tem permissão no banco

### **Erro: Database Does Not Exist**
- Verificar se o banco foi criado
- Executar as migrações primeiro

## 🔧 **Comandos Úteis na VPS:**

```bash
# Verificar se SSH está rodando
sudo systemctl status ssh

# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar portas abertas
sudo netstat -tlnp | grep 5432

# Conectar via psql
psql -h localhost -p 5432 -U postgressg -d secured_guard_prod

# Listar bancos
psql -h localhost -p 5432 -U postgressg -c "\l"

# Listar tabelas
psql -h localhost -p 5432 -U postgressg -d secured_guard_prod -c "\dt"
```

## 🔑 **Configuração de Chave SSH (Opcional):**

### **Gerar Chave SSH:**
```bash
# No seu computador local
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"
```

### **Copiar Chave para VPS:**
```bash
ssh-copy-id usuario@ip-da-vps
```

### **Usar Chave no DBeaver:**
- **Authentication Method:** Key Pair
- **Private Key:** Caminho para o arquivo `id_rsa`
- **Passphrase:** Senha da chave (se houver)

## 📊 **Verificar Conexão:**

Após conectar, você deve ver:
- ✅ SSH Tunnel estabelecido
- ✅ Conexão PostgreSQL estabelecida
- ✅ Lista de bancos de dados
- ✅ Estrutura das tabelas
- ✅ Dados das tabelas

## 🎯 **Próximos Passos:**

1. **Configurar SSH Tunnel** no DBeaver
2. **Testar conexão** com cada ambiente
3. **Verificar tabelas** criadas pelas migrações
4. **Explorar dados** existentes
