# ⚡ Solução Rápida - Ambiente Híbrido

## 🎯 Problema Identificado

Docker Swarm mode + WSL com `/mnt/c/` está causando timeouts nos containers backend/frontend.

## ✅ Solução: Ambiente Híbrido

**Infraestrutura no Docker + Aplicações Nativas**

### **O que está rodando:**

✅ **PostgreSQL** (Docker) - porta 5432  
✅ **Redis** (Docker) - porta 6379  
✅ **MinIO** (Docker) - porta 9000, 9001  
✅ **WhatsApp** (Docker) - porta 3333  

### **O que rodar nativamente:**

🚀 **Backend** - Maven local  
🚀 **Frontend** - npm local  

---

## 🚀 Comandos para Executar

### **1. Manter Infraestrutura Docker Rodando:**

```powershell
# Já está rodando! ✅
# PostgreSQL, Redis, MinIO, WhatsApp
```

### **2. Iniciar Backend (Terminal 1):**

```powershell
cd C:\dev\secured-guard\backend
mvn spring-boot:run
```

### **3. Iniciar Frontend (Terminal 2):**

```powershell
cd C:\dev\secured-guard\frontend
npm run dev
```

---

## ✅ Resultado

```
✅ PostgreSQL:  secured-guard-local-db (Docker)
✅ Redis:       secured-guard-local-redis (Docker)
✅ MinIO:       secured-guard-local-minio (Docker)
✅ WhatsApp:    secured-guard-local-whatsapp (Docker)
✅ Backend:     Maven nativo (Windows)
✅ Frontend:    npm nativo (Windows)
```

---

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8083
- **MinIO:** http://localhost:9001
- **WhatsApp:** http://localhost:3333/health

---

## 💡 Vantagens desta Abordagem

✅ **Hot Reload Perfeito** - Funciona 100%  
✅ **Debug Fácil** - IntelliJ/Cursor debug nativo  
✅ **Performance Máxima** - Sem overhead de Docker  
✅ **Infraestrutura Isolada** - Bancos em Docker  
✅ **Melhor dos 2 Mundos** - Infraestrutura isolada + Dev rápido  

---

## 🔧 Configuração Backend

O `application.properties` já está configurado para conectar nos containers Docker:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/secured_guard_local
spring.datasource.username=dev_user
spring.datasource.password=dev_pass

spring.data.redis.host=localhost
spring.data.redis.port=6379

baileys.enabled=true
baileys.rest.url=http://localhost:3333
```

---

## 🎯 Workflow Diário

```powershell
# 1. Iniciar infraestrutura (uma vez por dia)
wsl bash -c "cd ~/secured-guard && docker-compose -f docker-compose.local.yml up -d postgres redis minio whatsapp"

# 2. Iniciar backend (Terminal 1)
cd backend && mvn spring-boot:run

# 3. Iniciar frontend (Terminal 2)
cd frontend && npm run dev

# 4. Desenvolver normalmente! ✅
```

---

## 🛑 Parar Tudo

```powershell
# Parar backend: Ctrl+C no terminal
# Parar frontend: Ctrl+C no terminal

# Parar infraestrutura Docker:
wsl bash -c "cd ~/secured-guard && docker-compose -f docker-compose.local.yml down"
```

---

**Esta é a abordagem MAIS RÁPIDA e EFICIENTE para desenvolvimento!** 🚀





























