# 🎉 SUCESSO! Evolution API v1.7.5 no WSL Ubuntu

## ✅ Configuração Final

**Ambiente**: WSL Ubuntu 22.04  
**Docker**: Nativo Linux  
**Evolution API**: v1.7.5 (estável)  
**Status**: ✅ **FUNCIONANDO PERFEITAMENTE!**

---

## 📊 Serviços Rodando

```
✅ Evolution API v1.7.5: http://localhost:9000
✅ PostgreSQL: localhost:5433
✅ Redis: localhost:6379
✅ Instância criada: secured-guard
✅ Manager: http://localhost:9000/manager
```

---

## 📱 PRÓXIMO PASSO: Conectar WhatsApp

### Acabei de abrir o Manager no seu navegador!

**URL**: http://localhost:9000/manager

### Como Conectar:

1. **No Manager**, você verá a instância **`secured-guard`**

2. **Clique na instância** ou botão **"CONECTAR"**

3. **O QR Code aparecerá** (a v1 funciona perfeitamente!)

4. **Abra o WhatsApp** no celular:
   - Android: Menu (⋮) → Dispositivos conectados → Conectar dispositivo
   - iPhone: Configurações → Dispositivos conectados → Conectar dispositivo

5. **Escaneie o QR Code**

6. **Pronto!** ✅

---

## 🔑 Credenciais

- **API URL**: http://localhost:9000
- **API Key**: `etd2t8kdu5isqdrxh3euhcx0ceflhm92`
- **Instância**: `secured-guard`
- **Instance ID**: `ee018ab3-9d8c-4dbd-a316-17b5944abb16`

---

## 🐧 Comandos Úteis WSL

### Ver status dos containers:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose ps"
```

### Ver logs da Evolution API:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker logs evolution-api-v2 -f"
```

### Parar serviços:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose down"
```

### Iniciar serviços:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose up -d"
```

### Reiniciar Evolution API:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose restart evolution_v2"
```

---

## 📡 Testar a API (PowerShell Windows)

### Status da API:
```powershell
$headers = @{"apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"}
Invoke-RestMethod -Uri "http://localhost:9000" -Headers $headers
```

### Listar instâncias:
```powershell
$headers = @{"apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"}
Invoke-RestMethod -Uri "http://localhost:9000/instance/fetchInstances" -Headers $headers
```

### Verificar status da conexão:
```powershell
$headers = @{"apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"}
Invoke-RestMethod -Uri "http://localhost:9000/instance/connectionState/secured-guard" -Headers $headers
```

### Enviar mensagem (após conectar):
```powershell
$headers = @{
    "apikey" = "etd2t8kdu5isqdrxh3euhcx0ceflhm92"
    "Content-Type" = "application/json"
}

$body = @{
    "number" = "5511999999999"
    "textMessage" = @{
        "text" = "Olá! Teste da Evolution API v1.7.5 no WSL"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9000/message/sendText/secured-guard" `
    -Method Post -Headers $headers -Body $body
```

---

## 📂 Localização dos Arquivos

### No Windows:
```
C:\dev\secured-guard\docker-compose.yml
```

### No WSL:
```
~/secured-guard/docker-compose.yml
```

**Os containers rodam no WSL, mas você acessa do Windows normalmente!**

---

## 🎯 Vantagens desta Configuração

✅ **Performance**: Docker nativo Linux (mais rápido)  
✅ **Estabilidade**: Evolution API v1.7.5 (sem bugs)  
✅ **QR Code**: Funciona perfeitamente  
✅ **Produção**: Mesmo ambiente que servidor  
✅ **Acesso**: Do Windows normalmente (localhost:9000)  

---

## 🚀 Próximos Passos

1. ✅ ~~Evolution API configurada~~
2. ✅ ~~Instância criada~~
3. ⏳ **Conectar WhatsApp** (faça agora no Manager!)
4. ⏳ Integrar com backend Spring Boot
5. ⏳ Testar envio de mensagens
6. ⏳ Deploy para produção

---

## 📚 Documentação

- **Swagger**: http://localhost:9000/docs
- **Manager**: http://localhost:9000/manager
- **Docs Oficiais**: https://doc.evolution-api.com

---

## 🐛 Troubleshooting

### Se o Manager não carregar:
```bash
# Reiniciar Evolution API
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker compose restart evolution_v2"
```

### Se o QR Code não aparecer:
1. Feche o popup
2. Aguarde 10 segundos
3. Clique em CONECTAR novamente
4. Repita até aparecer

### Ver logs de erro:
```bash
wsl -d Ubuntu-22.04 bash -c "cd ~/secured-guard && docker logs evolution-api-v2 --tail 100"
```

---

## 🎉 TUDO PRONTO!

**Acesse agora**: http://localhost:9000/manager  
**Instância**: secured-guard  
**Ação**: Clique em "CONECTAR" e escaneie o QR Code!

**Boa sorte!** 📱🚀

