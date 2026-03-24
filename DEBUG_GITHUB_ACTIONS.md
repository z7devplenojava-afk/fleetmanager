# 🐛 Debug - GitHub Actions Deploy Falhou

## ❌ Erro Reportado
```
Error: ❌ Deploy falhou!
Error: 📅 Data: Thu Oct 23 03:***:18 UTC 2025
Error: 📦 Commit: 2f970c4f8df98f89662ff43c59311d6fbfd48cae
```

## 🔍 Possíveis Causas

### 1. **Secrets Não Configurados**
O erro mais comum é falta de secrets configurados.

**Verificar:**
- Vá para: https://github.com/zemarioramos/secured-guard/settings/secrets/actions
- Verifique se todos os 11-12 secrets estão configurados

**Secrets necessários:**
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `VITE_API_URL`
- `VITE_WS_URL`

### 2. **SSH Connection Failed**
Erro ao conectar na VPS via SSH.

**Verificar:**
- IP da VPS está correto?
- Chave SSH está correta?
- VPS está acessível?
- Porta SSH (22) está aberta?

**Testar localmente:**
```bash
ssh usuario@ip-da-vps
```

### 3. **Build Failed**
Erro durante compilação do backend ou frontend.

**Possíveis causas:**
- Erros de compilação no código Java
- Dependências npm faltando
- Memória insuficiente no GitHub Actions

### 4. **VPS Não Preparada**
VPS sem Docker ou configurações necessárias.

**Verificar na VPS:**
```bash
ssh usuario@vps-ip
docker --version
docker compose version
docker network ls | grep secured-guard
```

---

## 🔧 SOLUÇÕES RÁPIDAS

### Solução 1: Desabilitar SSH temporariamente e testar build

Vou criar uma versão simplificada do workflow que testa apenas o build:

```yaml
name: Test Build Only

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'corretto'
          java-version: '17'
          
      - name: Build Backend
        run: |
          cd backend
          chmod +x mvnw
          ./mvnw clean package -DskipTests
          
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
```

### Solução 2: Verificar logs completos

**Ver logs detalhados:**
1. Vá para: https://github.com/zemarioramos/secured-guard/actions
2. Clique no workflow que falhou
3. Clique em cada etapa para ver logs detalhados
4. Procure por linhas com `Error:` ou `Failed:`

**Etapas críticas para verificar:**
- ✅ Checkout código
- ✅ Setup Java
- ✅ Build Backend ← **PROVAVELMENTE FALHOU AQUI**
- ✅ Setup Node
- ✅ Build Frontend
- ❌ Deploy na VPS ← **OU AQUI**

---

## 📝 PRÓXIMAS AÇÕES

Para eu ajudar melhor, preciso saber **onde exatamente falhou**. 

Por favor, me envie:

1. **Logs da etapa que falhou** (copie e cole aqui)
2. **Se falhou no Build Backend:**
   - Logs do Maven
   - Erros de compilação

3. **Se falhou no Deploy SSH:**
   - Mensagem de erro SSH
   - Se os secrets estão configurados

4. **Se falhou no Build Frontend:**
   - Logs do npm
   - Erros do Vite

---

## 🛠️ FIX TEMPORÁRIO

Enquanto isso, vou criar uma versão do workflow **sem deploy na VPS**, apenas para testar o build:

