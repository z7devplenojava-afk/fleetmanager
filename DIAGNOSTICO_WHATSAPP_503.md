# 🔍 Diagnóstico: Erro 503 - WhatsApp Service

## ❌ Problema

O endpoint `/api/whatsapp/connection/create` está retornando erro 503 (Service Unavailable).

## 🔍 Causas Possíveis

1. **Container do WhatsApp service não está rodando**
2. **Imagem do WhatsApp service não existe no Docker Hub**
3. **Container está rodando mas não está respondendo**
4. **Problema de rede entre containers**
5. **Backend não consegue se conectar ao serviço**

## 🚀 Solução Rápida (Execute na VPS)

### 1. Verificar se o container está rodando

```bash
ssh usuario@ci.z7botsolutions.com.br
cd /var/www/secured_guard/ci
docker ps | grep whatsapp-service-ci
```

**Se não estiver rodando:**

```bash
# Verificar se a imagem existe
docker images | grep secured-guard-whatsapp

# Se a imagem não existir, fazer pull
docker pull z7design/secured-guard-whatsapp:ci

# Iniciar o container
docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci

# Aguardar 10 segundos
sleep 10

# Verificar logs
docker logs secured-guard-whatsapp-ci
```

### 2. Verificar se o serviço está respondendo

```bash
# Testar health endpoint
curl http://localhost:3333/health

# Testar endpoint de inicialização
curl "http://localhost:3333/instance/init?key=securedguard_ci"
```

### 3. Verificar conectividade do backend

```bash
# Testar se o backend consegue acessar o WhatsApp service
docker exec secured-guard-backend-ci curl -s http://whatsapp-service-ci:3333/health

# Verificar variável de ambiente
docker exec secured-guard-backend-ci env | grep BAILEYS
```

**Deve mostrar:**
```
BAILEYS_REST_URL=http://whatsapp-service-ci:3333
```

### 4. Verificar logs do backend

```bash
# Verificar se há erros de conexão
docker logs secured-guard-backend-ci | grep -i "baileys\|whatsapp\|503" | tail -20
```

### 5. Verificar rede Docker

```bash
# Verificar se ambos os containers estão na mesma rede
docker network inspect z7network | grep -A 5 -E "(whatsapp-service-ci|backend-ci)"
```

## 🔧 Correções Aplicadas

### 1. ✅ Workflow atualizado
- Build da imagem do WhatsApp service adicionado
- Push para Docker Hub adicionado
- Pull na VPS adicionado
- Verificação do serviço após deploy adicionada

### 2. ✅ Dockerfile atualizado
- `curl` adicionado para healthcheck

### 3. ✅ Script de diagnóstico criado
- `scripts/diagnose-whatsapp-ci.sh` - Script completo de diagnóstico

## 📋 Checklist de Verificação

Execute este checklist na VPS:

- [ ] Container `secured-guard-whatsapp-ci` está rodando
- [ ] Imagem `z7design/secured-guard-whatsapp:ci` existe
- [ ] Health endpoint responde: `curl http://localhost:3333/health`
- [ ] Backend consegue acessar: `docker exec secured-guard-backend-ci curl http://whatsapp-service-ci:3333/health`
- [ ] Variável `BAILEYS_REST_URL` está configurada no backend
- [ ] Ambos os containers estão na rede `z7network`
- [ ] Diretório `/var/www/secured_guard/ci/whatsapp_sessions` existe e tem permissões corretas

## 🚨 Se o Problema Persistir

### Opção 1: Reconstruir e reiniciar tudo

```bash
cd /var/www/secured_guard/ci

# Parar containers
docker-compose -f docker-compose.ci.yml down

# Remover imagem antiga
docker rmi z7design/secured-guard-whatsapp:ci

# Fazer pull da imagem atualizada
docker pull z7design/secured-guard-whatsapp:ci

# Iniciar containers
docker-compose -f docker-compose.ci.yml up -d

# Aguardar 30 segundos
sleep 30

# Verificar status
docker-compose -f docker-compose.ci.yml ps
docker logs secured-guard-whatsapp-ci
```

### Opção 2: Executar script de diagnóstico

```bash
# Transferir script para VPS
scp scripts/diagnose-whatsapp-ci.sh usuario@ci.z7botsolutions.com.br:/tmp/

# Executar na VPS
ssh usuario@ci.z7botsolutions.com.br
chmod +x /tmp/diagnose-whatsapp-ci.sh
sudo /tmp/diagnose-whatsapp-ci.sh
```

## 📞 Próximos Passos

1. **Aguardar próximo deploy** - O workflow agora constrói e faz deploy do WhatsApp service automaticamente
2. **Verificar logs do deploy** - O workflow mostra se o container iniciou corretamente
3. **Executar diagnóstico manual** - Se necessário, use o script de diagnóstico

## 🔗 Links Úteis

- Logs do container: `docker logs -f secured-guard-whatsapp-ci`
- Status dos containers: `docker-compose -f docker-compose.ci.yml ps`
- Logs do backend: `docker logs secured-guard-backend-ci | grep -i whatsapp`

