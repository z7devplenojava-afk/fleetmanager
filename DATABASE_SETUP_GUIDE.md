# 🗄️ Guia de Setup do Banco de Dados - SecuredGuard

Este guia explica como configurar e organizar os acessos ao banco de dados do projeto SecuredGuard.

## 🎯 **O Que Foi Implementado**

### **✅ Estrutura Organizada**
- **Configurações centralizadas** em `config/environments/`
- **Templates padronizados** para todos os ambientes
- **Scripts automatizados** para setup e manutenção
- **Documentação completa** de conexão e segurança

### **✅ Criação Automática de Bancos**
- **5 bancos criados automaticamente:**
  - `secured_guard_dev` (Desenvolvimento)
  - `secured_guard_test` (Testes)
  - `secured_guard_staging` (Homologação)
  - `secured_guard_prod` (Produção)
  - `secured_guard_ci` (CI/CD)

### **✅ Flyway Ready**
- **Bancos criados antes das migrações**
- **Scripts de inicialização** no Docker Compose
- **Configuração automática** de permissões

## 🚀 **Como Usar (Passo a Passo)**

### **1. Setup Automático (Recomendado)**

```bash
# Windows PowerShell
.\scripts\setup-database.ps1

# Linux/Mac
./scripts/setup-database.sh
```

**O que o script faz:**
1. ✅ Verifica se PostgreSQL está instalado e rodando
2. ✅ Gera senhas seguras automaticamente
3. ✅ Cria todos os 5 bancos de dados
4. ✅ Cria usuário `postgressg` com permissões
5. ✅ Configura arquivos `.env` com senhas
6. ✅ Testa todas as conexões
7. ✅ Exibe resumo completo

### **2. Configurar DBeaver**

#### **Conexão Local (Desenvolvimento)**
- **Host:** `localhost`
- **Porta:** `5432`
- **Database:** `secured_guard_dev`
- **Username:** `postgressg`
- **Password:** [senha do arquivo `.env.dev`]

#### **Conexão VPS (SSH Tunnel)**
- **SSH Host:** [IP da VPS]
- **SSH User:** [usuário da VPS]
- **Database Host:** `localhost`
- **Database Port:** `5432`
- **Database:** `secured_guard_prod`
- **Username:** `postgressg`
- **Password:** [senha do arquivo `.env.prod`]

### **3. Executar Flyway Migrations**

```bash
# Desenvolvimento
mvn flyway:migrate -Dspring.profiles.active=dev

# Produção
mvn flyway:migrate -Dspring.profiles.active=prod
```

### **4. Testar Aplicação**

```bash
# Iniciar aplicação
mvn spring-boot:run -Dspring.profiles.active=dev

# Verificar saúde
curl http://localhost:8081/actuator/health
```

## 📁 **Estrutura Criada**

```
secured-guard/
├── config/
│   ├── environments/
│   │   ├── env.template      # Template para novos ambientes
│   │   ├── env.dev          # Desenvolvimento
│   │   └── env.prod         # Produção
│   ├── database/
│   │   ├── CONEXAO_BANCO_DADOS.md
│   │   └── SEGURANCA_SENHAS.md
│   └── README.md
├── scripts/
│   ├── setup-database.ps1   # Setup automático (Windows)
│   ├── setup-database.sh    # Setup automático (Linux/Mac)
│   ├── generate-passwords.ps1
│   ├── generate-passwords.sh
│   ├── create-databases.ps1
│   ├── create-databases.sh
│   └── init-databases.sh    # Para Docker Compose
└── deploy/
    └── docker-compose.dev.yml # Atualizado com criação automática
```

## 🔐 **Segurança Implementada**

### **✅ Senhas Seguras**
- **32 caracteres** para banco de dados
- **256 bits** para JWT secrets
- **24 caracteres** para Redis
- **Geração automática** com OpenSSL

### **✅ Boas Práticas**
- **Nunca commite** senhas reais
- **Templates** sem senhas
- **Rotação** de senhas documentada
- **Documentação** de segurança

### **✅ Gerenciamento**
- **Scripts de geração** de senhas
- **Documentação** de rotina de segurança
- **Checklist** de auditoria
- **Processo** de rotação

## 🐳 **Docker Compose Atualizado**

### **Criação Automática de Bancos**

O novo `docker-compose.dev.yml` inclui:
- **Script de inicialização** que cria todos os bancos
- **Configuração automática** de permissões
- **Volumes persistentes** para dados
- **Health checks** para todos os serviços

### **Como Usar**

```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f deploy/docker-compose.dev.yml up -d

# Verificar logs
docker-compose -f deploy/docker-compose.dev.yml logs postgres

# Verificar bancos criados
docker exec secured-guard-db-dev psql -U postgressg -l
```

## 🔄 **Manutenção**

### **Rotação de Senhas (90 dias)**

```bash
# 1. Gerar novas senhas
.\scripts\generate-passwords.ps1

# 2. Atualizar arquivos .env
# 3. Atualizar senha no banco
sudo -u postgres psql -c "ALTER USER postgressg PASSWORD 'nova_senha';"

# 4. Reiniciar serviços
docker-compose restart
```

### **Backup**

```bash
# Backup das configurações
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/

# Backup dos bancos
pg_dump -h localhost -p 5432 -U postgressg secured_guard_dev > backup-dev-$(date +%Y%m%d).sql
```

## 🚨 **Solução de Problemas**

### **Erro: PostgreSQL não encontrado**
```bash
# Windows
choco install postgresql

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
```

### **Erro: Permissão negada**
```bash
# Conectar como superusuário
sudo -u postgres psql

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE secured_guard_dev TO postgressg;
```

### **Erro: Banco não existe**
```bash
# Executar script de criação
.\scripts\create-databases.ps1

# Ou criar manualmente
createdb -h localhost -p 5432 -U postgres secured_guard_dev
```

## 📊 **Verificação Final**

### **Checklist de Validação**

- [ ] PostgreSQL instalado e rodando
- [ ] 5 bancos de dados criados
- [ ] Usuário `postgressg` com permissões
- [ ] Arquivos `.env` configurados
- [ ] DBeaver conectando com sucesso
- [ ] Flyway executando migrações
- [ ] Aplicação iniciando sem erros
- [ ] Health check respondendo

### **Comandos de Teste**

```bash
# Testar conexões
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "SELECT 1;"

# Verificar bancos
psql -h localhost -p 5432 -U postgressg -l

# Verificar migrações
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "SELECT * FROM flyway_schema_history;"
```

## 📚 **Documentação Adicional**

- **[config/README.md](config/README.md)** - Guia de configuração
- **[config/database/CONEXAO_BANCO_DADOS.md](config/database/CONEXAO_BANCO_DADOS.md)** - Conexão detalhada
- **[config/database/SEGURANCA_SENHAS.md](config/database/SEGURANCA_SENHAS.md)** - Segurança

## 🎉 **Próximos Passos**

1. **Execute o setup automático** com os scripts fornecidos
2. **Configure o DBeaver** com as credenciais geradas
3. **Execute as migrações** do Flyway
4. **Teste a aplicação** em todos os ambientes
5. **Configure backup** automático
6. **Implemente monitoramento** de banco

---

**✅ Organização completa dos acessos ao banco de dados implementada!**

**Última atualização:** $(date)
**Versão:** 1.0
