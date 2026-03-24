# 🔍 Verificação de Status do Backend

## Status Atual

Os containers estão rodando, mas o backend está com status **"health: starting"**, o que significa que ainda está iniciando.

## Comandos para Verificar

### 1. Ver logs do backend em tempo real:
```bash
docker-compose -f docker-compose.ci.yml logs -f backend-ci
```

### 2. Ver últimas 100 linhas dos logs:
```bash
docker-compose -f docker-compose.ci.yml logs --tail=100 backend-ci
```

### 3. Verificar se o backend está respondendo:
```bash
curl http://localhost:8081/api/health
```

### 4. Verificar erros específicos:
```bash
docker-compose -f docker-compose.ci.yml logs backend-ci | grep -i error
```

### 5. Verificar uso de recursos:
```bash
docker stats secured-guard-backend-ci --no-stream
```

### 6. Verificar conectividade com o banco:
```bash
docker-compose -f docker-compose.ci.yml exec backend-ci ping -c 1 secured-guard-db-ci
```

## Possíveis Problemas e Soluções

### Backend demorando para iniciar
- **Normal**: O Spring Boot pode levar 1-2 minutos para iniciar completamente
- **Solução**: Aguarde alguns minutos e verifique novamente

### Erro de conexão com o banco
- **Sintoma**: Logs mostram "Connection refused" ou "Connection timeout"
- **Solução**: 
  ```bash
  docker-compose -f docker-compose.ci.yml restart postgres-ci
  docker-compose -f docker-compose.ci.yml restart backend-ci
  ```

### Erro de memória
- **Sintoma**: Container sendo morto ou logs mostram "OutOfMemoryError"
- **Solução**: Aumentar memória disponível ou ajustar `-Xmx` no docker-compose.ci.yml

### Erro de JWT_SECRET
- **Sintoma**: Logs mostram "JWT secret" ou "IllegalStateException"
- **Solução**: Verificar se a variável de ambiente `JWT_SECRET` está configurada

### Porta já em uso
- **Sintoma**: Erro "port is already allocated"
- **Solução**: 
  ```bash
  docker-compose -f docker-compose.ci.yml down
  docker-compose -f docker-compose.ci.yml up -d
  ```

## Script de Verificação Completa

Execute o script `check-backend-status.sh` para uma verificação completa:

```bash
chmod +x check-backend-status.sh
./check-backend-status.sh
```

## Aguardar Inicialização Completa

O backend geralmente leva 1-3 minutos para iniciar completamente. Você pode monitorar o progresso com:

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.ci.yml logs -f backend-ci

# Ou verificar o health check
watch -n 2 'curl -s http://localhost:8081/api/health || echo "Ainda iniciando..."'
```

Quando o backend estiver pronto, você verá nos logs:
- `Started SecuredGuardApplication`
- Health check retornando `200 OK`

