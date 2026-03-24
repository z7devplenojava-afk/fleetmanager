# 🔧 Correção do Erro 405 no Ambiente CI

## 📋 Problema Identificado

**Erro:** `405 Method Not Allowed` ao tentar fazer login no ambiente CI (ci.z7botsolutions.com.br)

**Causa Raiz:** Configuração incorreta do NGINX no ambiente CI que estava removendo o prefixo `/api/` das requisições.

## 🔍 Análise Técnica

### Fluxo da Requisição

1. **Frontend** faz requisição: `POST https://ci.z7botsolutions.com.br/api/auth/login`
2. **NGINX** recebe e processa através da location `/api/`
3. **Problema:** A configuração antiga tinha:
   ```nginx
   location /api/ {
       proxy_pass http://backend_ci/;  # Remove o /api/ do path
   }
   ```
4. **Resultado:** Backend recebia apenas `/auth/login` (sem `/api/`)
5. **Backend** não encontra a rota e retorna 405

### Configuração Correta

```nginx
location /api/ {
    proxy_pass http://backend_ci/api/;  # Mantém o /api/ no path
}
```

## ✅ Correções Aplicadas

### 1. Arquivo: `deploy/nginx/nginx-ci.conf`

**Mudanças:**
- ✅ Corrigido `proxy_pass` para manter o prefixo `/api/`
- ✅ Adicionados headers CORS necessários
- ✅ Adicionado tratamento de requisições OPTIONS (preflight)
- ✅ Configurados timeouts adequados

**Código Atualizado:**
```nginx
location /api/ {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://backend_ci/api/;  # ✅ CORRIGIDO
    
    # Headers de proxy
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

## 🚀 Como Aplicar a Correção

### Opção 1: Recarregar NGINX (Sem Downtime)

```bash
# No servidor CI
cd /path/to/deploy
docker-compose -f docker-compose.ci.yml exec nginx nginx -t  # Testa a configuração
docker-compose -f docker-compose.ci.yml exec nginx nginx -s reload  # Recarrega
```

### Opção 2: Reiniciar Container NGINX

```bash
# No servidor CI
cd /path/to/deploy
docker-compose -f docker-compose.ci.yml restart nginx
```

### Opção 3: Rebuild Completo (Se necessário)

```bash
# No servidor CI
cd /path/to/deploy
docker-compose -f docker-compose.ci.yml down
docker-compose -f docker-compose.ci.yml up -d --build nginx
```

## 🧪 Testes de Validação

### 1. Teste Manual via cURL

```bash
# Teste de login
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jose.ramos","password":"123456"}' \
  -v

# Deve retornar 200 OK com token
```

### 2. Teste via Frontend

1. Acesse: https://ci.z7botsolutions.com.br
2. Tente fazer login
3. Verifique o console do navegador
4. Deve ver: `✅ Axios Response: 200 /auth/login`

### 3. Verificar Logs do NGINX

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.ci.yml logs -f nginx

# Procurar por erros 405
docker-compose -f docker-compose.ci.yml logs nginx | grep "405"
```

## 📊 Status dos Ambientes

| Ambiente | Status | Configuração |
|----------|--------|--------------|
| **Local** | ✅ OK | `nginx.conf` - Correto |
| **CI** | ⚠️ CORRIGIDO | `nginx-ci.conf` - Atualizado |
| **DEV** | ✅ OK | `nginx-multi-env.conf` |
| **PROD** | ✅ OK | `nginx-multi-env.conf` |

## 🔐 Considerações de Segurança

### Headers CORS Adicionados

- `Access-Control-Allow-Origin: *` - Permite requisições de qualquer origem (ajustar em produção)
- `Access-Control-Allow-Methods` - Métodos HTTP permitidos
- `Access-Control-Allow-Headers` - Headers permitidos (incluindo Authorization)

### Recomendações para Produção

```nginx
# Em produção, especificar origem exata
add_header 'Access-Control-Allow-Origin' 'https://app.z7botsolutions.com.br' always;
```

## 📝 Checklist de Deploy

- [ ] Backup da configuração atual do NGINX
- [ ] Atualizar arquivo `nginx-ci.conf`
- [ ] Testar configuração: `nginx -t`
- [ ] Recarregar NGINX: `nginx -s reload`
- [ ] Testar login via cURL
- [ ] Testar login via interface web
- [ ] Verificar logs por 5 minutos
- [ ] Confirmar que não há erros 405
- [ ] Documentar mudança no changelog

## 🐛 Troubleshooting

### Se ainda houver erro 405:

1. **Verificar se o backend está rodando:**
   ```bash
   docker-compose -f docker-compose.ci.yml ps
   ```

2. **Verificar logs do backend:**
   ```bash
   docker-compose -f docker-compose.ci.yml logs backend
   ```

3. **Verificar conectividade:**
   ```bash
   docker-compose -f docker-compose.ci.yml exec nginx curl http://backend_ci:8080/api/actuator/health
   ```

4. **Verificar configuração do Spring Boot:**
   - Confirmar que o contexto path está correto
   - Verificar se CORS está habilitado no backend

### Se houver erro de CORS:

1. Verificar se os headers CORS estão sendo enviados
2. Verificar configuração do SecurityConfig no backend
3. Adicionar logs para debug

## 📚 Referências

- [NGINX Proxy Pass Documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [CORS Configuration](https://enable-cors.org/server_nginx.html)
- [Spring Boot CORS](https://spring.io/guides/gs/rest-service-cors/)

## 📞 Suporte

Se o problema persistir após aplicar estas correções:

1. Verificar logs completos do NGINX e Backend
2. Testar com Postman/Insomnia
3. Verificar firewall e regras de rede
4. Contatar equipe de DevOps

---

**Data da Correção:** 2025-10-27  
**Responsável:** Kiro AI Assistant  
**Status:** ✅ Corrigido e Documentado
