# 🔍 Investigar Erro 500 - Login de Outros Dispositivos na Rede

## 🎯 **Problema:**

Login funciona em `http://localhost:3000` mas retorna **erro 500** quando acessado de:
- Celular na mesma rede (`http://192.168.1.116:3000`)
- Outro computador na mesma rede

## ✅ **Confirmado Funcionando:**

- ✅ Backend acessível: `http://192.168.1.116:8081/api/health` retorna 200 OK
- ✅ Frontend acessível: `http://192.168.1.116:3000` carrega
- ✅ `.env.local` criado com IP correto
- ✅ Frontend reiniciado

## 🚨 **Erro 500 Indica:**

Problema **no backend** ao processar a requisição de login vinda de IP externo.

## 🔍 **Como Investigar:**

### **1. Verificar Logs do Backend em Tempo Real:**

**Enquanto o backend está rodando**, faça o login do celular e **observe os logs no terminal do PC**.

**Procure por:**
```
ERROR
Exception
Failed
Authentication
NullPointerException
SQLException
```

### **2. Aumentar Nível de Log:**

**Adicione em `backend/src/main/resources/application.properties`:**

```properties
# Debug completo
logging.level.root=INFO
logging.level.com.z7design.secured_guard=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.springframework.web=DEBUG

# Log de requisições
logging.level.org.springframework.web.servlet.mvc.method.annotation=TRACE
```

**Reinicie o backend** e tente login do celular novamente.

### **3. Verificar CORS:**

O erro 500 pode ser porque o CORS está rejeitando a requisição. 

**Verifique em `SecurityConfig.java` (linha 236-238):**
```java
configuration.setAllowedOriginPatterns(Arrays.asList("*"));
```

Isso já está correto (permite todas as origens).

### **4. Verificar Host do Backend:**

**O backend pode estar ouvindo apenas em localhost!**

**Em `application.properties`, adicione:**
```properties
server.address=0.0.0.0
```

Isso faz o backend aceitar conexões de qualquer IP da rede.

## 🔧 **Solução Provável:**

**Adicione ao `application.properties`:**

```properties
# Aceitar conexões de qualquer IP da rede
server.address=0.0.0.0

# Debug
logging.level.com.z7design.secured_guard=DEBUG
```

**Reinicie o backend** e teste novamente do celular.

## 📊 **Diagnóstico Rápido:**

**Execute este comando no PC:**

```powershell
# Verificar em qual IP o backend está ouvindo
netstat -ano | findstr "8081"
```

**Resultado esperado:**
```
TCP    0.0.0.0:8081    ← Aceita de qualquer IP ✅
```

**Se mostrar:**
```
TCP    127.0.0.1:8081  ← Só aceita localhost ❌
```

**Então o problema é o `server.address`!**

## 🚀 **Passos para Resolver:**

1. Adicione `server.address=0.0.0.0` ao `application.properties`
2. Reinicie o backend
3. Teste `netstat -ano | findstr "8081"`
4. Deve mostrar `0.0.0.0:8081`
5. Teste login do celular novamente

## ⏱️ **Alternativa Imediata:**

Enquanto resolve isso, **teste no CI**:
```
https://ci.z7botsolutions.com.br
```

Lá funciona 100% e você valida as melhorias de responsividade!

---

**Adicione `server.address=0.0.0.0` ao application.properties e reinicie o backend!** 🚀
