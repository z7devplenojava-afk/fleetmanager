# 🚨 AÇÃO IMEDIATA - Erro 500 Ainda Ocorrendo

## Status
O erro 500 persiste após o deploy. Precisamos executar o diagnóstico **AGORA** no servidor CI.

## 🎯 Opção 1: Diagnóstico Rápido via SSH

```bash
# 1. Conectar ao servidor CI
ssh seu_usuario@ci.z7botsolutions.com.br

# 2. Navegar para o diretório
cd /var/www/secured_guard

# 3. Ver logs do backend EM TEMPO REAL
docker logs -f secured-guard-backend-ci

# Em outra janela SSH, tente fazer login no browser
# Você verá o erro aparecer nos logs
```

**Procure por:**
- `ERROR`
- `Exception`
- `NullPointerException`
- `user.getRoles()`

## 🎯 Opção 2: Verificar Usuários Sem Roles

```bash
# No servidor CI
docker exec secured-guard-postgres-ci psql -U secured_guard_user -d secured_guard -c "
SELECT u.username, u.email, COUNT(ur.role_id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.username, u.email
HAVING COUNT(ur.role_id) = 0
LIMIT 10;"
```

**Se retornar usuários:** Execute a correção imediatamente!

## 🔧 Correção Imediata

```bash
# Aplicar correção SQL
docker exec -i secured-guard-postgres-ci psql -U secured_guard_user -d secured_guard << 'EOF'
BEGIN;

-- Criar role COLABORADOR
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Associar role a usuários sem roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'COLABORADOR'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = u.id
  );

COMMIT;
EOF
```

## 📋 Checklist Rápido

- [ ] Conectar ao servidor CI via SSH
- [ ] Ver logs do backend em tempo real
- [ ] Identificar erro específico
- [ ] Verificar usuários sem roles
- [ ] Aplicar correção SQL
- [ ] Testar login novamente

## ❓ Não Tem Acesso SSH?

Se você não tem acesso SSH ao servidor CI, me informe:
1. Quem tem acesso ao servidor?
2. Podemos pedir para alguém executar o diagnóstico?
3. Existe alguma ferramenta de monitoramento/logs que você possa acessar?

## 🆘 Compartilhe Comigo

Se conseguir acessar o servidor, copie e cole aqui:
1. **Últimas 50 linhas do log do backend** (quando o erro ocorrer)
2. **Resultado da query de usuários sem roles**
3. **Qualquer stack trace que aparecer**

---

**URGENTE:** Execute o diagnóstico o mais rápido possível para identificarmos a causa raiz!
