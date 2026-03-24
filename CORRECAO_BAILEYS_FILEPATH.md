# 🔧 Correção: Baileys REST API - Envio de Arquivos

## 🐛 Problema Identificado

```
400 Bad Request: "{"success":false,"error":"id and filepath required"}"
```

**Causa:** O `BaileysRestService` estava tentando fazer **upload multipart** do arquivo, mas a API do Baileys REST espera receber o **caminho do arquivo como string** (não o arquivo em si).

---

## ✅ Correção Aplicada

### **Antes (ERRADO):**
```java
// Tentava fazer multipart upload
MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
body.add("id", phoneNumber);
body.add("document", new FileSystemResource(file)); // ❌ Errado
```

### **Depois (CORRETO):**
```java
// Envia JSON com filepath como string
ObjectNode body = objectMapper.createObjectNode();
body.put("id", phoneNumber);
body.put("filepath", filePath); // ✅ Correto
body.put("message", message);
```

---

## 📋 Formato Esperado pela API Baileys

```json
POST /message/document?key=securedguard
Content-Type: application/json

{
  "id": "5531971731747",
  "filepath": "C:\\dev\\secured-guard\\backend\\holerites\\9-2025\\JOSE_MARIO_RAMOS_00824310608_9_2025.pdf",
  "message": "Seu holerite mensal"
}
```

---

## ⚠️ Requisitos

**IMPORTANTE:** Para isso funcionar, o **Baileys REST API** precisa ter **acesso ao sistema de arquivos** onde os PDFs estão salvos.

### **Cenários:**

#### ✅ **Mesmo Servidor (Windows/Linux)**
Se o Baileys e o backend estão na mesma máquina:
```
Backend salva: C:\dev\secured-guard\backend\holerites\...
Baileys lê: C:\dev\secured-guard\backend\holerites\... ✅
```

#### ❌ **Containers Diferentes (Docker)**
Se estão em containers separados, precisam compartilhar volume:
```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads
  
  baileys:
    volumes:
      - ./uploads:/app/uploads  # Mesmo volume!
```

#### ❌ **Servidores Diferentes**
Se o Baileys está em outro servidor, precisa:
1. Compartilhar via rede (NFS, SMB)
2. Ou fazer upload do arquivo via outra API
3. Ou usar base64 encoding

---

## 🚀 Como Testar

### **1. Reiniciar o Backend**

```powershell
# Parar o backend atual (Ctrl+C)

# Ir para o diretório
cd C:\dev\secured-guard\backend

# Reiniciar
.\mvnw.cmd spring-boot:run
```

### **2. Verificar se Baileys está Rodando**

```powershell
# Testar conexão
curl http://localhost:3333/instance/connectionState?key=securedguard
```

Deve retornar algo como:
```json
{"state":"open","message":"Connected"}
```

### **3. Testar Envio de Holerite**

Via frontend ou Postman:
```
POST http://localhost:8081/api/envio/individual
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "cpf": "00824310608",
  "tipo": "whatsapp",
  "mensagem": "Seu holerite mensal"
}
```

---

## 🔍 Ver Logs

```powershell
# No backend, você verá:
📤 Preparando envio do arquivo: JOSE_MARIO_RAMOS_00824310608_9_2025.pdf
📊 Tamanho: 117990 bytes
📤 Enviando arquivo via Baileys REST para: 5531971731747
🔗 URL: http://localhost:3333/message/document?key=securedguard
📄 Filepath: C:\dev\secured-guard\backend\holerites\9-2025\JOSE_MARIO_RAMOS_00824310608_9_2025.pdf
✅ Arquivo enviado com sucesso via Baileys REST
```

---

## 🐛 Troubleshooting

### **Erro: "file not found"**

**Causa:** Baileys não consegue acessar o caminho.

**Soluções:**
1. Verificar se o Baileys está na mesma máquina
2. Usar caminho absoluto (não relativo)
3. Verificar permissões de leitura

### **Erro: "id and filepath required"** (ainda)

**Causa:** JSON malformado ou campos faltando.

**Solução:**
1. Verificar logs do backend
2. Ver se `filepath` está sendo enviado
3. Testar direto na API do Baileys:
```bash
curl -X POST http://localhost:3333/message/document?key=securedguard \
  -H "Content-Type: application/json" \
  -d '{"id":"5531971731747","filepath":"C:\\caminho\\arquivo.pdf"}'
```

### **Erro: Connection refused**

**Causa:** Baileys REST não está rodando.

**Solução:**
```bash
cd whatsapp-service
npm start
```

---

## 📝 Alterações nos Arquivos

- ✅ `BaileysRestService.java` - Corrigido para usar JSON com filepath
- ✅ Removidos imports desnecessários (FileSystemResource, MultiValueMap)
- ✅ Compilação OK
- ⏳ **Aguardando reinicialização do backend para testar**

---

## ✨ Próximos Passos

1. **Reiniciar o backend** com a correção
2. **Testar envio de holerite** via WhatsApp
3. **Verificar logs** para confirmar sucesso
4. Se funcionar: ✅ Commit das mudanças
5. Se não funcionar: 🔍 Debugar com os logs

---

**Status:** ✅ Compilado | ⏳ Aguardando Teste

