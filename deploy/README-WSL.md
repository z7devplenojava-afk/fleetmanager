# 🐧 Deploy SecuredGuard via WSL

Guia específico para fazer deploy usando WSL (Windows Subsystem for Linux).

## 🚀 Vantagens do WSL

- ✅ **Performance melhor** que PowerShell
- ✅ **Rsync nativo** para sincronização eficiente
- ✅ **SSH otimizado** para Linux
- ✅ **Compatibilidade total** com scripts bash
- ✅ **Acesso direto** aos arquivos do Windows

## 📋 Pré-requisitos

- WSL2 instalado e configurado
- Ubuntu/Debian no WSL
- Chave SSH configurada
- VPS Ubuntu acessível

## 🛠️ Configuração Inicial

### 1. Abrir WSL
```bash
# No Windows Terminal ou PowerShell
wsl
```

### 2. Navegar para o projeto
```bash
# O projeto está em /mnt/c/dev/secured-guard
cd /mnt/c/dev/secured-guard
```

### 3. Verificar se está no diretório correto
```bash
ls -la deploy/
# Deve mostrar os arquivos de deploy
```

## 🚀 Deploy Automático

### Opção 1: Script Interativo
```bash
# Executar script WSL otimizado
chmod +x deploy/deploy-to-vps-wsl.sh
./deploy/deploy-to-vps-wsl.sh
```

### Opção 2: Script com Parâmetros
```bash
# Definir variáveis de ambiente
export VPS_HOST="IP_DA_VPS"
export VPS_USER="usuario"
export VPS_PORT="22"

# Executar deploy
./deploy/deploy-to-vps-wsl.sh
```

## 🔧 Configuração SSH

### Gerar chave SSH (se não tiver)
```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Copiar chave para VPS
ssh-copy-id -p 22 usuario@IP_DA_VPS
```

### Testar conexão
```bash
# Testar SSH
ssh usuario@IP_DA_VPS

# Testar com porta específica
ssh -p 2222 usuario@IP_DA_VPS
```

## 📁 Estrutura no WSL

```
/mnt/c/dev/secured-guard/          # Projeto no Windows
├── deploy/
│   ├── deploy-to-vps-wsl.sh       # Script WSL otimizado
│   ├── install-vps.sh             # Instalação na VPS
│   └── ...
├── backend/
├── frontend/
└── ...
```

## 🔄 Workflow de Deploy

### 1. Desenvolvimento Local
```bash
# No WSL, navegar para o projeto
cd /mnt/c/dev/secured-guard

# Fazer alterações no código
# (usando VS Code, Vim, ou qualquer editor)
```

### 2. Deploy para VPS
```bash
# Executar deploy
./deploy/deploy-to-vps-wsl.sh
```

### 3. Verificar Deploy
```bash
# Conectar na VPS
ssh usuario@IP_DA_VPS

# Verificar status
cd /opt/secured-guard
docker compose -f deploy/docker-compose.prod.yml ps
```

## 🛠️ Comandos Úteis

### No WSL (Local)
```bash
# Ver logs remotos
ssh usuario@IP_DA_VPS 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f'

# Fazer backup remoto
ssh usuario@IP_DA_VPS '/opt/secured-guard/backup.sh'

# Reiniciar serviços remotos
ssh usuario@IP_DA_VPS 'cd /opt/secured-guard && ./deploy.sh'

# Sincronizar apenas arquivos específicos
rsync -avz --include='*.java' --include='*.tsx' --exclude='*' \
  ./ usuario@IP_DA_VPS:/opt/secured-guard/
```

### Na VPS
```bash
# Ver logs
docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f

# Status dos serviços
docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml ps

# Backup manual
/opt/secured-guard/backup.sh

# Reiniciar tudo
cd /opt/secured-guard && ./deploy.sh
```

## 🔍 Monitoramento

### Verificar Saúde dos Serviços
```bash
# Backend
curl http://IP_DA_VPS:8080/actuator/health

# Frontend
curl http://IP_DA_VPS/

# Com HTTPS
curl -k https://IP_DA_VPS/
```

### Logs em Tempo Real
```bash
# Todos os serviços
ssh usuario@IP_DA_VPS 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f'

# Apenas backend
ssh usuario@IP_DA_VPS 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f backend'

# Apenas frontend
ssh usuario@IP_DA_VPS 'docker compose -f /opt/secured-guard/deploy/docker-compose.prod.yml logs -f frontend'
```

## 🆘 Solução de Problemas

### Problemas de Permissão
```bash
# Corrigir permissões no WSL
sudo chown -R $USER:$USER /mnt/c/dev/secured-guard

# Corrigir permissões na VPS
ssh usuario@IP_DA_VPS 'sudo chown -R $USER:$USER /opt/secured-guard'
```

### Problemas de SSH
```bash
# Verificar configuração SSH
ssh -v usuario@IP_DA_VPS

# Testar com chave específica
ssh -i ~/.ssh/id_rsa usuario@IP_DA_VPS
```

### Problemas de Rsync
```bash
# Verificar se rsync está instalado
which rsync

# Instalar rsync se necessário
sudo apt update && sudo apt install rsync
```

### Problemas de Docker
```bash
# Verificar se Docker está rodando na VPS
ssh usuario@IP_DA_VPS 'docker --version'

# Reiniciar Docker na VPS
ssh usuario@IP_DA_VPS 'sudo systemctl restart docker'
```

## 🎯 Dicas de Performance

### 1. Usar Rsync com Exclusões
```bash
# Criar arquivo de exclusões
cat > .rsync-exclude << EOF
node_modules/
target/
.git/
*.log
uploads/
logs/
EOF

# Usar rsync com exclusões
rsync -avz --exclude-from=.rsync-exclude ./ usuario@IP_DA_VPS:/opt/secured-guard/
```

### 2. Deploy Incremental
```bash
# Deploy apenas arquivos modificados
rsync -avz --delete --exclude-from=.rsync-exclude \
  ./ usuario@IP_DA_VPS:/opt/secured-guard/
```

### 3. Cache de Dependências
```bash
# Na VPS, usar volumes para node_modules e target
# (já configurado nos docker-compose files)
```

## 🎉 Pronto!

Com WSL você tem:
- ✅ **Deploy mais rápido** com rsync
- ✅ **SSH nativo** e otimizado
- ✅ **Compatibilidade total** com Linux
- ✅ **Acesso direto** aos arquivos do Windows
- ✅ **Performance melhor** que PowerShell

**Execute o deploy e sua aplicação estará rodando na VPS!** 🚀
