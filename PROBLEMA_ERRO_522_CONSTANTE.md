# Problema: Erro 522 Constante no Ambiente CI

## Situação

O erro 522 está ocorrendo constantemente no ambiente CI, indicando que o servidor de origem não está respondendo. Isso causa:
- Falha no carregamento de módulos JavaScript (ex: `Grupos-DxHM70fJ.js`)
- Falha no carregamento de grupos de usuários
- Timeout constante entre Cloudflare e servidor de origem

## Causa Raiz

O erro 522 **NÃO é normal** e indica problemas de infraestrutura:

1. **Servidor Backend não está respondendo:**
   - Servidor pode estar sobrecarregado
   - Servidor pode estar travado ou com processos bloqueados
   - Recursos do servidor (CPU, memória, disco) podem estar esgotados

2. **Problemas de Rede:**
   - Timeout entre Cloudflare e servidor de origem
   - Firewall bloqueando conexões
   - Problemas de conectividade

3. **Configuração do Cloudflare:**
   - Timeout muito curto configurado
   - Problemas de proxy reverso

## Soluções Implementadas (Frontend)

### 1. Retry Automático para Erros 522

✅ **Implementado em `frontend/src/lib/axios.ts`:**
- Retry automático com backoff exponencial (até 3 tentativas)
- Delay progressivo: 1s, 2s, 4s entre tentativas
- Apenas para erros 522 (timeout do servidor)

**Como funciona:**
1. Primeira tentativa falha com 522
2. Aguarda 1 segundo
3. Segunda tentativa
4. Se falhar, aguarda 2 segundos
5. Terceira tentativa
6. Se falhar, aguarda 4 segundos
7. Quarta tentativa (última)
8. Se todas falharem, retorna erro

### 2. Lazy Loading com Retry para Componentes

✅ **Implementado em `frontend/src/App.tsx`:**
- Componente `Grupos` agora usa `lazyWithRetry`
- Retry automático para módulos JavaScript que falham ao carregar
- Tratamento específico para erros 522, timeout e network errors

### 3. Tratamento de Erros 522 no Carregamento de Grupos

✅ **Implementado em `frontend/src/contexts/AuthContext.tsx`:**
- Sistema continua funcionando mesmo se grupos não carregarem
- Não bloqueia o login se houver erro 522
- Logs informativos para debug

## Ações Necessárias na Infraestrutura

### 1. Verificar Status do Servidor Backend

```bash
# Na VPS, verificar se o backend está rodando
docker ps | grep backend
docker logs secured-guard-backend-ci --tail 100

# Verificar recursos do servidor
htop
# ou
free -h
df -h
```

### 2. Verificar Logs do Backend

```bash
# Verificar logs recentes
docker logs secured-guard-backend-ci --tail 200

# Verificar se há erros
docker logs secured-guard-backend-ci 2>&1 | grep -i error | tail -50

# Verificar se há processos travados
docker exec secured-guard-backend-ci ps aux
```

### 3. Verificar Configuração do Cloudflare

1. Acesse o painel do Cloudflare
2. Vá em **Speed** > **Optimization** > **HTTP/2**
3. Verifique configurações de timeout
4. Vá em **Network** > **Origin Rules**
5. Verifique se há regras bloqueando conexões

### 4. Verificar Conectividade

```bash
# Na VPS, testar se o backend responde localmente
curl -v http://localhost:8081/api/health

# Testar se o backend responde externamente
curl -v https://ci.z7botsolutions.com.br/api/health

# Verificar se há firewall bloqueando
sudo iptables -L -n | grep 8081
```

### 5. Reiniciar Serviços se Necessário

```bash
# Na VPS
cd /var/www/secured_guard/ci

# Parar e reiniciar backend
docker-compose -f docker-compose.ci.yml restart backend

# Ou recriar completamente
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend

# Verificar status
docker-compose -f docker-compose.ci.yml ps
docker logs secured-guard-backend-ci --tail 50
```

## Monitoramento Recomendado

### 1. Configurar Alertas

- Alertas quando erro 522 ocorrer mais de X vezes por minuto
- Alertas quando CPU/memória do servidor estiver acima de 80%
- Alertas quando backend não responder por mais de 30 segundos

### 2. Health Checks

- Configurar health check endpoint no backend
- Cloudflare pode usar isso para verificar se servidor está disponível
- Configurar auto-restart se health check falhar

### 3. Logs e Métricas

- Monitorar logs do backend para identificar padrões
- Verificar métricas de CPU, memória e disco
- Identificar picos de uso que podem causar timeout

## Próximos Passos

1. ✅ **Frontend melhorado** - Retry automático implementado
2. ⏳ **Verificar infraestrutura** - Status do servidor backend
3. ⏳ **Verificar logs** - Identificar causa raiz
4. ⏳ **Configurar monitoramento** - Alertas e health checks
5. ⏳ **Otimizar servidor** - Se necessário, aumentar recursos

## Nota Importante

**O erro 522 constante NÃO é normal** e indica problemas sérios de infraestrutura. As melhorias no frontend tornam o sistema mais resiliente, mas **é necessário investigar e corrigir a causa raiz no servidor backend**.

O retry automático ajuda a lidar com falhas temporárias, mas se o servidor estiver constantemente indisponível, o problema precisa ser resolvido na infraestrutura.
