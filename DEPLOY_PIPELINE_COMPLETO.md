# 🚀 PIPELINE DE DEPLOY COMPLETO - SECURED GUARD

## 📊 Visão Geral dos Ambientes

| Ambiente | Branch | URL | Porta | Banco | Status |
|----------|--------|-----|-------|-------|--------|
| **CI** | `ci` | https://ci.z7botsolutions.com.br | 8082 | `secured_guard_ci` | ⏳ Pronto para Deploy |
| **DEV** | `dev` | https://dev.z7botsolutions.com.br | 8083 | `secured_guard_dev` | ⏸️ Aguardando CI |
| **TEST** | `test` | https://test.z7botsolutions.com.br | 8084 | `secured_guard_test` | ⏸️ Aguardando DEV |
| **PROD** | `main` | https://securedguard.z7botsolutions.com.br | 8080 | `secured_guard_prod` | ⏸️ Aguardando TEST |

---

## 🎯 ESTRATÉGIA DE DEPLOY

### **Sequência Obrigatória:**
```
CI (ci branch) → DEV (dev branch) → TEST (test branch) → PROD (main branch)
```

### **Processo de Validação:**
1. ✅ **CI**: Validar compilação + testes básicos
2. ✅ **DEV**: Validar integrações + features novas
3. ✅ **TEST**: Validar QA + testes de carga
4. ✅ **PROD**: Deploy final em produção

---

## 📁 ESTRUTURA DE DIRETÓRIOS NA VPS

```
/var/www/secured-guard/
├── ci/
│   ├── backend/
│   │   └── app.jar
│   ├── frontend/
│   │   └── (build do Vite)
│   ├── logs/
│   │   ├── application.log
│   │   ├── stdout.log
│   │   └── stderr.log
│   ├── uploads/
│   ├── backups/
│   ├── .env
│   └── VERSION
├── dev/
│   └── (mesma estrutura)
├── test/
│   └── (mesma estrutura)
└── prod/
    └── (mesma estrutura)
```

---

## 🔄 FASE 1: DEPLOY CI ✅

### **Status:** Pronto para execução

### **Arquivos Criados:**
- ✅ `.github/workflows/deploy-ci.yml`
- ✅ `backend/src/main/resources/application-ci.properties`
- ✅ `frontend/env.ci.example`
- ✅ `DEPLOY_CI_SETUP.md`

### **Passos para Executar:**

1. **Configurar Secrets no GitHub:**
   - `VPS_CI_HOST`
   - `VPS_CI_USER`
   - `VPS_CI_SSH_KEY`
   - `DB_CI_URL`
   - `DB_CI_USERNAME`
   - `DB_CI_PASSWORD`
   - `JWT_SECRET_CI`

2. **Criar Branch CI:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b ci
   git push -u origin ci
   ```

3. **Deploy Automático:**
   - O GitHub Actions executará automaticamente ao fazer push na branch `ci`
   - Ou execute manualmente: GitHub → Actions → Deploy CI Environment → Run workflow

4. **Validar:**
   - ✅ https://ci.z7botsolutions.com.br (Frontend)
   - ✅ https://ci.z7botsolutions.com.br/api/health (Backend)

---

## 🔄 FASE 2: DEPLOY DEV

### **Status:** Aguardando sucesso do CI

### **Diferenças em relação ao CI:**
- Branch: `dev`
- Porta: `8083`
- URL: `https://dev.z7botsolutions.com.br`
- Banco: `secured_guard_dev`

### **Quando criar:**
Após validar que o CI está funcionando perfeitamente por pelo menos 24h.

### **Arquivos a criar:**
- `.github/workflows/deploy-dev.yml`
- `backend/src/main/resources/application-dev.properties`
- `frontend/.env.dev`

---

## 🔄 FASE 3: DEPLOY TEST

### **Status:** Aguardando sucesso do DEV

### **Diferenças:**
- Branch: `test`
- Porta: `8084`
- URL: `https://test.z7botsolutions.com.br`
- Banco: `secured_guard_test`

### **Quando criar:**
Após validar que o DEV está funcionando e todas as features foram testadas.

### **Casos de Uso:**
- Testes de QA
- Testes de carga
- Validação de stakeholders
- Homologação final

---

## 🔄 FASE 4: DEPLOY PROD

### **Status:** Aguardando sucesso do TEST

### **Diferenças:**
- Branch: `main`
- Porta: `8080`
- URL: `https://securedguard.z7botsolutions.com.br`
- Banco: `secured_guard_prod`

### **Quando criar:**
Após validar que o TEST está estável e todos os testes passaram.

### **Segurança Adicional:**
- ✅ Require approval antes do deploy
- ✅ Backup automático antes de cada deploy
- ✅ Rollback automático em caso de falha
- ✅ Health check robusto
- ✅ Monitoramento 24/7

---

## 🔐 SECRETS POR AMBIENTE

### **CI (ci branch):**
```
VPS_CI_HOST
VPS_CI_USER
VPS_CI_SSH_KEY
DB_CI_URL
DB_CI_USERNAME
DB_CI_PASSWORD
JWT_SECRET_CI
```

### **DEV (dev branch):**
```
VPS_DEV_HOST (pode ser o mesmo IP)
VPS_DEV_USER
VPS_DEV_SSH_KEY (pode ser a mesma)
DB_DEV_URL
DB_DEV_USERNAME
DB_DEV_PASSWORD
JWT_SECRET_DEV
```

### **TEST (test branch):**
```
VPS_TEST_HOST
VPS_TEST_USER
VPS_TEST_SSH_KEY
DB_TEST_URL
DB_TEST_USERNAME
DB_TEST_PASSWORD
JWT_SECRET_TEST
```

