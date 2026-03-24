# 🔧 Solução: QR Code não funciona no CI mas funciona localmente

## 📋 Problema Identificado

O QR Code funciona no seu computador local, mas não funciona no CI (VPS). O erro 401 indica que o Baileys não consegue autenticar com o WhatsApp.

## 🔍 Diferenças entre Local e CI

### Local (Funcionando)
- `INSTANCE_KEY: securedguard`
- `baileys.rest.instance.key=securedguard`
- Container: `whatsapp-service` (build local)
- Volume: `whatsapp_sessions`

### CI (Não Funcionando)
- `INSTANCE_KEY: securedguard_ci`
- `baileys.rest.instance.key=securedguard_ci`
- Container: `whatsapp-service-ci` (imagem Docker: `z7design/secured-guard-whatsapp:ci`)
- Volume: `whatsapp_sessions_ci`
- **Erro 401**: Connection Failure ao tentar autenticar com WhatsApp

## 🎯 Soluções

### Solução 1: Limpar Sessão e Forçar Novo QR Code (RECOMENDADO)

Na VPS, execute:

```bash
# 1. Parar o serviço WhatsApp
docker-compose -f docker-compose.ci.yml stop whatsapp-service-ci

# 2. Remover o volume de sessões (isso força novo login)
docker volume rm secured-guard-ci-network_whatsapp_sessions_ci
# ou se o nome for diferente:
docker volume ls | grep whatsapp
# Depois remover o volume encontrado

# 3. Recriar o container
docker-compose -f docker-compose.ci.yml up -d whatsapp-service-ci

# 4. Verificar logs
docker logs secured-guard-whatsapp-ci -f
```

### Solução 2: Usar Mesma Instance Key do Local

Alterar o CI para usar `securedguard` ao invés de `securedguard_ci`:

**No `docker-compose.ci.yml`:**
```yaml
whatsapp-service-ci:
  environment:
    INSTANCE_KEY: securedguard  # Mudar de securedguard_ci para securedguard
```

**No `application-ci.properties`:**
```properties
baileys.rest.instance.key=${BAILEYS_INSTANCE_KEY:securedguard}  # Mudar de securedguard_ci
```

**No `docker-compose.ci.yml` (backend):**
```yaml
BAILEYS_INSTANCE_KEY: ${BAILEYS_INSTANCE_KEY:-securedguard}  # Mudar de securedguard_ci
```

### Solução 3: Verificar Conectividade do Container

O container pode não ter acesso à internet corretamente:

```bash
# Entrar no container
docker exec -it secured-guard-whatsapp-ci sh

# Testar conectividade
ping -c 3 8.8.8.8
ping -c 3 whatsapp.com

# Verificar DNS
nslookup whatsapp.com
```

### Solução 4: Reconstruir Imagem do WhatsApp

Se a imagem `z7design/secured-guard-whatsapp:ci` estiver desatualizada:

```bash
# Na VPS, fazer build da imagem localmente
cd /var/www/secured_guard/ci
docker build -t z7design/secured-guard-whatsapp:ci ../whatsapp-service

# Recriar container
docker-compose -f docker-compose.ci.yml up -d --force-recreate whatsapp-service-ci
```

### Solução 5: Verificar Logs Detalhados

```bash
# Ver logs do WhatsApp
docker logs secured-guard-whatsapp-ci --tail 100 -f

# Ver logs do backend ao tentar gerar QR
docker logs secured-guard-backend-ci --tail 100 -f | grep -i qr
```

## 🔄 Passos Recomendados (Ordem)

1. **Limpar sessão** (Solução 1) - Mais rápido
2. **Verificar conectividade** (Solução 3) - Se limpar não funcionar
3. **Alinhar instance key** (Solução 2) - Se quiser usar mesma sessão do local
4. **Reconstruir imagem** (Solução 4) - Se nada funcionar

## 📝 Nota Importante

O erro 401 geralmente significa:
- Sessão antiga/corrompida no volume
- Mudança no protocolo do WhatsApp que a versão do Baileys não suporta
- Problema de rede/conectividade do container

A **Solução 1** (limpar sessão) resolve 90% dos casos.
