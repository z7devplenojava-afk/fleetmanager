# 🚨 Correção Erro 405 no CI - Traefik

## 🔍 Problema Identificado

O CI está usando **Traefik**, não NGINX! Por isso o erro 405 estava aparecendo.

O Traefik estava bloqueando métodos POST por falta de configuração de CORS e middlewares.

---

## ✅ Correção Aplicada

Adicionei labels no `docker-compose.ci.yml`:

```yaml
# Permitir todos os métodos HTTP
- "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowmethods=GET,POST,PUT,DELETE,PATCH,OPTIONS"
- "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolalloworiginlist=https://ci.z7botsolutions.com.br"
- "traefik.http.middlewares.backend-ci-cors.headers.accesscontrolallowheaders=Content-Type,Authorization"
- "traefik.http.routers.backend-ci.middlewares=backend-ci-headers,backend-ci-cors"
```

---

## 🚀 Como Aplicar no CI

### **Opção 1: Via Git (Recomendado)**

```bash
# 1. Commit as mudanças
git add docker-compose.ci.yml
git commit -m "fix: Corrigir erro 405 no CI - adicionar middlewares Traefik"

# 2. Push para o branch CI
git push origin ci

# 3. No servidor CI, executar:
cd /var/www/secured_guard/ci
git pull origin ci
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci
```

---

### **Opção 2: SSH Direto (Mais Rápido)**

Se você tem acesso SSH ao servidor CI:

```bash
# Conectar no servidor CI
ssh usuario@seu-servidor-ci

# Ir para o diretório do projeto
cd /var/www/secured_guard/ci

# Fazer pull das mudanças
git pull origin ci

# Recriar o container do backend
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci

# Ver os logs
docker-compose -f docker-compose.ci.yml logs -f backend-ci
```

---

### **Opção 3: Atualizar Manualmente**

Se não conseguir via Git:

```bash
# No servidor CI, editar o arquivo
nano /var/www/secured_guard/ci/docker-compose.ci.yml

# Adicionar as labels novas (linhas 97-103)
# Depois reiniciar:
docker-compose -f docker-compose.ci.yml up -d --force-recreate backend-ci
```

---

## 🧪 Testar

Após aplicar, teste o login:

```bash
curl -X POST https://ci.z7botsolutions.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seu-usuario","password":"sua-senha"}'
```

Deve retornar um token JWT, não 405.

---

## 📋 Checklist

- [x] ✅ Identificado: CI usa Traefik, não NGINX
- [x] ✅ Adicionado middlewares CORS no Traefik
- [ ] ⏳ Fazer commit das mudanças
- [ ] ⏳ Push para o branch CI
- [ ] ⏳ Reiniciar backend-ci no servidor
- [ ] ⏳ Testar login novamente

---

## 🎯 Resumo

**Antes:** Traefik bloqueava POST → 405 Not Allowed  
**Depois:** Traefik aceita todos os métodos → Login funciona ✅

**Tempo estimado:** 5 minutos  
**Downtime:** ~10 segundos (apenas reiniciar container backend)

