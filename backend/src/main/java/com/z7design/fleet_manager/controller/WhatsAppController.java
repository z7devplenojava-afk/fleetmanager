package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.BaileysRestService;
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

    private final BaileysRestService baileysRestService;
    private final EvolutionApiService evolutionApiService;

    @Value("${whatsapp.provider:baileys}")
    private String whatsappProvider;

    @Value("${chatbot.whatsapp.company-number:5531999999999}")
    private String companyWhatsAppNumber;

    private boolean isEvolutionProvider() {
        return "evolution".equalsIgnoreCase(whatsappProvider);
    }

    @GetMapping("/provider")
    public ResponseEntity<?> getProvider() {
        return ResponseEntity.ok(Map.of(
            "provider", whatsappProvider,
            "evolution", Map.of(
                "enabled", evolutionApiService.isEnabled(),
                "available", evolutionApiService.isServiceAvailable(),
                "state", evolutionApiService.getConnectionState(),
                "url", evolutionApiService.getServiceUrl()
            ),
            "baileys", Map.of(
                "enabled", baileysRestService.isEnabled(),
                "available", baileysRestService.isServiceAvailable(),
                "state", baileysRestService.getConnectionState(),
                "url", baileysRestService.getServiceUrl()
            )
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        if (isEvolutionProvider()) {
            boolean connected = evolutionApiService.checkConnection();
            return ResponseEntity.ok(Map.of("connected", connected, "provider", "evolution"));
        }
        boolean connected = baileysRestService.checkConnection();
        return ResponseEntity.ok(Map.of("connected", connected, "provider", "baileys"));
    }

    @PostMapping("/init")
    public ResponseEntity<?> init() {
        if (isEvolutionProvider()) {
            boolean ok = evolutionApiService.initializeInstance();
            return ResponseEntity.ok(Map.of("initialized", ok, "provider", "evolution"));
        }
        boolean ok = baileysRestService.initializeInstance();
        return ResponseEntity.ok(Map.of("initialized", ok, "provider", "baileys"));
    }

    @GetMapping(value = "/qr", produces = "image/svg+xml")
    public ResponseEntity<String> qr() {
        if (isEvolutionProvider()) {
            String qrData = evolutionApiService.getQRCode();
            if (qrData == null) {
                return ResponseEntity.status(503).body("QR not available from Evolution API");
            }
            return ResponseEntity.ok(qrData);
        }
        String svg = baileysRestService.getQRCode();
        if (svg == null) {
            return ResponseEntity.status(404).body("QR not available");
        }
        return ResponseEntity.ok(svg);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        if (isEvolutionProvider()) {
            boolean ok = evolutionApiService.disconnectInstance();
            return ResponseEntity.ok(Map.of("success", ok, "provider", "evolution"));
        }
        boolean ok = baileysRestService.disconnectInstance();
        return ResponseEntity.ok(Map.of("success", ok, "provider", "baileys"));
    }

    @GetMapping("/connection/status/{instanceName}")
    public ResponseEntity<?> getConnectionStatus(@PathVariable("instanceName") String instanceName) {
        try {
            if (isEvolutionProvider()) {
                String state = evolutionApiService.getConnectionState();
                boolean connected = "open".equals(state);
                return ResponseEntity.ok(Map.of(
                    "connected", connected,
                    "instance", instanceName,
                    "state", state != null ? state : "close",
                    "provider", "evolution"
                ));
            }
            boolean connected = baileysRestService.checkConnection();
            return ResponseEntity.ok(Map.of(
                "connected", connected,
                "instance", instanceName,
                "state", connected ? "open" : "close",
                "provider", "baileys"
            ));
        } catch (Exception e) {
            log.error("Erro ao verificar status: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "connected", false,
                "instance", instanceName,
                "state", "close",
                "provider", whatsappProvider,
                "error", e.getMessage() != null ? e.getMessage() : "Serviço WhatsApp indisponível"
            ));
        }
    }

    @PostMapping("/connection/create")
    public ResponseEntity<?> createConnection(@RequestBody Map<String, Object> request) {
        try {
            String instanceName = request != null ? (String) request.get("instanceName") : "fluxbus";
            boolean qrcode = Boolean.TRUE.equals(request != null ? request.get("qrcode") : false);
            log.info("Criando conexão WhatsApp. Provider: {}, Instance: {}", whatsappProvider, instanceName);

            if (isEvolutionProvider()) {
                return createEvolutionConnection(instanceName, qrcode);
            }
            return createBaileysConnection(instanceName, qrcode);
        } catch (Exception e) {
            log.error("Erro ao criar instância: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", e.getMessage() != null ? e.getMessage() : "Erro ao criar conexão WhatsApp",
                "provider", whatsappProvider
            ));
        }
    }

    private ResponseEntity<?> createEvolutionConnection(String instanceName, boolean qrcode) {
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
    }

    private ResponseEntity<?> createBaileysConnection(String instanceName, boolean qrcode) {
        boolean serviceAvailable;
        try {
            serviceAvailable = baileysRestService.isServiceAvailable();
        } catch (Exception e) {
            log.warn("Erro ao verificar Baileys: {}", e.getMessage());
            serviceAvailable = false;
        }

        if (!serviceAvailable) {
            String errorMessage = baileysRestService.getLastErrorMessage();
            String serviceUrl = baileysRestService.getServiceUrl();
            boolean isEnabled = baileysRestService.isEnabled();

            log.error("Serviço WhatsApp Baileys não disponível");
            log.error("URL configurada: {}", serviceUrl);
            log.error("Habilitado: {}", isEnabled);
            log.error("Erro: {}", errorMessage);

            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", "Serviço WhatsApp não disponível. " +
                         (errorMessage != null ? errorMessage : "Verifique se o container Docker está rodando."),
                "instance", instanceName,
                "serviceAvailable", false,
                "serviceUrl", serviceUrl != null ? serviceUrl : "não configurado",
                "enabled", isEnabled,
                "provider", "baileys",
                "hint", "No ambiente CI, verifique se o serviço Evolution API (http://evolution-api-ci:8080) ou Baileys REST está acessível. " +
                        "Verifique também se o serviço está rodando e acessível na rede Docker."
            ));
        }

        boolean initialized;
        try {
            initialized = baileysRestService.initializeInstance();
            log.info("Instância Baileys inicializada: {}", initialized);
        } catch (Exception e) {
            log.error("Erro ao inicializar instância Baileys: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", "Erro ao inicializar instância: " + (e.getMessage() != null ? e.getMessage() : "Serviço indisponível"),
                "instance", instanceName,
                "provider", "baileys"
            ));
        }

        if (!initialized) {
            log.error("Baileys REST não disponível ou falhou ao inicializar");
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", "Serviço WhatsApp não disponível. Verifique se o Baileys REST está rodando em http://localhost:3333",
                "instance", instanceName,
                "provider", "baileys"
            ));
        }

        if (qrcode) {
            try { Thread.sleep(1000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

            String qrCodeData = null;
            int maxAttempts = 5;
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    qrCodeData = baileysRestService.getQRCode();
                    if (qrCodeData != null && !qrCodeData.isEmpty()) {
                        log.info("QR Code Baileys obtido na tentativa {}/{}", attempt, maxAttempts);
                        break;
                    }
                } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
                    log.debug("QR Code ainda não disponível tentativa {}/{}", attempt, maxAttempts);
                } catch (Exception e) {
                    log.warn("Erro ao obter QR Code tentativa {}: {}", attempt, e.getMessage());
                }
                if (qrCodeData == null || qrCodeData.isEmpty()) {
                    log.debug("Aguardando QR Code... Tentativa {}/{}", attempt, maxAttempts);
                    if (attempt < maxAttempts) {
                        try { Thread.sleep(500 * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                    }
                }
            }

            log.info("QR Code Baileys obtido. Tamanho: {} caracteres", qrCodeData != null ? qrCodeData.length() : 0);

            if (qrCodeData == null || qrCodeData.isEmpty()) {
                log.error("QR Code não foi gerado pelo Baileys REST após {} tentativas", maxAttempts);
                String connectionState = baileysRestService.getConnectionState();
                String errorMessage = "Não foi possível gerar o QR Code.";
                if (connectionState == null) {
                    errorMessage += " O serviço Baileys REST não está acessível.";
                } else if ("close".equals(connectionState) || "closed".equals(connectionState)) {
                    errorMessage += " A conexão com o WhatsApp está fechada.";
                } else if ("connecting".equals(connectionState)) {
                    errorMessage += " A conexão está em andamento. Aguarde alguns segundos e tente novamente.";
                }
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", errorMessage,
                    "instance", instanceName,
                    "connectionState", connectionState != null ? connectionState : "unknown",
                    "provider", "baileys"
                ));
            }

            String base64QR = qrCodeData;
            if (!base64QR.startsWith("data:image")) {
                base64QR = "data:image/png;base64," + base64QR;
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "instance", instanceName != null ? instanceName : "unknown",
                "provider", "baileys",
                "qrcode", Map.of("base64", base64QR)
            ));
        }

        return ResponseEntity.ok(Map.of("success", true, "instance", instanceName != null ? instanceName : "unknown", "provider", "baileys"));
    }

    @DeleteMapping("/connection/disconnect/{instanceName}")
    public ResponseEntity<?> disconnectConnection(@PathVariable("instanceName") String instanceName) {
        try {
            if (isEvolutionProvider()) {
                boolean ok = evolutionApiService.disconnectInstance();
                return ResponseEntity.ok(Map.of("success", ok, "provider", "evolution"));
            }
            boolean ok = baileysRestService.disconnectInstance();
            return ResponseEntity.ok(Map.of("success", ok, "provider", "baileys"));
        } catch (Exception e) {
            log.error("Erro ao desconectar: {}", e.getMessage());
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

            log.info("Enviando mensagem do chatbot para número da empresa via {}", whatsappProvider);

            boolean sent;
            if (isEvolutionProvider()) {
                sent = evolutionApiService.sendTextMessage(companyWhatsAppNumber, fullMessage.toString());
            } else {
                sent = baileysRestService.sendTextMessage(companyWhatsAppNumber, fullMessage.toString());
            }

            if (sent) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.", "provider", whatsappProvider));
            }
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Falha ao enviar mensagem. Tente novamente ou entre em contato diretamente.", "provider", whatsappProvider));
        } catch (Exception e) {
            log.error("Erro ao enviar mensagem do chatbot: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Erro interno: " + e.getMessage(), "provider", whatsappProvider));
        }
    }
}
