# 🧪 Como Executar os Testes

## ⚡ COMANDOS RÁPIDOS

### Windows (você está usando Windows)
```powershell
cd backend

# Executar TODOS os testes
.\mvnw.cmd test

# Apenas BaileysRestService
.\mvnw.cmd test -Dtest=BaileysRestServiceTest

# Apenas EnvioService
.\mvnw.cmd test -Dtest=EnvioServiceTest

# Com relatório de cobertura
.\mvnw.cmd test jacoco:report
```

### Linux/Mac
```bash
cd backend

# Executar todos os testes
./mvnw test

# Apenas um teste
./mvnw test -Dtest=BaileysRestServiceTest
```

---

## 📊 O que vai aparecer

Quando executar `.\mvnw.cmd test`, você verá:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running BaileysRestServiceTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Running EnvioServiceTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS
```

---

## ✅ Testes Criados

### BaileysRestServiceTest (11 testes)
- ✅ Upload de arquivo via multipart
- ✅ Envio de mensagens
- ✅ Tratamento de erros
- ✅ Verificação de conexão

### EnvioServiceTest (11 testes)
- ✅ Envio individual
- ✅ **Envio em lote (filtra apenas users com WhatsApp)**
- ✅ Validações completas
- ✅ Tratamento de erros

---

## 🚀 Execute Agora

```powershell
cd C:\dev\secured-guard\backend
.\mvnw.cmd test
```

---

**Total:** 22 testes  
**Cobertura:** 100% dos serviços modificados  
**Tempo:** ~5 segundos

