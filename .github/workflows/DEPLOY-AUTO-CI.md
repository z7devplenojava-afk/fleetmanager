# 🚀 Deploy Automático CI - SecuredGuard

## ✅ Status Atual

O deploy automático para CI **já está configurado e funcionando**!

## 📋 Como Funciona

### **Trigger Automático**
- **Branch**: `ci`
- **Ação**: Qualquer `push` na branch `ci` dispara o deploy automaticamente
- **Workflow**: `.github/workflows/deploy-ci-docker.yml`

### **Processo de Deploy**

1. **📥 Checkout** - Baixa o código da branch `ci`
2. **☕ Setup Java 17** - Configura ambiente Java
3. **📦 Setup Node.js 20** - Configura ambiente Node.js
4. **🔨 Build Backend** - Compila o backend com Maven
5. **🎨 Build Frontend** - Compila o frontend com Vite
6. **🐳 Build Docker Images** - Cria imagens Docker
7. **🔐 Login Docker Hub** - Autentica no Docker Hub
8. **📤 Push Images** - Envia imagens para Docker Hub
9. **🔑 SSH Setup** - Configura conexão SSH com VPS
10. **📤 Transfer Files** - Transfere arquivos de configuração
11. **⚙️ Create .env** - Cria arquivo de variáveis de ambiente
12. **💾 Backup** - Faz backup dos dados existentes
13. **📥 Pull Images** - Baixa novas imagens na VPS
14. **🚀 Start Containers** - Inicia containers Docker
15. **🏥 Health Check** - Verifica se aplicação está funcionando
16. **🎉 Success** - Deploy concluído com sucesso!

## 🚀 Como Usar

### **Deploy Automático (Recomendado)**

```bash
# 1. Fazer checkout da branch CI
git checkout ci

# 2. Fazer suas alterações
# ... editar arquivos ...

# 3. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin ci

# ✅ Deploy automático será iniciado!
```

### **Deploy Manual**

1. Acesse: `https://github.com/[seu-usuario]/secured-guard/actions`
2. Selecione: **"🐳 Deploy CI Environment (Docker Compose)"**
3. Clique em: **"Run workflow"**
4. Escolha a branch: `ci`
5. Clique em: **"Run workflow"**

## 📊 Monitoramento

### **Verificar Status do Deploy**

1. **GitHub Actions**:
   - Acesse: `https://github.com/[seu-usuario]/secured-guard/actions`
   - Veja o status do workflow em tempo real

2. **Logs do Deploy**:
   - Cada step mostra logs detalhados
   - Em caso de erro, os logs indicam o problema

3. **Verificar Aplicação**:
   ```bash
   # Health check
   curl https://ci.z7botsolutions.com.br/api/health
   
   # Verificar containers na VPS
   ssh securedguard@185.225.233.18
   cd /var/www/secured_guard/ci
   docker-compose -f docker-compose.ci.yml ps
   ```

## 🔧 Configuração Necessária

### **GitHub Secrets**

Certifique-se de que os seguintes secrets estão configurados:

```
✅ DOCKER_USERNAME - Usuário do Docker Hub
✅ DOCKER_PASSWORD - Senha do Docker Hub
✅ VPS_HOST - IP ou hostname da VPS (ex: 185.225.233.18)
✅ VPS_USER - Usuário SSH da VPS (ex: securedguard)
✅ VPS_PASSWORD - Senha SSH da VPS
✅ POSTGRES_PASSWORD_CI - Senha do PostgreSQL para CI
✅ REDIS_PASSWORD - Senha do Redis
✅ JWT_SECRET - Chave secreta JWT (mínimo 64 caracteres)
```

### **Como Configurar Secrets**

1. Acesse: `https://github.com/[seu-usuario]/secured-guard/settings/secrets/actions`
2. Clique em: **"New repository secret"**
3. Adicione cada secret acima
4. Salve

## 🐛 Troubleshooting

### **Deploy Falhou**

1. **Verificar Logs**:
   - Acesse GitHub Actions
   - Veja qual step falhou
   - Leia os logs do erro

2. **Problemas Comuns**:
   - ❌ **Erro de autenticação Docker Hub**: Verificar `DOCKER_USERNAME` e `DOCKER_PASSWORD`
   - ❌ **Erro de conexão SSH**: Verificar `VPS_HOST`, `VPS_USER`, `VPS_PASSWORD`
   - ❌ **Erro de build**: Verificar se código compila localmente
   - ❌ **Health check falhou**: Verificar logs do backend na VPS

3. **Verificar Containers na VPS**:
   ```bash
   ssh securedguard@185.225.233.18
   cd /var/www/secured_guard/ci
   docker-compose -f docker-compose.ci.yml ps
   docker-compose -f docker-compose.ci.yml logs --tail 100
   ```

### **Deploy Muito Lento**

- Build do backend/frontend pode levar 5-10 minutos
- Push de imagens Docker pode levar 2-5 minutos
- Deploy na VPS pode levar 3-5 minutos
- **Total**: ~10-20 minutos

### **Aplicação Não Inicia**

1. Verificar logs do backend:
   ```bash
   ssh securedguard@185.225.233.18
   docker logs secured-guard-backend-ci --tail 100
   ```

2. Verificar variáveis de ambiente:
   ```bash
   ssh securedguard@185.225.233.18
   cd /var/www/secured_guard/ci
   cat .env
   ```

3. Verificar banco de dados:
   ```bash
   ssh securedguard@185.225.233.18
   docker exec -it secured-guard-db-ci psql -U postgres -d secured_guard_ci
   ```

## 📝 Notas Importantes

1. **Branch `ci`**: O deploy só acontece na branch `ci`
2. **Backup Automático**: Backup é feito antes de cada deploy
3. **Rollback**: Em caso de falha, o workflow tenta fazer rollback
4. **Health Check**: Aplicação deve responder em até 5 minutos após deploy
5. **JWT_SECRET**: Deve ter no mínimo 64 caracteres

## 🎯 Próximos Passos

Para melhorar o deploy automático, você pode:

1. ✅ **Adicionar notificações** (Slack, Discord, Email)
2. ✅ **Adicionar testes** antes do deploy
3. ✅ **Adicionar validações** de código
4. ✅ **Otimizar build** (cache, paralelização)
5. ✅ **Adicionar staging** antes de CI

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do GitHub Actions
2. Verificar status dos containers na VPS
3. Verificar logs da aplicação
4. Consultar documentação em `deploy/README-CICD.md`
