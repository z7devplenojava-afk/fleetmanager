# 🐳 Secured Guard - Guia Rápido Docker

## 🚀 Início Rápido

### Windows (PowerShell)
```powershell
.\start-dev.ps1
```

### Linux/Mac
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Manual
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 📦 O que está incluído?

✅ **PostgreSQL** - Banco de dados principal (porta 5432)  
✅ **Redis** - Cache e filas (porta 6379)  
✅ **MinIO** - Armazenamento S3 (portas 9000, 9001)  
✅ **WhatsApp Service** - Baileys REST API (porta 3333)

## 🔧 Configuração do Backend

O arquivo `backend/src/main/resources/application.properties` já está configurado:

```properties
# Habilitar WhatsApp Baileys
baileys.enabled=true
baileys.rest.url=http://localhost:3333

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/secured_guard

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
```

## 📱 Conectar WhatsApp

1. **Iniciar serviços Docker:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Iniciar backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Acessar sistema:**
   - Frontend: http://localhost:3000
   - Ir para: **Configurações > Conexão WhatsApp**

4. **Gerar QR Code:**
   - Clicar em **"Limpar Sessão e Reconectar"** (primeira vez)
   - Clicar em **"Gerar QR Code"**
   - Escanear com WhatsApp do celular

## 🔍 Verificar Status

```bash
# Ver todos os containers
docker-compose -f docker-compose.dev.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs do WhatsApp
docker-compose -f docker-compose.dev.yml logs -f whatsapp-service

# Testar WhatsApp Service
curl http://localhost:3333/health
```

## 🛑 Parar Serviços

```bash
# Parar todos os containers
docker-compose -f docker-compose.dev.yml down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```

## 🔧 Troubleshooting

### WhatsApp: Erro 401

**Problema:** Sessão anterior corrompida

**Solução:**
```bash
# Limpar sessões
docker exec whatsapp-service-dev rm -rf /app/sessions/*
docker restart whatsapp-service-dev

# Ou via UI: Clicar em "Limpar Sessão e Reconectar"
```

### Backend não conecta

**Solução:**
```bash
# Verificar se serviços estão prontos
docker-compose -f docker-compose.dev.yml ps

# Ver logs
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs redis
```

### Reiniciar um serviço específico

```bash
docker-compose -f docker-compose.dev.yml restart whatsapp-service
```

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **[DOCKER_COMPOSE_GUIDE.md](DOCKER_COMPOSE_GUIDE.md)** - Guia completo
- **[docker-compose.dev.yml](docker-compose.dev.yml)** - Configuração dos serviços

## 💡 Dicas

1. ✅ Use `docker-compose.dev.yml` para desenvolvimento
2. ✅ Sempre verifique os logs quando algo não funcionar
3. ✅ Faça backup das sessões WhatsApp antes de limpar volumes
4. ✅ Use os scripts `start-dev.ps1` ou `start-dev.sh` para facilitar

## 🆘 Comandos Úteis

```bash
# Status dos containers
docker-compose -f docker-compose.dev.yml ps

# Logs de todos os serviços
docker-compose -f docker-compose.dev.yml logs -f

# Reconstruir imagem do WhatsApp
docker-compose -f docker-compose.dev.yml build --no-cache whatsapp-service

# Executar comando em container
docker-compose -f docker-compose.dev.yml exec whatsapp-service sh

# Ver uso de recursos
docker stats
```

---

**Última atualização:** 03/12/2025





























