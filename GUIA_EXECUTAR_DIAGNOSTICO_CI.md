# 🔧 Guia de Execução: Diagnóstico Erro 500 Login CI

## 📋 Pré-requisitos

Antes de começar, você precisa:
- ✅ Acesso SSH ao servidor CI (ci.z7botsolutions.com.br)
- ✅ Credenciais do usuário com permissões Docker
- ✅ Cliente SSH instalado (PuTTY, OpenSSH, etc)

---

## 🚀 Passo 1: Conectar ao Servidor CI

```bash
# Conectar via SSH
ssh usuario@ci.z7botsolutions.com.br

# Navegar para o diretório do projeto
cd /var/www/secured_guard
```

---

## 🔍 Passo 2: Executar Diagnóstico

### Opção A: Script Automático (Recomendado)

```bash
# Fazer upload do script de diagnóstico
# (Execute no seu computador local)
scp diagnostico-login-ci.sh usuario@ci.z7botsolutions.com.br:/var/www/secured_guard/

# No servidor CI, executar o script
chmod +x diagnostico-login-ci.sh
./diagnostico-login-ci.sh > diagnostico-resultado.txt

# Visualizar resultado
cat diagnostico-resultado.txt
```

### Opção B: Comandos Manuais

Se preferir executar manualmente:

#### 2.1. Verificar Containers Ativos

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Esperado:** Ver containers `secured-guard-backend-ci` e `secured-guard-postgres-ci` rodando.

#### 2.2. Verificar Logs do Backend

```bash
docker logs secured-guard-backend-ci --tail 100 2>&1 | grep -E "ERROR|Exception|login|authenticate"
```

**Procure por:**
- `NullPointerException`
- `User.getRoles()` 
- `CustomPermissionService`
- Qualquer stack trace relacionado a login

#### 2.3. Testar Conexão com Banco

```bash
docker exec secured-guard-backend-ci pg_isready -h postgres-ci -U secured_guard_user
```

**Esperado:** `postgres-ci:5432 - accepting connections`

#### 2.4. Verificar Usuários Sem Roles

```bash
docker exec secured-guard-postgres-ci psql -U secured_guard_user -d secured_guard -c "
SELECT u.username, u.email, COUNT(ur.role_id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.username, u.email
HAVING COUNT(ur.role_id) = 0
LIMIT 10;"
```

**Se retornar usuários:** Este é o problema! Prossiga para Passo 3.

#### 2.5. Verificar Role COLABORADOR

```bash
docker exec secured-guard-postgres-ci psql -U secured_guard_user -d secured_guard -c "
SELECT * FROM roles WHERE name = 'COLABORADOR';"
```

**Esperado:** Deve retornar 1 linha com a role COLABORADOR.

---

## 🔧 Passo 3: Aplicar Correção (Se Necessário)

### Se encontrou usuários sem roles:

```bash
# Fazer upload do script SQL
scp fix-users-without-roles-ci.sql usuario@ci.z7botsolutions.com.br:/var/www/secured_guard/

# No servidor CI, executar correção
docker exec -i secured-guard-postgres-ci psql -U secured_guard_user -d secured_guard < fix-users-without-roles-ci.sql
```

**Resultado esperado:**
```
INSERT 0 1  (ou "ON CONFLICT DO NOTHING")
INSERT X Y  (X usuários corrigidos)
[Lista de usuários com roles]
COMMIT
```

---

## ✅ Passo 4: Testar Login

### 4.1. No Browser

1. Abrir https://ci.z7botsolutions.com.br
2. Abrir DevTools (F12) → Console
3. Tentar fazer login
4. Verificar resposta

**Sucesso:**
```javascript
✅ Axios Response: 200 /api/auth/login
✅ Token salvo no localStorage
```

### 4.2. Verificar Logs do Backend

```bash
# Em tempo real
docker logs -f secured-guard-backend-ci

# Fazer login no browser e observar logs
# Deve aparecer:
# ✅ Usuário encontrado: [username]
# ✅ Tokens gerados com sucesso
# ✅ Autenticação concluída com sucesso
```

---

## 🐛 Troubleshooting

### Problema: Container não encontrado

```bash
# Listar todos os containers
docker ps -a

# Verificar nome correto do container
docker ps --format "{{.Names}}"
```

Ajuste os comandos com o nome correto do container.

### Problema: Permissão negada no PostgreSQL

```bash
# Verificar variáveis de ambiente do backend
docker exec secured-guard-backend-ci env | grep -E "DB_|POSTGRES"

# Usar as credenciais corretas nos comandos psql
```

### Problema: Ainda retorna erro 500 após correção

```bash
# Reiniciar backend
docker restart secured-guard-backend-ci

# Aguardar 30 segundos
sleep 30

# Verificar se subiu corretamente
docker logs secured-guard-backend-ci --tail 50
```

---

## 📊 Checklist de Execução

- [ ] Conectado ao servidor CI via SSH
- [ ] Executado diagnóstico (script ou manual)
- [ ] Identificado usuários sem roles (se houver)
- [ ] Aplicado correção SQL (se necessário)
- [ ] Testado login no browser
- [ ] Verificado logs do backend
- [ ] Login funcionando ✅

---

## 📞 Próximos Passos

Após executar o diagnóstico:

1. **Se login funcionar:** ✅ Problema resolvido!
2. **Se ainda der erro 500:** Compartilhe comigo:
   - Conteúdo do `diagnostico-resultado.txt`
   - Últimas 50 linhas do log do backend
   - Mensagem de erro exata do browser

---

**Tempo estimado:** 10-15 minutos  
**Dificuldade:** Média  
**Risco:** Baixo (apenas leitura no diagnóstico, correção SQL é segura)