### **PROD (main branch):**
```
VPS_PROD_HOST (idealmente VPS separada)
VPS_PROD_USER
VPS_PROD_SSH_KEY
DB_PROD_URL
DB_PROD_USERNAME
DB_PROD_PASSWORD
JWT_SECRET_PROD
```

---

## 📝 CHECKLIST DE VALIDAÇÃO POR AMBIENTE

### **CI (Integração Contínua)**
- [ ] Código compila sem erros
- [ ] Testes unitários passam
- [ ] Backend inicia corretamente
- [ ] Frontend carrega
- [ ] Login funciona
- [ ] API responde

### **DEV (Desenvolvimento)**
- [ ] Todas as funcionalidades do CI
- [ ] Integrações funcionam
- [ ] Webhooks configurados
- [ ] Email/SMS testados
- [ ] Uploads funcionam
- [ ] WebSocket funciona

### **TEST (Homologação)**
- [ ] Todas as funcionalidades do DEV
- [ ] Testes de carga (100+ usuários simultâneos)
- [ ] Validação de segurança
- [ ] Backup/Restore testado
- [ ] Monitoramento configurado
- [ ] Logs centralizados

### **PROD (Produção)**
- [ ] Todas as funcionalidades do TEST
- [ ] SSL configurado e válido
- [ ] CDN configurada (se aplicável)
- [ ] Backup automático diário
- [ ] Monitoramento 24/7 ativo
- [ ] Plano de disaster recovery testado
- [ ] Documentação atualizada

---

## 🚨 PROCEDIMENTO DE ROLLBACK

### **Automático (em caso de falha no deploy):**
O GitHub Actions automaticamente:
1. Detecta falha no health check
2. Para o serviço
3. Restaura o último backup
4. Reinicia o serviço
5. Valida health check novamente

### **Manual (se necessário):**
```bash
# SSH na VPS
ssh usuario@vps-ip

# Parar serviço
sudo systemctl stop secured-guard-{ENV}

# Listar backups
ls -lht /var/www/secured-guard/{ENV}/backups/

# Restaurar backup específico
BACKUP_DATE="20251023_093000"
cp /var/www/secured-guard/{ENV}/backups/$BACKUP_DATE/app.jar \
   /var/www/secured-guard/{ENV}/backend/

# Reiniciar
sudo systemctl start secured-guard-{ENV}

# Verificar
sudo systemctl status secured-guard-{ENV}
```

---

## 📊 MONITORAMENTO E ALERTAS

### **Métricas a Monitorar:**
- ✅ CPU usage (< 70%)
- ✅ Memory usage (< 80%)
- ✅ Disk space (> 20% free)
- ✅ Response time (< 500ms)
- ✅ Error rate (< 1%)
- ✅ Uptime (> 99.9%)

### **Ferramentas Sugeridas:**
- **Prometheus + Grafana** (métricas)
- **ELK Stack** (logs centralizados)
- **UptimeRobot** (monitoramento externo)
- **Sentry** (error tracking)

---

## 🔧 COMANDOS ÚTEIS

### **Ver Status de Todos os Ambientes:**
```bash
for ENV in ci dev test prod; do
  echo "=== $ENV ==="
  sudo systemctl status secured-guard-$ENV | head -5
  echo ""
done
```

### **Ver Logs de Todos os Ambientes:**
```bash
for ENV in ci dev test prod; do
  echo "=== $ENV - Últimas 10 linhas ==="
  tail -10 /var/www/secured-guard/$ENV/logs/application.log
  echo ""
done
```

### **Verificar Espaço em Disco:**
```bash
df -h /var/www/secured-guard/
```

### **Limpar Backups Antigos:**
```bash
for ENV in ci dev test prod; do
  cd /var/www/secured-guard/$ENV/backups
  # Manter apenas últimos 10 backups
  ls -t | tail -n +11 | xargs -r rm -rf
done
```

---

## 📅 CRONOGRAMA SUGERIDO

| Data | Ação | Ambiente | Responsável |
|------|------|----------|-------------|
| Dia 1 | Setup inicial | CI | DevOps |
| Dia 1 | Primeiro deploy | CI | DevOps |
| Dia 2-3 | Testes e ajustes | CI | QA + Dev |
| Dia 4 | Setup e deploy | DEV | DevOps |
| Dia 5-7 | Desenvolvimento | DEV | Dev Team |
| Dia 8 | Setup e deploy | TEST | DevOps |
| Dia 9-10 | QA completo | TEST | QA Team |
| Dia 11 | Ajustes finais | TEST | Dev Team |
| Dia 12 | Setup e deploy | PROD | DevOps |
| Dia 12+ | Monitoramento | PROD | Todos |

---

## ✅ PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA:** Configurar secrets do GitHub para CI
2. **AGORA:** Criar branch `ci`
3. **AGORA:** Fazer primeiro deploy no CI
4. **24h depois:** Validar estabilidade do CI
5. **Depois:** Criar workflow para DEV

---

## 📞 SUPORTE E DOCUMENTAÇÃO

- **Documentação CI:** `DEPLOY_CI_SETUP.md`
- **Troubleshooting:** Ver seção específica em cada guia de setup
- **Logs:** `/var/www/secured-guard/{ENV}/logs/`
- **Backups:** `/var/www/secured-guard/{ENV}/backups/`

---

**Última Atualização:** 23/10/2025  
**Versão:** 1.0  
**Status Geral:** 🟡 Em Implementação (Fase CI)

