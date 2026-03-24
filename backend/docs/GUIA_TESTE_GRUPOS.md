# 🚀 Guia Rápido - Teste do Sistema de Grupos

## 📋 Pré-requisitos

1. **Backend rodando**: `http://localhost:8080`
2. **Frontend rodando**: `http://localhost:5173`
3. **Banco de dados**: MySQL configurado
4. **Postman**: Instalado e configurado

---

## 🔧 Configuração Inicial

### 1. Executar Migrations
```bash
# O Flyway executará automaticamente a migration V200
# que cria as tabelas de grupos e insere os dados padrão
```

### 2. Inserir Usuários de Teste (Opcional)
```sql
-- Execute o script: insert_test_users_groups.sql
-- Isso criará usuários prontos para teste
```

### 3. Configurar Postman
- **baseUrl**: `http://localhost:8080`
- **token**: (será preenchido automaticamente)

---

## 🧪 Teste Rápido (5 minutos)

### Passo 1: Inicializar Grupos
```bash
POST http://localhost:8080/api/groups/initialize
```

### Passo 2: Criar Super Admin
```json
POST http://localhost:8080/api/auth/register
{
  "username": "superadmin@promover.com",
  "email": "superadmin@promover.com",
  "password": "SuperAdmin123!",
  "name": "Super Administrador",
  "fullName": "Super Administrador do Sistema",
  "role": "CEO"
}
```

### Passo 3: Fazer Login
```json
POST http://localhost:8080/api/auth/login
{
  "username": "superadmin@promover.com",
  "password": "SuperAdmin123!"
}
```

### Passo 4: Listar Grupos
```bash
GET http://localhost:8080/api/groups
Authorization: Bearer {{token}}
```

### Passo 5: Testar Frontend
1. Acesse: `http://localhost:5173`
2. Faça login com: `superadmin@promover.com` / `SuperAdmin123!`
3. Vá para: Menu → Grupos

---

## 🎯 Teste de Cenários

### Cenário 1: Usuário com Múltiplos Grupos

#### 1. Criar Usuário de Teste
```json
POST http://localhost:8080/api/auth/register
{
  "username": "multigrupo@promover.com",
  "email": "multigrupo@promover.com",
  "password": "Multi123!",
  "name": "Usuário Multi Grupo",
  "fullName": "Usuário com Múltiplos Grupos",
  "role": "COLABORADOR"
}
```

#### 2. Adicionar ao GRUPO_RH
```bash
POST http://localhost:8080/api/groups/4/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 3. Adicionar ao GRUPO_SUPERVISOR
```bash
POST http://localhost:8080/api/groups/6/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 4. Verificar Permissões
```bash
GET http://localhost:8080/api/groups/user/{{userId}}/permissions
Authorization: Bearer {{token}}
```

**Resultado Esperado:**
```json
[
  "VIEW_PAYSLIP",
  "DOWNLOAD_PAYSLIP",
  "EDIT_PROFILE",
  "VIEW_EMPLOYEES",
  "MANAGE_EMPLOYEES",
  "VIEW_REPORTS",
  "VIEW_CLIENTS",
  "VIEW_CONTRACTS",
  "VIEW_FINANCIAL",
  "VIEW_FLEET",
  "VIEW_DOCUMENTS"
]
```

---

## 📊 IDs dos Grupos

| ID | Grupo | Nome |
|----|-------|------|
| 1 | GRUPO_SUPER_ADMIN | Super Administrador |
| 2 | GRUPO_ADMIN | Administrador |
| 3 | GRUPO_GESTOR | Gestor |
| 4 | GRUPO_RH | Recursos Humanos |
| 5 | GRUPO_DPE | Departamento Pessoal |
| 6 | GRUPO_SUPERVISOR | Supervisor |
| 7 | GRUPO_COLABORADORES | Colaboradores |
| 8 | GRUPO_VIGILANTES | Vigilantes |

---

## 🔍 Verificações Importantes

### 1. Backend
- ✅ Grupos criados automaticamente
- ✅ Permissões configuradas corretamente
- ✅ Usuários podem pertencer a múltiplos grupos
- ✅ Permissões são herdadas de todos os grupos

### 2. Frontend
- ✅ Página de grupos acessível
- ✅ Tabela de grupos carregada
- ✅ Badges coloridos funcionando
- ✅ Menu dinâmico atualizado

### 3. Segurança
- ✅ Apenas usuários autorizados podem gerenciar grupos
- ✅ Permissões são verificadas corretamente
- ✅ Tokens de autenticação funcionando

---

## 🐛 Troubleshooting

### Erro: "Grupo não encontrado"
- Verifique se executou `POST /api/groups/initialize`
- Confirme se a migration V200 foi executada

### Erro: "Usuário não encontrado"
- Verifique se o usuário foi criado corretamente
- Confirme o ID do usuário na resposta do registro

### Erro: "Unauthorized"
- Verifique se fez login e obteve o token
- Confirme se o token está sendo enviado no header Authorization

### Frontend não carrega grupos
- Verifique se o backend está rodando
- Confirme se as rotas estão configuradas no App.tsx
- Verifique o console do navegador para erros

---

## 📝 Logs Úteis

### Backend (application.properties)
```properties
logging.level.com.z7design.secured_guard=DEBUG
logging.level.org.springframework.security=DEBUG
```

### Frontend (Console do Navegador)
- Verifique erros de rede
- Confirme se as requisições estão sendo feitas
- Verifique se o token está sendo enviado

---

## ✅ Checklist de Teste

- [ ] Backend iniciado sem erros
- [ ] Migration V200 executada
- [ ] Grupos inicializados (`POST /api/groups/initialize`)
- [ ] Usuário Super Admin criado
- [ ] Login funcionando
- [ ] Lista de grupos carregada
- [ ] Frontend acessível
- [ ] Página de grupos funcionando
- [ ] Usuário multi grupo criado
- [ ] Permissões combinadas verificadas
- [ ] Menu dinâmico atualizado

---

## 🎉 Sucesso!

Se todos os itens do checklist estão marcados, o sistema de grupos está funcionando perfeitamente! 

**Próximos passos:**
1. Teste diferentes combinações de grupos
2. Crie novos grupos personalizados
3. Teste as permissões no frontend
4. Configure grupos para usuários reais

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend
2. Confirme se todas as migrations foram executadas
3. Teste as APIs individualmente no Postman
4. Verifique se o banco de dados está acessível 