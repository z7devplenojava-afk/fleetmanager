package com.z7design.secured_guard.controller;

import com.z7design.secured_guard.dto.MessageResponseDTO;
import com.z7design.secured_guard.service.EmailService;
import com.z7design.secured_guard.service.BaileysRestService;
import org.springframework.beans.factory.annotation.Autowired;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/communication-test")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Testes de Comunicação", description = "Endpoints para testar envio de emails e WhatsApp")
public class CommunicationTestController {

    private final EmailService emailService;

    @Autowired(required = false)
    private BaileysRestService baileysRestService;

    @Value("${spring.mail.username:securedguard@z7design.com.br}")
    private String fromEmail;

    @Operation(summary = "Testa envio de email", description = "Envia um email de teste para verificar configuração")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @PostMapping("/email")
    public ResponseEntity<MessageResponseDTO> testEmail(@RequestParam String toEmail) {
        try {
            log.info("🧪 Iniciando teste de envio de email para: {}", toEmail);

            boolean success = emailService.sendPasswordResetEmail(
                    toEmail,
                    "Administrador",
                    "test-token-" + System.currentTimeMillis(),
                    "http://localhost:3000/test"
            );

            if (success) {
                log.info("✅ Email de teste enviado com sucesso para: {}", toEmail);
                return ResponseEntity.ok(MessageResponseDTO.builder()
                        .message("Email de teste enviado com sucesso para: " + toEmail)
                        .success(true)
                        .build());
            } else {
                log.error("❌ Falha ao enviar email de teste");
                return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                        .message("Falha ao enviar email. Verifique as configurações do servidor SMTP.")
                        .success(false)
                        .build());
            }
        } catch (Exception e) {
            log.error("💥 Erro ao testar envio de email: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                    .message("Erro ao enviar email: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Testa envio de email simples", description = "Envia um email de teste simples")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @PostMapping("/email/simple")
    public ResponseEntity<MessageResponseDTO> testSimpleEmail(
            @RequestParam String toEmail,
            @RequestParam(required = false, defaultValue = "Teste do Sistema SecuredGuard") String subject,
            @RequestParam(required = false, defaultValue = "") String message
    ) {
        try {
            log.info("🧪 Enviando email de teste simples para: {}", toEmail);
            log.info("Assunto: {}", subject);
            log.info("Mensagem personalizada: {}", message.isEmpty() ? "Não" : "Sim");
            
            // Validar email de destino
            if (toEmail == null || toEmail.trim().isEmpty() || !toEmail.contains("@")) {
                log.warn("⚠️ Email de destino inválido: {}", toEmail);
                return ResponseEntity.badRequest().body(MessageResponseDTO.builder()
                        .message("Email de destino inválido. Por favor, informe um email válido.")
                        .success(false)
                        .build());
            }
            
            // Usar o novo método sendTestEmail
            boolean sent = emailService.sendTestEmail(toEmail, subject, message);

            if (sent) {
                log.info("✅ Email de teste enviado com sucesso");
                return ResponseEntity.ok(MessageResponseDTO.builder()
                        .message("Email de teste enviado com sucesso para: " + toEmail)
                        .success(true)
                        .build());
            } else {
                log.error("❌ Falha ao enviar email de teste");
                return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                        .message("Falha ao enviar email de teste. Verifique as configurações de SMTP.")
                        .success(false)
                        .build());
            }

        } catch (IllegalStateException e) {
            log.error("⚙️ Configuração inválida: {}", e.getMessage());
            return ResponseEntity.status(503).body(MessageResponseDTO.builder()
                    .message("Serviço de email não configurado: " + e.getMessage())
                    .success(false)
                    .build());
        } catch (RuntimeException e) {
            log.error("💥 Erro de runtime ao enviar email: {}", e.getMessage(), e);
            String errorMsg = e.getMessage();
            if (errorMsg.contains("Authentication") || errorMsg.contains("authentication")) {
                errorMsg = "Falha na autenticação SMTP. Verifique o usuário e senha nas configurações.";
            } else if (errorMsg.contains("Connection") || errorMsg.contains("timeout")) {
                errorMsg = "Não foi possível conectar ao servidor SMTP. Verifique o host e porta.";
            }
            return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                    .message(errorMsg)
                    .success(false)
                    .build());
        } catch (Exception e) {
            log.error("💥 Erro inesperado ao enviar email de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                    .message("Erro ao enviar email: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Verifica configurações de email", description = "Retorna informações sobre as configurações de email")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/email/config")
    public ResponseEntity<Map<String, Object>> getEmailConfig(
            @Value("${spring.mail.host:not-configured}") String mailHost,
            @Value("${spring.mail.port:0}") String mailPort,
            @Value("${spring.mail.username:not-configured}") String mailUsername,
            @Value("${spring.mail.properties.mail.smtp.auth:false}") boolean smtpAuth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:false}") boolean starttlsEnabled
    ) {
        try {
            Map<String, Object> config = new HashMap<>();
            config.put("from", fromEmail);
            config.put("host", mailHost);
            config.put("port", mailPort);
            config.put("username", mailUsername);
            config.put("smtpAuth", smtpAuth);
            config.put("starttls", starttlsEnabled);
            
            // Verificar se está configurado
            boolean isConfigured = !mailHost.equals("not-configured") 
                    && !mailHost.equals("localhost")
                    && !mailUsername.equals("not-configured")
                    && !mailUsername.equals("local@localhost");
            
            config.put("configured", isConfigured);
            config.put("status", isConfigured ? "configured" : "not_configured");
            
            if (!isConfigured) {
                config.put("warning", "SMTP não configurado. Configure as variáveis de ambiente: MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD");
                config.put("hint", "Use Gmail (smtp.gmail.com:587) com App Password ou outro servidor SMTP");
            }

            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("Erro ao obter configurações de email: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @Operation(summary = "Testa envio de WhatsApp", description = "Envia uma mensagem de teste via WhatsApp")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @PostMapping("/whatsapp")
    public ResponseEntity<MessageResponseDTO> testWhatsApp(
            @RequestParam String phoneNumber,
            @RequestParam(required = false, defaultValue = "Teste do Sistema SecuredGuard") String message
    ) {
        try {
            log.info("🧪 Iniciando teste de envio de WhatsApp para: {}", phoneNumber);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
            // 🔒 ENCODING: Remover acentos e emojis para compatibilidade WhatsApp
            String testMessage = message.isEmpty()
                ? String.format("*Teste do Sistema SecuredGuard*\n\nEsta e uma mensagem de teste.\n\nData/Hora: %s\n\nSe voce recebeu esta mensagem, o sistema de WhatsApp esta funcionando corretamente!", timestamp)
                : message;

            // Enviar via WhatsApp usando BaileysRestService
            boolean sent = false;
            if (baileysRestService != null) {
                try {
                    sent = baileysRestService.sendTextMessage(phoneNumber, testMessage);
                    if (sent) {
                        log.info("✅ Mensagem de teste WhatsApp enviada com sucesso");
                        return ResponseEntity.ok(MessageResponseDTO.builder()
                                .message("Mensagem de teste enviada com sucesso para: " + phoneNumber)
                                .success(true)
                                .build());
                    } else {
                        log.warn("⚠️ Falha ao enviar mensagem via WhatsApp");
                        return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                                .message("Falha ao enviar mensagem. Verifique se o serviço WhatsApp está conectado.")
                                .success(false)
                                .build());
                    }
                } catch (Exception e) {
                    log.error("❌ Erro ao enviar via WhatsApp: {}", e.getMessage(), e);
                    return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                            .message("Erro ao enviar via WhatsApp: " + e.getMessage())
                            .success(false)
                            .build());
                }
            } else {
                log.warn("⚠️ BaileysRestService não disponível");
                log.info("📱 Mensagem de teste: {}", testMessage);
                return ResponseEntity.ok(MessageResponseDTO.builder()
                        .message("Serviço WhatsApp não está disponível. Mensagem preparada: " + testMessage.substring(0, 50) + "...")
                        .success(false)
                        .build());
            }

        } catch (Exception e) {
            log.error("💥 Erro ao testar WhatsApp: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(MessageResponseDTO.builder()
                    .message("Erro ao testar WhatsApp: " + e.getMessage())
                    .success(false)
                    .build());
        }
    }

    @Operation(summary = "Verifica status do WhatsApp", description = "Retorna status da conexão com WhatsApp")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/whatsapp/status")
    public ResponseEntity<Map<String, Object>> getWhatsAppStatus() {
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("connected", false);
            status.put("status", "not_configured");
            status.put("message", "Serviço de WhatsApp não configurado. Integração pendente.");

            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Erro ao obter status do WhatsApp: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
