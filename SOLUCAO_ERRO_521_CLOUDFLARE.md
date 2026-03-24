# 🔧 Solução para Erro 521 do Cloudflare

## 🔍 Problema

O erro **521** do Cloudflare significa que o Cloudflare não consegue se conectar ao servidor de origem (Traefik). Isso geralmente acontece quando:

1. O Traefik não está rodando
2. O Traefik não está na rede correta (`z7network`)
3. O Traefik não está escutando nas portas corretas (80/443)
4. O Cloudflare está tentando se conectar a um IP/porta que não está acessível
5. O firewall está bloqueando as portas 80 e 443

## ✅ Solução Passo a Passo

### 1. Verificar se o Traefik está rodando

```bash
# No servidor VPS
ssh usuario@servidor

# Verificar se o Traefik está rodando
docker ps | grep traefik

# Se não estiver rodando, iniciar
cd /var/www/secured_guard
docker-compose -f docker-compose.traefik.yml up -d
```

### 2. Verificar se a rede z7network existe

```bash
# Verificar se a rede existe
docker network ls | grep z7network

# Se não existir, criar
docker network create z7network
```

### 3. Verificar se o Traefik está na rede z7network

```bash
# Verificar se o Traefik está na rede
docker inspect traefik | grep z7network

# Se não estiver, conectar
docker network connect z7network traefik
```

### 4. Verificar se o nginx-ci está na rede z7network

```bash
# Verificar se o nginx-ci está na rede
docker inspect secured-guard-nginx-ci | grep z7network

# Se não estiver, conectar
docker network connect z7network secured-guard-nginx-ci
```

### 5. Verificar se o Traefik está escutando nas portas corretas

```bash
# Verificar portas
netstat -tlnp | grep traefik
# ou
ss -tlnp | grep traefik

# Deve mostrar:
# - Porta 80 (HTTP)
# - Porta 443 (HTTPS)
# - Porta 8080 (Dashboard)
```

### 6. Verificar se o Traefik está respondendo

```bash
# Testar dashboard do Traefik
curl http://localhost:8080/api/overview

# Deve retornar JSON com informações do Traefik
```

### 7. Verificar routers do Traefik

```bash
# Listar routers
curl http://localhost:8080/api/http/routers | grep -i "nginx-ci"

# Deve mostrar o router nginx-ci configurado
```

### 8. Verificar configuração dinâmica do Traefik

```bash
# Verificar se o arquivo existe
ls -la /var/www/secured_guard/traefik/dynamic/ci.yml

# Verificar logs do Traefik para ver se carregou a configuração
docker logs traefik | grep "Configuration loaded"
```

### 9. Verificar firewall

```bash
# Verificar se as portas 80 e 443 estão abertas
sudo ufw status
# ou
sudo iptables -L -n | grep -E "(80|443)"

# Se estiverem fechadas, abrir
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 10. Verificar configuração do Cloudflare

No painel do Cloudflare:
1. Verificar se o DNS está apontando para o IP correto do servidor
2. Verificar se o proxy está ativado (laranja) para o domínio
3. Verificar se o SSL/TLS está configurado como "Full" ou "Full (strict)"

## 🚀 Script Automatizado

Execute o script `fix-traefik-521.sh` no servidor:

```bash
# Transferir script para o servidor
scp fix-traefik-521.sh usuario@servidor:/tmp/

# No servidor
ssh usuario@servidor
chmod +x /tmp/fix-traefik-521.sh
cd /var/www/secured_guard
/tmp/fix-traefik-521.sh
```

## 🔍 Diagnóstico Avançado

### Verificar conectividade entre Traefik e nginx-ci

```bash
# Testar ping do Traefik para nginx-ci
docker exec traefik ping -c 1 secured-guard-nginx-ci

# Testar curl do Traefik para nginx-ci
docker exec traefik curl -s http://secured-guard-nginx-ci:80/health
```

### Verificar logs detalhados

```bash
# Logs do Traefik
docker logs traefik --tail 100

# Logs do nginx-ci
docker logs secured-guard-nginx-ci --tail 100

# Logs do backend
docker logs secured-guard-backend-ci --tail 100
```

### Testar endpoints diretamente

```bash
# Testar backend diretamente (sem Traefik)
curl http://localhost:8081/api/health

# Testar nginx-ci diretamente (sem Traefik)
curl http://localhost:8082/health

# Testar via Traefik (deve funcionar se tudo estiver configurado)
curl http://localhost/api/health
```

## 📝 Checklist de Verificação

- [ ] Traefik está rodando (`docker ps | grep traefik`)
- [ ] Rede z7network existe (`docker network ls | grep z7network`)
- [ ] Traefik está na rede z7network (`docker inspect traefik | grep z7network`)
- [ ] nginx-ci está na rede z7network (`docker inspect secured-guard-nginx-ci | grep z7network`)
- [ ] Traefik está escutando nas portas 80 e 443 (`netstat -tlnp | grep traefik`)
- [ ] Traefik está respondendo (`curl http://localhost:8080/api/overview`)
- [ ] Router nginx-ci está configurado no Traefik (`curl http://localhost:8080/api/http/routers | grep nginx-ci`)
- [ ] Configuração dinâmica existe (`ls /var/www/secured_guard/traefik/dynamic/ci.yml`)
- [ ] Firewall permite portas 80 e 443 (`sudo ufw status`)
- [ ] Cloudflare está configurado corretamente (DNS, Proxy, SSL)

## 🆘 Se Nada Funcionar

1. **Reiniciar tudo:**
   ```bash
   cd /var/www/secured_guard
   docker-compose -f docker-compose.traefik.yml down
   docker-compose -f docker-compose.ci.yml down
   docker-compose -f docker-compose.traefik.yml up -d
   sleep 10
   docker-compose -f docker-compose.ci.yml up -d
   ```

2. **Verificar IP do servidor no Cloudflare:**
   - O DNS do Cloudflare deve apontar para o IP correto do servidor
   - Verificar se o IP não mudou

3. **Desabilitar temporariamente o Cloudflare:**
   - No painel do Cloudflare, desabilitar o proxy (modo DNS apenas)
   - Testar se o servidor responde diretamente via IP
   - Se funcionar, o problema é na configuração do Cloudflare

4. **Verificar logs do sistema:**
   ```bash
   # Logs do sistema
   sudo journalctl -u docker -n 100
   
   # Logs do Traefik
   docker logs traefik --tail 200
   ```

## 📚 Referências

- [Erro 521 do Cloudflare](https://support.cloudflare.com/hc/en-us/articles/115003011431-Troubleshooting-Cloudflare-5XX-errors#521error)
- [Documentação do Traefik](https://doc.traefik.io/traefik/)
- [Docker Networking](https://docs.docker.com/network/)



















