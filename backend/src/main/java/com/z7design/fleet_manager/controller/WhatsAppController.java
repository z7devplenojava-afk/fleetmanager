package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.EvolutionApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
@Slf4j
public class WhatsAppController {

    private final EvolutionApiService evolutionApiService;

    @Value("${whatsapp.provider:evolution}")
    private String whatsappProvider;

    @Value("${chatbot.whatsapp.company-number:5531999999999}")
    private String companyWhatsAppNumber;

    @GetMapping("/provider")
    public ResponseEntity<?> getProvider() {
        return ResponseEntity.ok(Map.of(
            "provider", "evolution",
            "evolution", Map.of(
                "enabled", evolutionApiService.isEnabled(),
                "available", evolutionApiService.isServiceAvailable(),
                "state", evolutionApiService.getConnectionState(),
                "url", evolutionApiService.getServiceUrl()
            )
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean connected = evolutionApiService.checkConnection();
        return ResponseEntity.ok(Map.of("connected", connected, "provider", "evolution"));
    }

    @PostMapping("/init")
    public ResponseEntity<?> init() {
        boolean ok = evolutionApiService.initializeInstance();
        return ResponseEntity.ok(Map.of("initialized", ok, "provider", "evolution"));
    }

    @GetMapping(value = "/qr", produces = "image/svg+xml")
    public ResponseEntity<String> qr() {
        String qrData = evolutionApiService.getQRCode();
        if (qrData == null) {
            return ResponseEntity.status(503).body("QR not available from Evolution API");
        }
        return ResponseEntity.ok(qrData);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        boolean ok = evolutionApiService.disconnectInstance();
        return ResponseEntity.ok(Map.of("success", ok, "provider", "evolution"));
    }

    @GetMapping("/connection/status/{instanceName}")
    public ResponseEntity<?> getConnectionStatus(@PathVariable("instanceName") String instanceName) {
        try {
            String state = evolutionApiService.getConnectionState();
            boolean connected = "open".equals(state);
            return ResponseEntity.ok(Map.of(
                "connected", connected,
                "instance", instanceName,
                "state", state != null ? state : "close",
                "provider", "evolution"
            ));
        } catch (Exception e) {
            log.error("Erro ao verificar status Evolution: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "connected", false,
                "instance", instanceName,
                "state", "close",
                "provider", "evolution",
                "error", e.getMessage() != null ? e.getMessage() : "Serviço WhatsApp indisponível"
            ));
        }
    }

    @PostMapping("/connection/create")
    public ResponseEntity<?> createConnection(@RequestBody Map<String, Object> request) {
        try {
            String instanceName = request != null && request.get("instanceName") != null ? (String) request.get("instanceName") : "fluxbus";
            boolean qrcode = Boolean.TRUE.equals(request != null ? request.get("qrcode") : false);
            log.info("Criando conexão WhatsApp Evolution. Instance: {}", instanceName);

            boolean serviceAvailable;
            try {
                serviceAvailable = evolutionApiService.isServiceAvailable();
            } catch (Exception e) {
                log.warn("Erro ao verificar Evolution: {}", e.getMessage());
                serviceAvailable = false;
            }

            if (!serviceAvailable) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "Evolution API não disponível. " + (evolutionApiService.getLastErrorMessage() != null ? evolutionApiService.getLastErrorMessage() : "Verifique se o container está rodando."),
                    "instance", instanceName,
                    "serviceAvailable", false,
                    "provider", "evolution",
                    "hint", "Verifique se o serviço Evolution API está rodando em " + evolutionApiService.getServiceUrl()
                ));
            }

            boolean initialized = evolutionApiService.initializeInstance();
            log.info("Instância Evolution inicializada: {}", initialized);

            if (!initialized) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "Falha ao inicializar instância Evolution",
                    "instance", instanceName,
                    "provider", "evolution"
                ));
            }

            if (qrcode) {
                try { Thread.sleep(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

                String qrCodeData = null;
                int maxAttempts = 10;
                for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        qrCodeData = evolutionApiService.getQRCode();
                        if (qrCodeData != null && !qrCodeData.isEmpty()) {
                            log.info("QR Code Evolution obtido na tentativa {}/{}", attempt, maxAttempts);
                            break;
                        }
                    } catch (HttpClientErrorException e) {
                        log.debug("QR Code Evolution ainda não disponível tentativa {}/{}", attempt, maxAttempts);
                    } catch (Exception e) {
                        log.warn("Erro ao obter QR Code tentativa {}: {}", attempt, e.getMessage());
                    }
                    if (attempt < maxAttempts) {
                        try { Thread.sleep(1000 * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                    }
                }

                if (qrCodeData == null || qrCodeData.isEmpty()) {
                    return ResponseEntity.ok(Map.of(
                        "success", false,
                        "error", "QR Code não foi gerado pela Evolution API após " + maxAttempts + " tentativas",
                        "instance", instanceName,
                        "provider", "evolution",
                        "connectionState", evolutionApiService.getConnectionState()
                    ));
                }

                String base64QR = qrCodeData;
                if (!base64QR.startsWith("data:image")) {
                    base64QR = "data:image/png;base64," + base64QR;
                }

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "instance", instanceName,
                    "provider", "evolution",
                    "qrcode", Map.of("base64", base64QR)
                ));
            }

            return ResponseEntity.ok(Map.of("success", true, "instance", instanceName, "provider", "evolution"));
        } catch (Exception e) {
            log.error("Erro ao criar conexão Evolution: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", e.getMessage() != null ? e.getMessage() : "Erro ao criar conexão WhatsApp",
                "provider", "evolution"
            ));
        }
    }

    @DeleteMapping("/connection/disconnect/{instanceName}")
    public ResponseEntity<?> disconnectConnection(@PathVariable("instanceName") String instanceName) {
        try {
            boolean ok = evolutionApiService.disconnectInstance();
            return ResponseEntity.ok(Map.of("success", ok, "provider", "evolution"));
        } catch (Exception e) {
            log.error("Erro ao desconectar Evolution: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/send-message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            String customerName = request.get("customerName");
            String customerPhone = request.get("customerPhone");
            String customerEmail = request.get("customerEmail");

            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Mensagem é obrigatória"));
            }

            StringBuilder fullMessage = new StringBuilder();
            fullMessage.append("*Nova mensagem do Chatbot*\n\n");
            if (customerName != null && !customerName.trim().isEmpty()) {
                fullMessage.append("Nome: ").append(customerName).append("\n");
            }
            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                fullMessage.append("Email: ").append(customerEmail).append("\n");
            }
            if (customerPhone != null && !customerPhone.trim().isEmpty()) {
                fullMessage.append("Telefone: ").append(customerPhone).append("\n");
            }
            fullMessage.append("\nMensagem:\n").append(message);

            log.info("Enviando mensagem do chatbot para número da empresa via Evolution API");

            boolean sent = evolutionApiService.sendTextMessage(companyWhatsAppNumber, fullMessage.toString());

            if (sent) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.", "provider", "evolution"));
            }
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Falha ao enviar mensagem. Tente novamente ou entre em contato diretamente.", "provider", "evolution"));
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem do chatbot: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Erro interno: " + e.getMessage(), "provider", "evolution"));
        }
    }
}
