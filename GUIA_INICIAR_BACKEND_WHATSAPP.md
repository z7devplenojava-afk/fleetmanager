# 🚀 Guia: Iniciar Backend + WhatsApp Service

Este guia mostra como iniciar o backend junto com o serviço WhatsApp (Baileys REST) automaticamente.

## 📋 Pré-requisitos

1. **Docker Desktop** deve estar rodando
2. **Java 17+** instalado
3. **Maven** instalado (ou usar o Maven Wrapper incluído)

## 🎯 Método 1: Script Automático (Recomendado)

### Windows (PowerShell):
```powershell
.\iniciar-backend-com-whatsapp.ps1
```

### Windows (Batch):
```cmd
iniciar-backend-com-whatsapp.bat
```

O script irá:
1. ✅ Verificar se o Docker está rodando
2. ✅ Criar a rede Docker necessária
3. ✅ Iniciar PostgreSQL, Redis e WhatsApp Service via Docker Compose
4. ✅ Iniciar o Backend Spring Boot na porta 8083
5. ✅ Verificar o status de todos os serviços

## 🎯 Método 2: Manual

### 1. Iniciar serviços Docker:
```powershell
docker network create secured-guard
docker compose up -d postgres redis whatsapp-service
```

### 2. Iniciar Backend:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
# ou
mvn spring-boot:run
```

## 📊 Portas dos Serviços

- **Backend**: `http://localhost:8083`
- **PostgreSQL**: `localhost:5433`
- **Redis**: `localhost:6379`
- **WhatsApp Service**: `http://localhost:3333`

## ✅ Verificar Status

### Ver containers Docker:
```powershell
docker ps
```

### Ver logs do WhatsApp Service:
```powershell
docker logs -f whatsapp-service
```

### Verificar se Backend está rodando:
```powershell
curl http://localhost:8083/api/health
# ou abra no navegador
```

## 🛑 Parar Serviços

### Parar containers Docker:
```powershell
docker compose down
```

### Parar Backend:
- Pressione `Ctrl + C` no terminal onde está rodando
- Ou feche a janela do terminal

## 🔧 Troubleshooting

### Backend não inicia:
- Verifique se a porta 8083 está livre: `netstat -ano | findstr :8083`
- Verifique os logs do backend no terminal

### WhatsApp Service não inicia:
- Verifique se a porta 3333 está livre: `netstat -ano | findstr :3333`
- Verifique os logs: `docker logs whatsapp-service`
- Verifique se o Docker está rodando: `docker ps`

### Erro de rede Docker:
```powershell
docker network create secured-guard
```

## 📝 Notas

- O script verifica se o backend já está rodando antes de iniciar
- Se o backend já estiver rodando, você pode escolher reiniciá-lo
- O WhatsApp Service precisa estar rodando para gerar QR Codes
- Todos os serviços devem estar rodando para o sistema funcionar completamente

