# 🔧 Configuração de Acesso pela Rede Local

Este guia explica como permitir acesso ao sistema de outros computadores na mesma rede.

## 📋 Pré-requisitos

1. **IP do servidor**: `192.168.1.116` (verificado via `ipconfig`)
2. **Portas utilizadas**:
   - Frontend: `3000`
   - Backend: `8083`

## 🔥 Passo 1: Configurar Firewall do Windows

### Opção A: Usando o Script PowerShell (Recomendado)

1. Abra o PowerShell **como Administrador**:
   - Pressione `Win + X`
   - Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. Navegue até a pasta do projeto:
   ```powershell
   cd C:\dev\secured-guard
   ```

3. Execute o script:
   ```powershell
   .\configure-firewall.ps1
   ```

### Opção B: Configuração Manual

1. Abra o **Firewall do Windows Defender**:
   - Pressione `Win + R`
   - Digite `wf.msc` e pressione Enter

2. Clique em **Regras de Entrada** → **Nova Regra**

3. Para a porta 3000 (Frontend):
   - Tipo: Porta
   - Protocolo: TCP
   - Porta específica: 3000
   - Ação: Permitir a conexão
   - Nome: "Secured Guard Frontend"

4. Repita para a porta 8083 (Backend):
   - Porta específica: 8083
   - Nome: "Secured Guard Backend"

## ✅ Passo 2: Verificar Configurações

### Backend
O backend já está configurado corretamente em `application.properties`:
```properties
server.port=8083
server.address=0.0.0.0  # ✅ Permite acesso de qualquer IP
```

### Frontend
O frontend foi atualizado em `vite.config.ts`:
```typescript
server: {
  host: "0.0.0.0",  // ✅ Permite acesso de qualquer IP
  port: 3000,
}
```

## 🌐 Passo 3: Acessar de Outro Computador

1. **Certifique-se de que ambos os servidores estão rodando**:
   - Backend na porta 8083
   - Frontend na porta 3000

2. **No outro computador, acesse**:
   ```
   http://192.168.1.116:3000
   ```

3. **Se não funcionar, verifique**:
   - Ambos os computadores estão na mesma rede?
   - O firewall do Windows está permitindo as portas?
   - Os servidores estão realmente rodando?

## 🔍 Troubleshooting

### Verificar se as portas estão abertas

No servidor, execute:
```powershell
netstat -an | findstr "3000"
netstat -an | findstr "8083"
```

Você deve ver algo como:
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
TCP    0.0.0.0:8083           0.0.0.0:0              LISTENING
```

### Verificar regras de firewall

```powershell
netsh advfirewall firewall show rule name="Secured Guard Backend"
netsh advfirewall firewall show rule name="Secured Guard Frontend"
```

### Testar conexão do outro computador

No outro computador, teste se as portas estão acessíveis:
```powershell
Test-NetConnection -ComputerName 192.168.1.116 -Port 3000
Test-NetConnection -ComputerName 192.168.1.116 -Port 8083
```

### Problema: Frontend não carrega recursos do backend

Se o frontend carregar mas não conseguir fazer requisições ao backend:

1. Verifique se o backend está acessível diretamente:
   ```
   http://192.168.1.116:8083/api/health
   ```

2. O proxy do Vite está configurado para `localhost:8083`, o que funciona porque o proxy roda no servidor. Mas se precisar acessar diretamente, você pode configurar a variável de ambiente `VITE_API_URL` no frontend.

## 📝 Notas Importantes

- **Desenvolvimento**: O proxy do Vite redireciona `/api` para `localhost:8083`, então funciona corretamente mesmo acessando pelo IP externo.
- **Produção**: Em produção, configure o `VITE_API_URL` para apontar para o IP/domínio correto do backend.
- **Segurança**: Essas configurações são para desenvolvimento local. Em produção, use HTTPS e configure adequadamente.

## 🆘 Ainda não funciona?

1. Verifique se o antivírus não está bloqueando
2. Verifique se há outro firewall (ex: router) bloqueando
3. Tente desabilitar temporariamente o firewall para testar
4. Verifique os logs do backend e frontend para erros
























