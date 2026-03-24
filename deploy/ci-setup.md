# 🚀 Configuração CI/CD - SecuredGuard

## 📋 Visão Geral

Este projeto possui workflows do GitHub Actions configurados para CI/CD automático. Os workflows estão localizados em `.github/workflows/`.

## 🔧 Workflows Disponíveis

### 1. **main-ci-cd.yml** - Pipeline Principal
- **Trigger**: Push para `main` ou `develop`
- **Funcionalidades**:
  - ✅ Testes automatizados (Backend + Frontend)
  - 🏗️ Build da aplicação
  - 🐳 Construção de imagens Docker
  - ☁️ Deploy automático para VPS (apenas `main`)
  - 🏥 Health checks pós-deploy
  - 📢 Notificações de status

### 2. **quick-deploy.yml** - Deploy Rápido
- **Trigger**: Apenas manual (workflow_dispatch)
- **Funcionalidades**:
  - ⚡ Build rápido sem testes
  - 🚀 Deploy direto para VPS
  - 🎯 Ideal para hotfixes e deploys urgentes

## 🔐 Secrets Necessários

Configure os seguintes secrets no GitHub:

### VPS Secrets
```bash
VPS_SSH_PRIVATE_KEY    # Chave privada SSH para acessar o VPS
VPS_USER              # Usuário SSH do VPS (ex: root, ubuntu)
VPS_HOST              # IP ou domínio do VPS (ex: 192.168.1.100)
```

### Como configurar os secrets:
1. Acesse: `Settings` → `Secrets and variables` → `Actions`
2. Clique em `New repository secret`
3. Adicione cada secret com o valor correspondente

## 🛠️ Configuração do VPS

### 1. Preparar o VPS
```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar diretório do projeto
sudo mkdir -p /opt/secured-guard
sudo chown $USER:$USER /opt/secured-guard
```

### 2. Configurar SSH
```bash
# No seu computador local, gerar chave SSH se não tiver
ssh-keygen -t rsa -b 4096 -C "github-actions@secured-guard"

# Copiar chave pública para o VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub usuario@ip-do-vps

# Testar conexão
ssh usuario@ip-do-vps "echo 'Conexão OK'"
```

### 3. Configurar chave privada no GitHub
```bash
# Copiar conteúdo da chave privada
cat ~/.ssh/id_rsa

# Colar no secret VPS_SSH_PRIVATE_KEY do GitHub
```

## 📊 Monitoramento

### Logs do GitHub Actions
- Acesse: `Actions` tab no GitHub
- Veja o histórico de execuções
- Clique em qualquer execução para ver logs detalhados

### Logs do VPS
```bash
# Conectar no VPS
ssh usuario@ip-do-vps

# Ver logs dos containers
cd /opt/secured-guard
docker-compose logs -f

# Ver status dos containers
docker-compose ps

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚨 Troubleshooting

### Problema: Falha na conexão SSH
```bash
# Verificar se a chave está correta
ssh -i ~/.ssh/id_rsa usuario@ip-do-vps

# Verificar permissões da chave
chmod 600 ~/.ssh/id_rsa
```

### Problema: Deploy falha
```bash
# Verificar logs do VPS
ssh usuario@ip-do-vps
cd /opt/secured-guard
docker-compose logs

# Verificar se as portas estão livres
netstat -tulpn | grep :8080
netstat -tulpn | grep :80
```

### Problema: Containers não sobem
```bash
# Limpar containers antigos
docker-compose down
docker system prune -f

# Reconstruir tudo
docker-compose up -d --build
```

## 🔄 Fluxo de Deploy

### Deploy Automático (main branch)
1. **Push** para `main` → Trigger automático
2. **Testes** → Backend + Frontend
3. **Build** → JAR + Frontend build
4. **Docker** → Construção das imagens
5. **Deploy** → Transferência para VPS + Docker Compose
6. **Health Check** → Verificação dos serviços
7. **Notificação** → Status final

### Deploy Manual (Quick Deploy)
1. **GitHub Actions** → `Actions` tab
2. **Quick Deploy** → Selecionar workflow
3. **Run workflow** → Executar manualmente
4. **Deploy** → Processo rápido sem testes

## 📈 Melhorias Futuras

- [ ] Deploy para múltiplos ambientes (staging/prod)
- [ ] Rollback automático em caso de falha
- [ ] Notificações via Slack/Email
- [ ] Testes de integração automatizados
- [ ] Monitoramento com Prometheus/Grafana
- [ ] Backup automático antes do deploy

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do GitHub Actions
2. Consulte os logs do VPS
3. Verifique se todos os secrets estão configurados
4. Teste a conectividade SSH manualmente
