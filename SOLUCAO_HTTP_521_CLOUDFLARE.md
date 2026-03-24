# 🔧 Solução: HTTP 521 - Cloudflare não consegue conectar ao servidor

## 📋 Problema Identificado

**Erro:** HTTP 521 ao acessar `https://ci.z7botsolutions.com.br/api/health`

**Causa:** O Cloudflare não consegue estabelecer uma conexão TCP com o servidor de origem (Traefik).

## 🔍 Diagnóstico

O HTTP 521 é um erro específico do Cloudflare que significa:
- **"Web Server Is Down"** - O servidor de origem não está respondendo
- Cloudflare não consegue estabelecer uma conexão TCP na porta 443 (HTTPS)

### Arquitetura da Aplicação

```
Cloudflare (HTTPS) → Traefik (porta 443) → Nginx CI (porta 80) → Backend (porta 8081)
```

### Verificações Necessárias

1. **Traefik está rodando?**
   ```bash
   docker ps | grep traefik
   ```

2. **Traefik está escutando nas portas 80 e 443?**
   ```bash
   netstat -tlnp | grep -E ":(80|443) "
   # ou
   ss -tlnp | grep -E ":(80|443) "
   ```

3. **Traefik consegue alcançar o nginx-ci?**
   ```bash
   # Verificar se ambos estão na mesma rede
   docker network inspect z7network | grep -E "(traefik|nginx-ci)"
   ```

4. **Firewall está bloqueando?**
   ```bash
   # Verificar regras do firewall
   sudo ufw status
   # ou
   sudo iptables -L -n
   ```

## ✅ Soluções

### Solução 1: Iniciar Traefik (Mais Comum)

Se o Traefik não estiver rodando:

```bash
cd /var/www/secured_guard
docker-compose -f docker-compose.traefik.yml up -d
```

Verificar se iniciou corretamente:
```bash
docker ps | grep traefik
docker logs traefik --tail 50
```

### Solução 2: Verificar Configuração do Cloudflare

No painel do Cloudflare, verificar:

1. **DNS Settings:**
   - `ci.z7botsolutions.com.br` deve apontar para o IP do servidor
   - Tipo: `A` ou `AAAA`
   - Proxy status: `Proxied` (ícone de nuvem laranja)

2. **SSL/TLS Settings:**
   - Modo: `Full` ou `Full (strict)`
   - **NÃO usar:** `Flexible` (isso causa problemas)

3. **Network Settings:**
   - Verificar se não há regras bloqueando o IP do servidor

### Solução 3: Verificar Firewall

Se o firewall estiver bloqueando as portas 80 e 443:

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# iptables (se não usar UFW)
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Solução 4: Verificar Rede Docker

Garantir que Traefik e nginx-ci estão na mesma rede:

```bash
# Verificar se a rede existe
docker network ls | grep z7network

# Se não existir, criar:
docker network create z7network

# Verificar containers na rede
docker network inspect z7network
```

### Solução 5: Verificar Logs do Traefik

```bash
docker logs traefik --tail 100
```

Procurar por erros como:
- `Error connecting to upstream`
- `Connection refused`
- `No route found`

## 🧪 Testes de Conectividade

### Teste 1: Backend diretamente
```bash
curl http://localhost:8081/api/health
```

### Teste 2: Nginx diretamente
```bash
curl http://localhost:8082/api/health
```

### Teste 3: Nginx via Traefik (interno)
```bash
curl -H "Host: ci.z7botsolutions.com.br" http://localhost/api/health
```

### Teste 4: Via HTTPS externo (deve passar pelo Cloudflare)
```bash
curl https://ci.z7botsolutions.com.br/api/health
```

## 📊 Script de Diagnóstico Completo

Execute este script no servidor para diagnóstico completo:

```bash
#!/bin/bash
echo "🔍 Diagnóstico HTTP 521 - Cloudflare"
echo ""

echo "1️⃣ Verificando Traefik:"
if docker ps | grep -q traefik; then
  echo "✅ Traefik está rodando"
  docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "❌ Traefik NÃO está rodando!"
fi

echo ""
echo "2️⃣ Verificando portas:"
echo "Porta 80:"
netstat -tlnp | grep ":80 " || ss -tlnp | grep ":80 " || echo "  Não está escutando"
echo "Porta 443:"
netstat -tlnp | grep ":443 " || ss -tlnp | grep ":443 " || echo "  Não está escutando"

echo ""
echo "3️⃣ Verificando rede Docker:"
docker network inspect z7network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "Rede z7network não existe"

echo ""
echo "4️⃣ Testando conectividade interna:"
echo "Backend:"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:8081/api/health
echo "Nginx:"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:8082/api/health
if docker ps | grep -q traefik; then
  echo "Nginx via Traefik:"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" -H "Host: ci.z7botsolutions.com.br" http://localhost/api/health
fi

echo ""
echo "5️⃣ Verificando firewall:"
sudo ufw status 2>/dev/null || echo "UFW não está instalado ou não tem permissão"
```

## 🚀 Deploy Automático com Verificação

O workflow do GitHub Actions foi atualizado para:
1. Verificar status do Traefik a cada 3 tentativas
2. Coletar diagnósticos completos em caso de falha
3. Fornecer mensagens de erro mais claras

## 📝 Checklist de Resolução

- [ ] Traefik está rodando (`docker ps | grep traefik`)
- [ ] Portas 80 e 443 estão abertas no firewall
- [ ] Traefik e nginx-ci estão na mesma rede Docker (`z7network`)
- [ ] Cloudflare está configurado com SSL/TLS mode: `Full` ou `Full (strict)`
- [ ] DNS do Cloudflare aponta para o IP correto do servidor
- [ ] Backend responde em `localhost:8081/api/health`
- [ ] Nginx responde em `localhost:8082/api/health`
- [ ] Nginx responde via Traefik em `localhost/api/health` (com header Host)

## 🔗 Referências

- [Cloudflare Error 521](https://support.cloudflare.com/hc/en-us/articles/115003011431-Troubleshooting-Cloudflare-5XX-errors#521error)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

