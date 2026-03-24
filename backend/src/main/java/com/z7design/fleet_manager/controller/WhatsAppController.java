package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.BaileysRestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
@Slf4j
public class WhatsAppController {

    private final BaileysRestService baileysRestService;
    
    @Value("${chatbot.whatsapp.company-number:5531999999999}")
    private String companyWhatsAppNumber;

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean connected = baileysRestService.checkConnection();
        return ResponseEntity.ok(java.util.Map.of("connected", connected));
    }

    @PostMapping("/init")
    public ResponseEntity<?> init() {
        boolean ok = baileysRestService.initializeInstance();
        return ResponseEntity.ok(java.util.Map.of("initialized", ok));
    }

    @GetMapping(value = "/qr", produces = "image/svg+xml")
    public ResponseEntity<String> qr() {
        String svg = baileysRestService.getQRCode();
        if (svg == null) {
            return ResponseEntity.status(404).body("QR not available");
        }
        return ResponseEntity.ok(svg);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        boolean ok = baileysRestService.disconnectInstance();
        return ResponseEntity.ok(java.util.Map.of("success", ok));
    }

    /**
     * Obter status da conexÃ£o por nome da instÃ¢ncia
     */
    @GetMapping("/connection/status/{instanceName}")
    public ResponseEntity<?> getConnectionStatus(@PathVariable String instanceName) {
        try {
            boolean connected = baileysRestService.checkConnection();
            return ResponseEntity.ok(Map.of(
                "connected", connected,
                "instance", instanceName,
                "state", connected ? "open" : "close"
            ));
        } catch (Exception e) {
            log.error("âŒ Erro ao verificar status: {}", e.getMessage(), e);
            // Retornar sempre OK com estado desconectado, mesmo em caso de erro
            // Isso evita que o frontend quebre se o serviÃ§o nÃ£o estiver disponÃ­vel
            return ResponseEntity.ok(Map.of(
                "connected", false,
                "instance", instanceName,
                "state", "close",
                "error", e.getMessage() != null ? e.getMessage() : "ServiÃ§o WhatsApp indisponÃ­vel"
            ));
        }
    }

    /**
     * Criar nova instÃ¢ncia e gerar QR Code
     */
    @PostMapping("/connection/create")
    public ResponseEntity<?> createConnection(@RequestBody Map<String, Object> request) {
        try {
            String instanceName = request != null ? (String) request.get("instanceName") : "securedguard";
            boolean qrcode = Boolean.TRUE.equals(request != null ? request.get("qrcode") : false);
            
            log.info("ðŸ”„ Criando conexÃ£o WhatsApp. Instance: {}, QRCode solicitado: {}", instanceName, qrcode);
            
            // Verificar se o serviÃ§o estÃ¡ disponÃ­vel antes de tentar inicializar
            boolean serviceAvailable = false;
            try {
                serviceAvailable = baileysRestService.isServiceAvailable();
            } catch (Exception e) {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel verificar disponibilidade do Baileys REST: {}", e.getMessage());
            }
            
            if (!serviceAvailable) {
                String errorMessage = baileysRestService.getLastErrorMessage();
                String serviceUrl = baileysRestService.getServiceUrl();
                boolean isEnabled = baileysRestService.isEnabled();
                
                log.error("âŒ ServiÃ§o WhatsApp nÃ£o disponÃ­vel");
                log.error("   URL configurada: {}", serviceUrl);
                log.error("   Habilitado: {}", isEnabled);
                log.error("   Erro: {}", errorMessage);
                
                // Retornar 200 OK com erro na resposta para nÃ£o quebrar o frontend
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "ServiÃ§o WhatsApp nÃ£o disponÃ­vel. " + 
                             (errorMessage != null ? errorMessage : "Verifique se o container Docker estÃ¡ rodando."),
                    "instance", instanceName != null ? instanceName : "unknown",
                    "serviceAvailable", false,
                    "serviceUrl", serviceUrl != null ? serviceUrl : "nÃ£o configurado",
                    "enabled", isEnabled,
                    "hint", "No ambiente CI, verifique se o serviÃ§o Evolution API (http://evolution-api-ci:8080) ou Baileys REST estÃ¡ acessÃ­vel. " +
                            "Verifique tambÃ©m se o serviÃ§o estÃ¡ rodando e acessÃ­vel na rede Docker."
                ));
            }
            
            boolean initialized = false;
            try {
                initialized = baileysRestService.initializeInstance();
                log.info("ðŸ“± InstÃ¢ncia inicializada: {}", initialized);
            } catch (Exception e) {
                log.error("âŒ Erro ao inicializar instÃ¢ncia: {}", e.getMessage(), e);
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "Erro ao inicializar instÃ¢ncia: " + (e.getMessage() != null ? e.getMessage() : "ServiÃ§o indisponÃ­vel"),
                    "instance", instanceName != null ? instanceName : "unknown"
                ));
            }
            
            if (!initialized) {
                log.error("âŒ Baileys REST nÃ£o disponÃ­vel ou falhou ao inicializar");
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "ServiÃ§o WhatsApp nÃ£o disponÃ­vel. Verifique se o Baileys REST estÃ¡ rodando em http://localhost:3333",
                    "instance", instanceName != null ? instanceName : "unknown"
                ));
            }
            
            if (qrcode) {
                // Aguardar apenas o tempo mÃ­nimo necessÃ¡rio para o QR Code ser gerado
                try {
                    Thread.sleep(1000); // Tempo mÃ­nimo: 1 segundo
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                
                // Tentar obter QR Code rapidamente (menos tentativas, intervalos menores)
                String qrCodeData = null;
                int maxAttempts = 5; // Reduzido de 10 para 5 tentativas
                for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        qrCodeData = baileysRestService.getQRCode();
                        if (qrCodeData != null && !qrCodeData.isEmpty()) {
                            log.info("âœ… QR Code obtido na tentativa {}/{}", attempt, maxAttempts);
                            break;
                        }
                    } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
                        // QR Code ainda nÃ£o estÃ¡ disponÃ­vel, continuar tentando
                        log.debug("â³ QR Code ainda nÃ£o disponÃ­vel na tentativa {}/{}", attempt, maxAttempts);
                    } catch (Exception e) {
                        log.warn("âš ï¸ Erro ao obter QR Code na tentativa {}: {}", attempt, e.getMessage());
                    }
                    
                    if (qrCodeData == null || qrCodeData.isEmpty()) {
                        log.debug("â³ Aguardando QR Code... Tentativa {}/{}", attempt, maxAttempts);
                        if (attempt < maxAttempts) {
                            try {
                                // Intervalo curto: 500ms, 1s, 1.5s, etc. (mais rÃ¡pido)
                                Thread.sleep(500 * attempt);
                            } catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                        }
                    }
                }
                
                log.info("ðŸ“¸ QR Code obtido. Tamanho: {} caracteres", qrCodeData != null ? qrCodeData.length() : 0);
                
                if (qrCodeData == null || qrCodeData.isEmpty()) {
                    log.error("âŒ QR Code nÃ£o foi gerado pelo Baileys REST apÃ³s {} tentativas", maxAttempts);
                    
                    // Verificar estado da conexÃ£o para dar mensagem mais especÃ­fica
                    String connectionState = baileysRestService.getConnectionState();
                    String errorMessage = "NÃ£o foi possÃ­vel gerar o QR Code.";
                    
                    if (connectionState == null) {
                        errorMessage += " O serviÃ§o Baileys REST nÃ£o estÃ¡ acessÃ­vel. Verifique se o container estÃ¡ rodando.";
                    } else if ("close".equals(connectionState) || "closed".equals(connectionState)) {
                        errorMessage += " A conexÃ£o com o WhatsApp estÃ¡ fechada. Isso pode indicar um problema de autenticaÃ§Ã£o (erro 401) ou mudanÃ§a no protocolo do WhatsApp. Verifique os logs do container whatsapp-service-ci.";
                    } else if ("connecting".equals(connectionState)) {
                        errorMessage += " A conexÃ£o estÃ¡ em andamento. Aguarde alguns segundos e tente novamente.";
                    }
                    
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "error", errorMessage,
                        "instance", instanceName != null ? instanceName : "unknown",
                        "connectionState", connectionState != null ? connectionState : "unknown",
                        "hint", "Se o problema persistir, verifique os logs do container whatsapp-service-ci para mais detalhes sobre o erro de conexÃ£o com o WhatsApp."
                    ));
                }
                
                // Se o QR Code jÃ¡ vier em base64, usar diretamente
                // SenÃ£o, precisarÃ¡ ser convertido
                String base64QR = qrCodeData;
                
                // Se nÃ£o comeÃ§ar com data:image, adicionar prefixo
                if (!base64QR.startsWith("data:image")) {
                    base64QR = "data:image/png;base64," + base64QR;
                }
                
                log.info("âœ… QR Code preparado para envio ao frontend");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "instance", instanceName != null ? instanceName : "unknown",
                    "qrcode", Map.of("base64", base64QR)
                ));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "instance", instanceName != null ? instanceName : "unknown"));
        } catch (Exception e) {
            log.error("âŒ Erro ao criar instÃ¢ncia: {}", e.getMessage(), e);
            // Retornar 200 OK com erro na resposta para nÃ£o quebrar o frontend
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", e.getMessage() != null ? e.getMessage() : "Erro ao criar conexÃ£o WhatsApp. Verifique se o serviÃ§o estÃ¡ disponÃ­vel.",
                "instance", request != null && request.get("instanceName") != null ? (String) request.get("instanceName") : "unknown"
            ));
        }
    }

    /**
     * Desconectar instÃ¢ncia
     */
    @DeleteMapping("/connection/disconnect/{instanceName}")
    public ResponseEntity<?> disconnectConnection(@PathVariable String instanceName) {
        try {
            boolean ok = baileysRestService.disconnectInstance();
            return ResponseEntity.ok(Map.of("success", ok));
        } catch (Exception e) {
            log.error("âŒ Erro ao desconectar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Envia mensagem simples via WhatsApp (usado pelo chatbot)
     * Envia a mensagem do cliente para o nÃºmero da empresa configurado
     */
    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            String customerName = request.get("customerName");
            String customerPhone = request.get("customerPhone");
            String customerEmail = request.get("customerEmail");
            
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Mensagem Ã© obrigatÃ³ria"));
            }
            
            // Construir mensagem completa com informaÃ§Ãµes do cliente
            StringBuilder fullMessage = new StringBuilder();
            fullMessage.append("ðŸ“± *Nova mensagem do Chatbot*\n\n");
            
            if (customerName != null && !customerName.trim().isEmpty()) {
                fullMessage.append("ðŸ‘¤ *Nome:* ").append(customerName).append("\n");
            }
            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                fullMessage.append("ðŸ“§ *Email:* ").append(customerEmail).append("\n");
            }
            if (customerPhone != null && !customerPhone.trim().isEmpty()) {
                fullMessage.append("ðŸ“ž *Telefone:* ").append(customerPhone).append("\n");
            }
            
            fullMessage.append("\nðŸ’¬ *Mensagem:*\n").append(message);
            
            log.info("ðŸ“¤ Enviando mensagem do chatbot para nÃºmero da empresa: {}", companyWhatsAppNumber);
            boolean sent = baileysRestService.sendTextMessage(companyWhatsAppNumber, fullMessage.toString());
            
            if (sent) {
                log.info("âœ… Mensagem do chatbot enviada com sucesso para a empresa");
                return ResponseEntity.ok(Map.of("success", true, "message", "Mensagem enviada com sucesso! Nossa equipe entrarÃ¡ em contato em breve."));
            } else {
                log.error("âŒ Falha ao enviar mensagem do chatbot");
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Falha ao enviar mensagem. Tente novamente ou entre em contato diretamente."));
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar mensagem do chatbot: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Erro interno: " + e.getMessage()));
        }
    }
}



