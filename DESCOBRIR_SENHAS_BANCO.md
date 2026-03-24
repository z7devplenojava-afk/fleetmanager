# Como Descobrir as Senhas dos Bancos de Dados na VPS

## 🔐 **Métodos para Descobrir Senhas**

### **Método 1: Via Arquivo .env (Mais Comum)**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Verificar se o arquivo .env existe
ls -la /opt/secured-guard/.env

# Ver a senha do PostgreSQL
cat /opt/secured-guard/.env | grep POSTGRES_PASSWORD

# Ou usar grep para filtrar
grep POSTGRES_PASSWORD /opt/secured-guard/.env
```

### **Método 2: Via Docker (Se usando Docker)**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Ver variáveis de ambiente do container PostgreSQL
docker exec secured-guard-db-prod env | grep POSTGRES_PASSWORD

# Ou ver logs do container
docker logs secured-guard-db-prod 2>&1 | grep -i password

# Ver configuração do docker-compose
cat /opt/secured-guard/deploy/docker-compose.prod.yml | grep -A 5 -B 5 POSTGRES_PASSWORD
```

### **Método 3: Via Script de Instalação**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Ver o script de instalação
cat /opt/secured-guard/deploy/install-vps.sh | grep -A 10 -B 5 POSTGRES_PASSWORD

# Ver se há arquivo de configuração
find /opt/secured-guard -name "*.env" -o -name "*.conf" -o -name "*.properties" | xargs grep -l POSTGRES_PASSWORD
```

### **Método 4: Via Variáveis de Ambiente do Sistema**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Ver variáveis de ambiente
env | grep -i postgres

# Ver variáveis do usuário atual
printenv | grep -i postgres
```

### **Método 5: Via Arquivos de Configuração**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Procurar em arquivos de configuração
grep -r "POSTGRES_PASSWORD" /opt/secured-guard/
grep -r "postgres" /opt/secured-guard/ | grep -i password
grep -r "secured_guard" /opt/secured-guard/ | grep -i password
```

## 🔍 **Comandos de Diagnóstico**

### **Verificar Status dos Serviços**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar containers Docker
docker ps | grep postgres

# Verificar portas abertas
sudo netstat -tlnp | grep 5432
```

### **Verificar Configurações do PostgreSQL**
```bash
# Conectar como superusuário
sudo -u postgres psql

# Listar bancos de dados
\l

# Ver usuários
\du

# Sair
\q
```

### **Verificar Logs**
```bash
# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# Logs do Docker
docker logs secured-guard-db-prod

# Logs do sistema
sudo journalctl -u postgresql
```

## 🛠️ **Soluções Alternativas**

### **Se Não Conseguir a Senha:**

#### **Opção 1: Resetar Senha**
```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Parar PostgreSQL
sudo systemctl stop postgresql

# Iniciar em modo single-user
sudo -u postgres postgres --single -D /var/lib/postgresql/data

# Alterar senha
ALTER USER postgressg PASSWORD 'nova_senha';

# Sair e reiniciar
\q
sudo systemctl start postgresql
```

#### **Opção 2: Criar Novo Usuário**
```bash
# Conectar como postgres
sudo -u postgres psql

# Criar novo usuário
CREATE USER novo_usuario WITH PASSWORD 'nova_senha';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE secured_guard_prod TO novo_usuario;
GRANT ALL PRIVILEGES ON DATABASE secured_guard_dev TO novo_usuario;
GRANT ALL PRIVILEGES ON DATABASE secured_guard_ci TO novo_usuario;
```

#### **Opção 3: Usar Usuário Padrão**
```bash
# Conectar como postgres (usuário padrão)
sudo -u postgres psql

# Listar bancos
\l

# Conectar em um banco específico
\c secured_guard_prod
```

## 📋 **Checklist de Verificação**

### **1. Verificar Arquivo .env**
- [ ] Arquivo existe em `/opt/secured-guard/.env`
- [ ] Contém `POSTGRES_PASSWORD`
- [ ] Senha está visível

### **2. Verificar Docker**
- [ ] Container PostgreSQL está rodando
- [ ] Variáveis de ambiente estão definidas
- [ ] Logs não mostram erros

### **3. Verificar PostgreSQL**
- [ ] Serviço está rodando
- [ ] Porta 5432 está aberta
- [ ] Bancos de dados existem

### **4. Testar Conexão**
- [ ] SSH funciona
- [ ] PostgreSQL aceita conexões
- [ ] Usuário tem permissões

## 🚨 **Problemas Comuns**

### **Arquivo .env não existe**
```bash
# Verificar se o projeto foi instalado corretamente
ls -la /opt/secured-guard/

# Verificar se o script de instalação foi executado
ls -la /opt/secured-guard/deploy/
```

### **Senha está vazia ou inválida**
```bash
# Verificar se a senha foi gerada
grep POSTGRES_PASSWORD /opt/secured-guard/.env | wc -c

# Se retornar 0, a senha não foi definida
```

### **Usuário não tem permissões**
```bash
# Conectar como postgres
sudo -u postgres psql

# Verificar usuários
\du

# Dar permissões se necessário
GRANT ALL PRIVILEGES ON DATABASE secured_guard_prod TO postgressg;
```

## 🎯 **Próximos Passos**

1. **Executar comandos** para descobrir a senha
2. **Testar conexão** no DBeaver
3. **Configurar SSH Tunnel** se necessário
4. **Verificar tabelas** nos bancos

## 💡 **Dica Importante**

Se você não conseguir descobrir a senha, pode:
- Resetar a senha do usuário `postgressg`
- Criar um novo usuário com senha conhecida
- Usar o usuário `postgres` padrão (se tiver permissões)
