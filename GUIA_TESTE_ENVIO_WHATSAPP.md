# 📱 Guia de Teste - Envio de Mensagens WhatsApp

## ✅ Pré-requisitos Confirmados

```
✅ WhatsApp conectado (estado: open)
✅ Baileys pronto (ready: true)
✅ Backend Spring Boot rodando (porta 8081)
```

---

## 🧪 TESTE 1: Enviar Mensagem de Texto

### Cole este comando no PowerShell:

```powershell
# ALTERE O NÚMERO PARA O SEU!
$meuNumero = "5511999999999"  # ← COLOQUE SEU NÚMERO AQUI (com DDI)

$body = @{
    id = $meuNumero
    message = "🎉 TESTE DO SECURED GUARD!

✅ WhatsApp conectado
✅ Baileys funcionando
✅ Mensagem enviada via API

Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3333/message/text" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

if ($result.success) {
    Write-Host "`n✅ MENSAGEM ENVIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "Verifique seu WhatsApp!`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Erro ao enviar" -ForegroundColor Red
}
```

---

## 🧪 TESTE 2: Enviar Documento/PDF

### Primeiro, verifique se tem algum PDF na pasta holerites:

```powershell
Get-ChildItem backend\holerites -Filter *.pdf | Select-Object Name
```

### Depois, envie um documento:

```powershell
$meuNumero = "5511999999999"  # ← SEU NÚMERO

# Liste os PDFs disponíveis
$pdfs = Get-ChildItem backend\holerites -Filter *.pdf
if ($pdfs.Count -gt 0) {
    $pdfNome = $pdfs[0].Name
    
    $body = @{
        id = $meuNumero
        message = "📄 Documento de teste do Secured Guard"
        filepath = "/app/holerites/$pdfNome"
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:3333/message/document" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    if ($result.success) {
        Write-Host "`n✅ DOCUMENTO ENVIADO!" -ForegroundColor Green
        Write-Host "PDF: $pdfNome`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n⚠️ Nenhum PDF encontrado em backend\holerites" -ForegroundColor Yellow
}
```

---

## 🧪 TESTE 3: Verificar Logs em Tempo Real

```powershell
# Ver logs do WhatsApp
docker logs -f whatsapp-service

# Você verá:
# - Mensagens sendo enviadas
# - Confirmações de entrega
# - Possíveis erros
```

---

## 🔧 Integração com Backend Spring Boot

### Criar serviço WhatsApp no backend:

**Arquivo**: `backend/src/main/java/com/z7design/secured_guard/service/WhatsAppService.java`

```java
package com.z7design.secured_guard.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class WhatsAppService {
    
    @Value("${whatsapp.service.url:http://localhost:3333}")
    private String whatsappUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Verifica se o WhatsApp está conectado
     */
    public boolean isConnected() {
        try {
            String url = whatsappUrl + "/instance/connectionState";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();
            return "open".equals(body.get("state"));
        } catch (Exception e) {
            log.error("Erro ao verificar estado do WhatsApp", e);
            return false;
        }
    }
    
    /**
     * Envia mensagem de texto
     */
    public boolean sendTextMessage(String phoneNumber, String message) {
        if (!isConnected()) {
            log.warn("WhatsApp não está conectado");
            return false;
        }
        
        try {
            String url = whatsappUrl + "/message/text";
            
            Map<String, String> request = new HashMap<>();
            request.put("id", phoneNumber);
            request.put("message", message);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            
            boolean success = Boolean.TRUE.equals(body.get("success"));
            
            if (success) {
                log.info("Mensagem enviada com sucesso para: {}", phoneNumber);
            } else {
                log.error("Falha ao enviar mensagem para: {}", phoneNumber);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem WhatsApp", e);
            return false;
        }
    }
    
    /**
     * Envia documento (PDF, imagem, etc)
     */
    public boolean sendDocument(String phoneNumber, String message, String filepath) {
        if (!isConnected()) {
            log.warn("WhatsApp não está conectado");
            return false;
        }
        
        try {
            String url = whatsappUrl + "/message/document";
            
            Map<String, String> request = new HashMap<>();
            request.put("id", phoneNumber);
            request.put("message", message);
            request.put("filepath", filepath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            
            boolean success = Boolean.TRUE.equals(body.get("success"));
            
            if (success) {
                log.info("Documento enviado com sucesso para: {}", phoneNumber);
            } else {
                log.error("Falha ao enviar documento para: {}", phoneNumber);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("Erro ao enviar documento WhatsApp", e);
            return false;
        }
    }
}
```

### Adicionar no `application.yml`:

```yaml
whatsapp:
  service:
    url: http://localhost:3333
    enabled: true
```

---

## 🎯 Exemplo de Uso no Controller

```java
@RestController
@RequestMapping("/api/payslips")
public class PayslipController {
    
    @Autowired
    private WhatsAppService whatsAppService;
    
    @PostMapping("/{id}/send-whatsapp")
    public ResponseEntity<?> sendPayslipViaWhatsApp(@PathVariable Long id) {
        // Buscar holerite
        Payslip payslip = payslipService.findById(id);
        
        // Verificar se WhatsApp está conectado
        if (!whatsAppService.isConnected()) {
            return ResponseEntity.status(503)
                .body("WhatsApp não está conectado");
        }
        
        // Enviar documento
        String phoneNumber = payslip.getEmployee().getPhoneNumber();
        String message = "Olá! Segue seu holerite referente ao mês de " + payslip.getMonth();
        String filepath = "/app/holerites/" + payslip.getFilename();
        
        boolean sent = whatsAppService.sendDocument(phoneNumber, message, filepath);
        
        if (sent) {
            return ResponseEntity.ok("Holerite enviado com sucesso!");
        } else {
            return ResponseEntity.status(500)
                .body("Erro ao enviar holerite");
        }
    }
}
```

---

## ✅ Checklist Final

Antes de usar em produção:

- [ ] Testou envio de mensagem de texto
- [ ] Testou envio de documento/PDF
- [ ] Verificou logs do WhatsApp
- [ ] Integrou com backend Spring Boot
- [ ] Testou reconexão após desconectar
- [ ] Configurou backup da sessão
- [ ] Documentou endpoints no Swagger

---

## 🚀 TUDO PRONTO!

**WhatsApp**: ✅ CONECTADO  
**Backend**: ⏳ INICIALIZANDO  
**Sistema**: ✅ OPERACIONAL  

**Cole seu número e teste o envio de mensagem agora!** 📱🎉

