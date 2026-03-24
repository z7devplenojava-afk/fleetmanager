# 🚀 Comandos para Executar no Servidor

## ⚡ Solução Rápida (Copiar e Colar)

Execute estes comandos **no servidor** na ordem:

```bash
# 1. Sair do modo Swarm
docker swarm leave --force

# 2. Criar redes Docker
docker network create z7network 2>/dev/null || echo "Rede já existe"
docker network create secured-guard-ci-network 2>/dev/null || echo "Rede já existe"

# 3. Criar diretórios de volumes (usados pelo docker-compose)
mkdir -p /var/www/secured_guard/ci/postgres_data
mkdir -p /var/www/secured_guard/ci/redis_data
mkdir -p /var/www/secured_guard/ci/uploads
mkdir -p /var/www/secured_guard/ci/logs
mkdir -p /var/www/secured_guard/ci/whatsapp_sessions

# 4. Ir para o diretório do projeto
cd /root/secured_guard/ci

# 5. Verificar se o arquivo existe
ls -la docker-compose.ci.yml

# 6. Iniciar os containers
docker-compose -f docker-compose.ci.yml up -d

# 7. Verificar status
docker-compose -f docker-compose.ci.yml ps

# 8. Ver logs (se necessário)
docker-compose -f docker-compose.ci.yml logs -f
```

## 📋 Explicação

1. **Sair do modo Swarm**: O Docker está em modo Swarm, que causa conflitos com `docker-compose`
2. **Criar redes**: O `docker-compose.ci.yml` precisa das redes `z7network` (external) e `secured-guard-ci-network` (bridge)
3. **Criar diretórios**: Os volumes do Docker Compose estão configurados para `/var/www/secured_guard/ci/`
4. **Diretório do projeto**: O código está em `/root/secured_guard/ci`, mas os volumes ficam em `/var/www/secured_guard/ci/`

## ✅ Verificação

Após executar os comandos, verifique:

```bash
# Ver containers rodando
docker ps

# Ver redes
docker network ls | grep -E "(z7network|secured-guard)"

# Ver logs do backend
docker logs secured-guard-backend-ci -f

# Ver logs do nginx
docker logs secured-guard-nginx-ci -f
```

## 🔧 Troubleshooting

### Se ainda der erro de rede:
```bash
docker network rm z7network secured-guard-ci-network 2>/dev/null
docker network create z7network
docker network create secured-guard-ci-network
```

### Se os containers não iniciarem:
```bash
cd /root/secured_guard/ci
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d --force-recreate
```

### Se o Nginx não estiver funcionando:
```bash
# Verificar se o arquivo nginx/ci.conf existe
ls -la /root/secured_guard/ci/nginx/ci.conf

# Ver logs do Nginx
docker logs secured-guard-nginx-ci
```

