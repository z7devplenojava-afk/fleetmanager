# 🔐 Guia de Segurança para Senhas - SecuredGuard

Este guia estabelece as melhores práticas de segurança para gerenciamento de senhas no projeto SecuredGuard.

## 🚨 **Regras de Segurança Obrigatórias**

### **1. Senhas de Banco de Dados**
- **Mínimo:** 32 caracteres
- **Caracteres:** Maiúsculas, minúsculas, números e símbolos especiais
- **Rotação:** A cada 90 dias
- **Únicas:** Cada ambiente deve ter senha diferente

### **2. JWT Secrets**
- **Mínimo:** 256 bits (64 caracteres hexadecimais)
- **Rotação:** A cada 180 dias
- **Geração:** Usar gerador criptograficamente seguro

### **3. Senhas de Redis**
- **Mínimo:** 24 caracteres
- **Caracteres:** Maiúsculas, minúsculas e números
- **Rotação:** A cada 90 dias

## 🛠️ **Geração de Senhas Seguras**

### **Script Automático**

```bash
# Linux/Mac
./scripts/generate-passwords.sh

# Windows PowerShell
.\scripts\generate-passwords.ps1
```

### **Geração Manual**

```bash
# Senha de 32 caracteres
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# JWT Secret de 256 bits
openssl rand -hex 64

# Senha Redis de 24 caracteres
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24
```

## 📁 **Gerenciamento de Arquivos .env**

### **Estrutura Segura**

```
config/environments/
├── env.template          # Template (sem senhas reais)
├── env.dev              # Desenvolvimento
├── env.staging          # Staging
├── env.prod             # Produção
└── .env.local           # Local (nunca commitado)
```

### **Regras para Arquivos .env**

1. **NUNCA commite** arquivos `.env` com senhas reais
2. **Use** arquivos `.env.example` ou `.env.template`
3. **Mantenha** senhas em local seguro (gerenciador de senhas)
4. **Rotacione** senhas regularmente
5. **Documente** apenas exemplos, nunca senhas reais

## 🔒 **Criptografia e Armazenamento**

### **Gerenciador de Senhas Recomendado**

- **Bitwarden** (gratuito)
- **1Password** (pago)
- **KeePass** (local)

### **Estrutura de Documentação**

```markdown
# Documentação de Senhas

## Ambiente de Desenvolvimento
- **Senha DB:** [Armazenada no Bitwarden - "SecuredGuard Dev DB"]
- **JWT Secret:** [Armazenada no Bitwarden - "SecuredGuard Dev JWT"]
- **Redis:** [Armazenada no Bitwarden - "SecuredGuard Dev Redis"]

## Ambiente de Produção
- **Senha DB:** [Armazenada no Bitwarden - "SecuredGuard Prod DB"]
- **JWT Secret:** [Armazenada no Bitwarden - "SecuredGuard Prod JWT"]
- **Redis:** [Armazenada no Bitwarden - "SecuredGuard Prod Redis"]
```

## 🔄 **Processo de Rotação de Senhas**

### **1. Preparação**

```bash
# 1. Gerar novas senhas
./scripts/generate-passwords.sh

# 2. Salvar em gerenciador de senhas
# 3. Atualizar documentação
# 4. Agendar janela de manutenção
```

### **2. Aplicação**

```bash
# 1. Parar aplicação
docker-compose down

# 2. Atualizar arquivos .env
# 3. Atualizar senha no banco
sudo -u postgres psql -c "ALTER USER postgressg PASSWORD 'nova_senha';"

# 4. Reiniciar aplicação
docker-compose up -d

# 5. Testar conectividade
```

### **3. Validação**

```bash
# 1. Testar conexão com banco
psql -h localhost -p 5432 -U postgressg -d secured_guard_prod

# 2. Verificar logs da aplicação
docker logs secured-guard-backend-prod

# 3. Testar funcionalidades críticas
curl -X GET http://localhost:8081/actuator/health
```

## 🚫 **O Que NÃO Fazer**

### **❌ Práticas Proibidas**

1. **NUNCA** commite senhas no Git
2. **NUNCA** use senhas padrão (123456, admin, etc.)
3. **NUNCA** compartilhe senhas por email/Slack
4. **NUNCA** reutilize senhas entre ambientes
5. **NUNCA** deixe senhas em comentários de código
6. **NUNCA** use senhas fracas (< 16 caracteres)

