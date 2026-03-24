# 🔄 Como Reiniciar o Backend

## Método 1: Via IDE (IntelliJ IDEA / Eclipse / VS Code)

### IntelliJ IDEA:
1. Localize a aba **Run** na parte inferior
2. Clique no botão **Stop** (quadrado vermelho)
3. Aguarde a aplicação parar
4. Clique em **Run** novamente (triângulo verde)
5. Aguarde a mensagem: `Started SecuredGuardApplication`

### Eclipse:
1. Aba **Console** na parte inferior
2. Clique no botão **Terminate** (quadrado vermelho)
3. Clique com botão direito em `SecuredGuardApplication.java`
4. **Run As** → **Spring Boot App**

### VS Code:
1. Terminal onde o backend está rodando
2. Pressione `Ctrl + C` para parar
3. Execute novamente:
```bash
cd backend
mvn spring-boot:run
```

---

## Método 2: Via PowerShell

### Encontrar o processo Java:
```powershell
netstat -ano | findstr ":8081"
# Anote o PID (última coluna)
```

### Matar o processo:
```powershell
taskkill /F /PID <NUMERO_DO_PID>
```

### Iniciar novamente:
```powershell
cd c:\dev\secured-guard\backend
mvn spring-boot:run
```

---

## Método 3: Via Terminal Maven Direto

```powershell
# Parar (se estiver rodando em terminal)
Ctrl + C

# Recompilar e reiniciar
cd c:\dev\secured-guard\backend
mvn clean install -DskipTests
mvn spring-boot:run
```

---

## ✅ Como Saber que Funcionou

No console do Spring Boot, você deve ver:

```
🔍 GET /api/visits chamado - page: 0, size: 20
📊 Total de visitas no banco: X
📄 Retornando Y visitas (página 0)
✅ Resposta criada com sucesso
```

No frontend (console do navegador), o erro 500 deve desaparecer!

---

## 🎯 Após Reiniciar

1. Recarregue a página do frontend (F5)
2. Vá para: **Dashboard** → Aba **"Gestão Operacional"**
3. Os botões **"Nova Visita"** e **"Ver Todas"** devem funcionar
4. Não deve mais aparecer erro 500

---

**Última atualização:** 05/11/2025

