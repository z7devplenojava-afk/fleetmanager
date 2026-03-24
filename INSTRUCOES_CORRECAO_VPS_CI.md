# 🚀 INSTRUÇÕES PARA CORRIGIR BANCO DE DADOS CI NO VPS

## 📋 PROBLEMA
A tabela `user_custom_permissions` não existe no banco de dados CI, causando falha no login.

## ✅ SOLUÇÃO

### **1️⃣ Conecte no VPS:**
```bash
ssh root@185.225.233.18
```
**Senha:** `4KaCiJc6an@72025`

---

### **2️⃣ Navegue até o diretório CI:**
```bash
cd /var/www/secured_guard/ci
```

---

### **3️⃣ Execute o comando para criar a tabela:**

```bash
docker exec -i secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci << 'EOF'
CREATE TABLE IF NOT EXISTS user_custom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    granted_by UUID,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_custom_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_custom_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_permission UNIQUE (user_id, permission_key)
);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user_id ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_permission_key ON user_custom_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_enabled ON user_custom_permissions(enabled);
SELECT 'Tabela criada com sucesso!' as status;
\d user_custom_permissions
EOF
```

---

### **4️⃣ Reinicie o backend:**
```bash
docker-compose -f docker-compose.ci.yml restart backend
```

---

### **5️⃣ Aguarde 10 segundos e teste:**
```bash
sleep 10
curl http://localhost:8082/api/health
```

---

### **6️⃣ Teste o login (do seu computador):**
```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "jose.ramos", "password": "sua_senha_aqui"}'
```

---

## 🔍 COMANDOS DE VERIFICAÇÃO

### Verificar se a tabela existe:
```bash
docker exec -i secured-guard-db-ci psql -U secured_guard_ci -d secured_guard_ci -c "\d user_custom_permissions"
```

### Verificar logs do backend:
```bash
docker logs secured-guard-backend-ci --tail 50
```

### Verificar status dos containers:
```bash
docker ps
```

### Verificar logs do frontend:
```bash
docker logs secured-guard-frontend-ci --tail 50
```

---

## ✅ RESULTADO ESPERADO

Após executar os comandos:
- ✅ Tabela `user_custom_permissions` criada
- ✅ Backend reiniciado e funcionando
- ✅ Health check retorna status 200
- ✅ Login funciona normalmente
- ✅ Frontend para de reiniciar

---

## 🆘 SE ALGO DER ERRADO

### Verificar se o container do banco está rodando:
```bash
docker ps | grep secured-guard-db-ci
```

### Se o banco não estiver rodando:
```bash
docker-compose -f docker-compose.ci.yml up -d db
```

### Ver logs completos do deploy:
```bash
docker-compose -f docker-compose.ci.yml logs
```

### Reiniciar tudo:
```bash
docker-compose -f docker-compose.ci.yml restart
```

---

## 📞 PRÓXIMOS PASSOS

Após a correção:
1. Teste o login em https://ci.z7botsolutions.com.br
2. Verifique se o frontend carrega corretamente
3. Teste as funcionalidades principais

---

**Criado em:** 23/10/2025
**Ambiente:** CI (Integração Contínua)
**VPS:** 185.225.233.18

