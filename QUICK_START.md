# 🚀 Secured Guard - Início Rápido

## ⚡ 3 Passos para Rodar o Sistema

### **1. Clonar Repositório**
```bash
git clone https://github.com/your-org/secured-guard.git
cd secured-guard
```

### **2. Iniciar Ambiente Local**

**Windows (PowerShell):**
```powershell
.\scripts\start-local.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

### **3. Acessar Sistema**

- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8083
- 📦 **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin)
- 📱 **WhatsApp API:** http://localhost:3333/health

---

## 📦 O que foi Instalado?

✅ **PostgreSQL** - Banco de dados (porta 5432)  
✅ **Redis** - Cache (porta 6379)  
✅ **MinIO** - Armazenamento S3 (portas 9000, 9001)  
✅ **WhatsApp** - Serviço Baileys (porta 3333)  
✅ **Backend** - Spring Boot (porta 8083)  
✅ **Frontend** - React/Vite (porta 3000)  

---

## 🔐 Credenciais Padrão

### **Banco de Dados (Local)**
```
Host: localhost
Port: 5432
Database: secured_guard_local
User: dev_user
Password: dev_pass
```

### **MinIO**
```
URL: http://localhost:9001
User: minioadmin
Password: minioadmin
```

### **Admin do Sistema**
```
(Criado automaticamente pelos seeds)
Usuário: admin
Senha: (verifique nos seeds)
```

---

## 💡 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.local.yml logs -f

# Parar tudo
docker-compose -f docker-compose.local.yml down

# Reiniciar um serviço
docker-compose -f docker-compose.local.yml restart backend

# Ver status
docker-compose -f docker-compose.local.yml ps
```

---

## 📱 Conectar WhatsApp

1. Acesse: **Configurações > Conexão WhatsApp**
2. Clique em: **"Limpar Sessão e Reconectar"** (primeira vez)
3. Clique em: **"Gerar QR Code"**
4. Escaneie com WhatsApp do celular

---

## 🔧 Problemas Comuns

### **Container não inicia**
```bash
docker-compose -f docker-compose.local.yml logs -f [service-name]
```

### **Backend não conecta ao banco**
```bash
# Verificar PostgreSQL
docker exec secured-guard-local-db pg_isready -U dev_user
```

### **WhatsApp: Erro 401**
```bash
# Limpar sessão
docker exec secured-guard-local-whatsapp rm -rf /app/sessions/*
docker restart secured-guard-local-whatsapp
```

---

## 📚 Documentação Completa

- **[README_ENVIRONMENTS.md](README_ENVIRONMENTS.md)** - Guia completo de ambientes
- **[DOCKER_COMPOSE_GUIDE.md](DOCKER_COMPOSE_GUIDE.md)** - Guia Docker detalhado
- **[README_DOCKER.md](README_DOCKER.md)** - Referência rápida Docker

---

## 🎯 Próximos Passos

1. ✅ Sistema rodando localmente
2. 📱 Conectar WhatsApp
3. 👤 Fazer login no sistema
4. 🧪 Testar funcionalidades
5. 🚀 Ver [README_ENVIRONMENTS.md](README_ENVIRONMENTS.md) para deploy

---

**Desenvolvido com ❤️ pela equipe Secured Guard**





























