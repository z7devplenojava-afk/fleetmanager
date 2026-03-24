# 🔧 Configuração de Ambientes - SecuredGuard

Esta pasta contém toda a configuração organizada dos ambientes do projeto SecuredGuard.

## 📁 **Estrutura de Diretórios**

```
config/
├── environments/           # Configurações de ambiente
│   ├── env.template       # Template para novos ambientes
│   ├── env.dev           # Desenvolvimento
│   ├── env.prod          # Produção
│   └── .env.local        # Local (nunca commitado)
├── database/              # Documentação de banco
│   ├── CONEXAO_BANCO_DADOS.md
│   └── SEGURANCA_SENHAS.md
└── README.md             # Este arquivo
```

## 🚀 **Setup Rápido**

### **1. Configuração Automática (Recomendado)**

```bash
# Linux/Mac
./scripts/setup-database.sh

# Windows PowerShell
.\scripts\setup-database.ps1
```

### **2. Configuração Manual**

```bash
# 1. Gerar senhas seguras
./scripts/generate-passwords.sh

# 2. Criar bancos de dados
./scripts/create-databases.sh

# 3. Copiar template e configurar
cp config/environments/env.template config/environments/.env.local
```

## 🔐 **Gerenciamento de Senhas**

### **Gerar Novas Senhas**

```bash
# Linux/Mac
./scripts/generate-passwords.sh

# Windows PowerShell
.\scripts\generate-passwords.ps1
```

### **Rotação de Senhas (90 dias)**

1. Execute o gerador de senhas
2. Atualize os arquivos `.env` correspondentes
3. Reinicie os serviços
4. Teste as conexões

## 🗄️ **Bancos de Dados**

### **Estrutura dos Bancos**

| Ambiente | Banco | Porta | Usuário |
|----------|-------|-------|---------|
| **Desenvolvimento** | `secured_guard_dev` | 5432 | `postgressg` |
| **Teste** | `secured_guard_test` | 5432 | `postgressg` |
| **Staging** | `secured_guard_staging` | 5432 | `postgressg` |
| **Produção** | `secured_guard_prod` | 5432 | `postgressg` |
| **CI/CD** | `secured_guard_ci` | 5432 | `postgressg` |

### **Criação Automática**

Os bancos são criados automaticamente quando você:
- Executa o script de setup
- Inicia o Docker Compose
- Executa as migrações do Flyway

## 🐳 **Docker Compose**

### **Ambientes Disponíveis**

```bash
# Desenvolvimento
docker-compose -f deploy/docker-compose.dev.yml up -d

# Produção
docker-compose -f deploy/docker-compose.prod.yml up -d
```

### **Variáveis de Ambiente**

O Docker Compose carrega automaticamente as variáveis dos arquivos `.env` correspondentes.

## 📊 **Flyway Migrations**

### **Executar Migrações**

```bash
# Desenvolvimento
mvn flyway:migrate -Dspring.profiles.active=dev

# Produção
mvn flyway:migrate -Dspring.profiles.active=prod
```

### **Verificar Status**

```bash
# Ver histórico de migrações
psql -h localhost -p 5432 -U postgressg -d secured_guard_dev -c "
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;"
```

## 🔍 **DBeaver - Conexões**

### **Conexão Local**

1. **Host:** `localhost`
2. **Porta:** `5432`
3. **Database:** `secured_guard_dev`
4. **Username:** `postgressg`
5. **Password:** [do arquivo .env.dev]

### **Conexão VPS (SSH Tunnel)**

1. **SSH Host:** [IP da VPS]
2. **SSH User:** [usuário da VPS]
3. **Database Host:** `localhost`
4. **Database Port:** `5432`
5. **Database:** `secured_guard_prod`
6. **Username:** `postgressg`
7. **Password:** [do arquivo .env.prod]

## 🛡️ **Segurança**

### **Regras Obrigatórias**

1. **NUNCA commite** arquivos `.env` com senhas reais
2. **Use senhas fortes** (mínimo 32 caracteres)
3. **Rotacione senhas** a cada 90 dias
4. **Salve senhas** em gerenciador de senhas
5. **Use SSL** em produção

### **Checklist de Segurança**

- [ ] Senhas não estão em arquivos commitados
- [ ] Senhas são únicas por ambiente
- [ ] JWT secrets são de 256 bits
- [ ] Backup de configurações realizado
- [ ] Monitoramento ativo

## 🚨 **Solução de Problemas**

### **Erro de Conexão**

```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432

# Verificar logs
docker logs secured-guard-db-dev
```

### **Erro de Permissão**

```sql
-- Conectar como superusuário
sudo -u postgres psql

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE secured_guard_dev TO postgressg;
```

### **Erro de Migração**

```bash
# Verificar status do Flyway
mvn flyway:info

# Reparar migração corrompida
mvn flyway:repair
```

## 📚 **Documentação Adicional**

- **[Conexão com Banco](database/CONEXAO_BANCO_DADOS.md)** - Guia completo de conexão
- **[Segurança de Senhas](database/SEGURANCA_SENHAS.md)** - Melhores práticas de segurança

## 🔄 **Manutenção**

### **Backup de Configurações**

```bash
# Backup das configurações
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/

# Backup dos bancos
pg_dump -h localhost -p 5432 -U postgressg secured_guard_dev > backup-dev-$(date +%Y%m%d).sql
```

### **Atualização de Configurações**

1. Faça backup das configurações atuais
2. Atualize os arquivos de configuração
3. Teste em ambiente de desenvolvimento
4. Aplique em produção com janela de manutenção

## 📞 **Suporte**

Em caso de problemas:

1. Consulte a documentação específica
2. Verifique os logs de aplicação e banco
3. Execute os scripts de diagnóstico
4. Contate o administrador do sistema

---

**Última atualização:** $(date)
**Versão:** 1.0