### **❌ Exemplos de Senhas Fracas**

```
❌ 123456
❌ password
❌ admin
❌ secured_guard
❌ postgres
❌ 123456789
❌ qwerty
```

### **✅ Exemplos de Senhas Fortes**

```
✅ K9#mP2$vL8@nQ5!wR7&tY3*uI6^oP9+
✅ Mx8$kL3#nQ6@vB9!wE2&rT5*uY8^iO1-
✅ Bv7$mK4#qL9@nX2!wR5&tY8*uI3^oP6+
```

## 🔍 **Auditoria de Segurança**

### **Checklist Mensal**

- [ ] Senhas não estão em arquivos commitados
- [ ] Senhas são únicas por ambiente
- [ ] Senhas atendem aos critérios de complexidade
- [ ] JWT secrets são de 256 bits
- [ ] Documentação não contém senhas reais
- [ ] Gerenciador de senhas está atualizado

### **Checklist Trimestral**

- [ ] Rotação de senhas realizada
- [ ] Logs de acesso auditados
- [ ] Permissões de banco revisadas
- [ ] Backup de configurações realizado
- [ ] Teste de recuperação executado

## 🛡️ **Configurações de Segurança Avançadas**

### **PostgreSQL Security**

```sql
-- Configurar SSL obrigatório
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';

-- Configurar conexões limitadas
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Reiniciar PostgreSQL
SELECT pg_reload_conf();
```

### **Redis Security**

```bash
# Configurar senha forte
redis-cli CONFIG SET requirepass "senha_muito_forte_aqui"

# Desabilitar comandos perigosos
redis-cli CONFIG SET rename-command FLUSHDB ""
redis-cli CONFIG SET rename-command FLUSHALL ""
redis-cli CONFIG SET rename-command KEYS ""
```

### **Network Security**

```bash
# Firewall - Permitir apenas portas necessárias
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp from 192.168.1.0/24  # PostgreSQL apenas rede local
ufw deny 6379/tcp  # Redis apenas local
```

## 📋 **Templates de Documentação**

### **Arquivo .env.template**

```bash
# ===================== CONFIGURAÇÃO DE AMBIENTE =====================
# COPIE ESTE ARQUIVO E RENOMEIE PARA .env.local
# NUNCA COMMITE O ARQUIVO .env.local

ENVIRONMENT=development
SPRING_PROFILES_ACTIVE=dev

# ===================== BANCO DE DADOS =====================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=secured_guard_dev
POSTGRES_USER=postgressg
POSTGRES_PASSWORD=GERAR_SENHA_FORTE_AQUI

# ===================== JWT =====================
JWT_SECRET=GERAR_JWT_SECRET_256_BITS_AQUI
```

### **README.md de Segurança**

```markdown
# 🔐 Segurança - SecuredGuard

## Configuração Inicial

1. Copie `env.template` para `.env.local`
2. Execute `./scripts/generate-passwords.sh`
3. Cole as senhas geradas no arquivo `.env.local`
4. NUNCA commite o arquivo `.env.local`

## Rotação de Senhas

Execute a cada 90 dias:
```bash
./scripts/generate-passwords.sh
# Atualize arquivos .env
# Reinicie serviços
```
```

## 🚨 **Incidente de Segurança**

### **Se uma senha for comprometida:**

1. **Imediato:**
   - Gerar nova senha forte
   - Atualizar em todos os ambientes
   - Reiniciar serviços

2. **Investigar:**
   - Verificar logs de acesso
   - Identificar origem do vazamento
   - Documentar incidente

3. **Prevenir:**
   - Revisar processos de segurança
   - Treinar equipe
   - Implementar melhorias

## 📞 **Contatos de Segurança**

- **Responsável Técnico:** [Nome] - [email]
- **Administrador de Segurança:** [Nome] - [email]
- **Suporte de Emergência:** [Telefone]

---

**⚠️ LEMBRE-SE:** Segurança é responsabilidade de todos. Em caso de dúvida, sempre opte pela opção mais segura.

**Última atualização:** $(date)
**Próxima revisão:** $(date -d "+90 days")
