# ⚡ QUICK START - DEPLOY CI

## 🚀 5 COMANDOS PARA DEPLOY CI

### **1. Gerar Secrets** ⏱️ 2min
```powershell
cd C:\dev\secured-guard
.\scripts\setup-ci-secrets.ps1
```
📝 **Output:** Arquivo `CI_SECRETS_*.txt` com todos os secrets

---

### **2. Adicionar Secrets no GitHub** ⏱️ 5min
```
GitHub → Settings → Secrets and variables → Actions → New repository secret

Adicionar 7 secrets do arquivo CI_SECRETS_*.txt:
✅ VPS_CI_HOST
✅ VPS_CI_USER  
✅ VPS_CI_SSH_KEY
✅ DB_CI_URL
✅ DB_CI_USERNAME
✅ DB_CI_PASSWORD
✅ JWT_SECRET_CI
```

---

### **3. Preparar VPS** ⏱️ 10min
```bash
# SSH na VPS
ssh usuario@IP_VPS

# Copiar e colar comandos do arquivo CI_SECRETS_*.txt
# (seção "COMANDOS PARA EXECUTAR NA VPS")
```

---

### **4. Criar Branch CI e Push** ⏱️ 2min
```bash
cd C:\dev\secured-guard

git checkout main
git pull origin main
git checkout -b ci

git add -A
git commit -m "🚀 feat: Deploy CI automatizado"
git push -u origin ci
```
🎯 **Deploy inicia automaticamente!**

---

### **5. Validar** ⏱️ 2min
```bash
# Após 30min do deploy
curl https://ci.z7botsolutions.com.br/api/health

# Deve retornar: {"status":"UP"}
```

---

## ✅ CHECKLIST RÁPIDO

```
ANTES DO DEPLOY:
[ ] VPS com Ubuntu/Debian
[ ] Java 17 instalado
[ ] PostgreSQL instalado
[ ] Nginx instalado
[ ] DNS configurado: ci.z7botsolutions.com.br → IP_VPS

DURANTE O DEPLOY:
[ ] GitHub Actions executando (verde)
[ ] Aguardar ~30 minutos

APÓS O DEPLOY:
[ ] Health check: 200 OK
[ ] Frontend carrega: https://ci.z7botsolutions.com.br
[ ] Login funciona
[ ] SSL configurado: certbot --nginx -d ci.z7botsolutions.com.br
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| **Deploy falha no GitHub** | Ver logs no GitHub Actions → clicar no step vermelho |
| **Backend não inicia** | `sudo journalctl -u secured-guard-ci -n 50` |
| **502 Bad Gateway** | `sudo systemctl status secured-guard-ci` |
| **DB connection error** | Verificar senha em `/var/www/secured-guard/ci/.env` |
| **Frontend 404** | `ls /var/www/secured-guard/ci/frontend/` - deve ter `index.html` |

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver status
sudo systemctl status secured-guard-ci

# Ver logs
tail -f /var/www/secured-guard/ci/logs/application.log

# Reiniciar
sudo systemctl restart secured-guard-ci

# Rollback
LATEST=$(ls -t /var/www/secured-guard/ci/backups/ | head -1)
sudo systemctl stop secured-guard-ci
cp /var/www/secured-guard/ci/backups/$LATEST/app.jar /var/www/secured-guard/ci/backend/
sudo systemctl start secured-guard-ci
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Setup Completo:** `DEPLOY_CI_SETUP.md`
- **Todos os Ambientes:** `DEPLOY_PIPELINE_COMPLETO.md`
- **Resumo Executivo:** `DEPLOY_CI_RESUMO_EXECUTIVO.md`

---

**⏱️ TEMPO TOTAL: ~20 minutos de trabalho ativo**  
**🎯 URL FINAL: https://ci.z7botsolutions.com.br**

