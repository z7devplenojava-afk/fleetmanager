package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email Test", description = "Endpoints para testar envio de emails")
public class EmailTestController {

    private final EmailService emailService;
    private final Environment environment;
    
    @Value("${spring.mail.host:mail.z7design.com.br}")
    private String mailHost;
    
    @Value("${spring.mail.port:587}")
    private String mailPort;

    @RequestMapping(value = "/test", method = {RequestMethod.GET, RequestMethod.POST})
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    @Operation(summary = "Testar envio de email", description = "Envia um email de teste para verificar configuraÃ§Ã£o SMTP")
    public ResponseEntity<?> testEmail(@RequestParam(value = "toEmail", required = false) String toEmail) {
        try {
            if (toEmail == null || toEmail.trim().isEmpty()) {
                log.warn("âš ï¸ Email de destino nÃ£o fornecido");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email de destino Ã© obrigatÃ³rio",
                    "error", "MISSING_EMAIL_PARAMETER"
                ));
            }
            
            String email = toEmail.trim();
            log.info("ðŸ“§ Testando envio de email para: {}", email);
            
            // Log detalhado da configuraÃ§Ã£o
            String mailHostEnv = System.getenv("MAIL_HOST");
            String mailPortEnv = System.getenv("MAIL_PORT");
            String mailUsernameEnv = System.getenv("MAIL_USERNAME");
            String mailPasswordEnv = System.getenv("MAIL_PASSWORD");
            String mailPasswordProperty = environment.getProperty("spring.mail.password");
            // Verificar se senha estÃ¡ configurada (variÃ¡vel de ambiente OU propriedade do Spring)
            boolean hasPassword = (mailPasswordEnv != null && !mailPasswordEnv.isEmpty()) 
                                || (mailPasswordProperty != null && !mailPasswordProperty.isEmpty());
            
            log.info("ðŸ“§ ConfiguraÃ§Ã£o SMTP - Host: {} (env: {}), Port: {} (env: {})", 
                    mailHost, mailHostEnv, mailPort, mailPortEnv);
            log.info("ðŸ“§ Username: {} (env: {}), Password configurado: {} (env: {}, property: {})", 
                    environment.getProperty("spring.mail.username"), mailUsernameEnv, hasPassword,
                    mailPasswordEnv != null ? "SIM" : "NÃƒO",
                    mailPasswordProperty != null && !mailPasswordProperty.isEmpty() ? "SIM" : "NÃƒO");
            log.info("ðŸ“§ SSL: {}, STARTTLS: {}", 
                    environment.getProperty("spring.mail.properties.mail.smtp.ssl.enable", "false"),
                    environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "false"));
            log.info("ðŸ“§ Perfil ativo: {}", String.join(",", environment.getActiveProfiles()));
            
            boolean success = emailService.sendEmailWithAttachment(
                email,
                "ðŸ§ª Teste de Email - Secured Guard",
                createTestEmailBody(),
                null, // Sem anexo
                null
            );
            
            if (success) {
                log.info("âœ… Email de teste enviado com sucesso para: {}", email);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email enviado com sucesso para " + email,
                    "from", "securedguard@z7design.com.br",
                    "to", email
                ));
            } else {
                log.error("âŒ Falha ao enviar email de teste para: {}", email);
                return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Falha ao enviar email. Verifique os logs do backend para mais detalhes.",
                    "to", email,
                    "error", "EMAIL_SEND_FAILED",
                    "hint", "Verifique se o servidor SMTP estÃ¡ acessÃ­vel e as credenciais estÃ£o corretas"
                ));
            }
            
        } catch (org.springframework.mail.MailException e) {
            log.error("ðŸ’¥ Erro de email ao testar envio: {}", e.getMessage(), e);
            Throwable cause = e.getCause();
            String errorMessage = e.getMessage();
            String errorType = "MAIL_EXCEPTION";
            String suggestion = "";
            
            if (cause != null) {
                if (cause instanceof jakarta.mail.AuthenticationFailedException) {
                    errorType = "AUTHENTICATION_FAILED";
                    errorMessage = "Falha na autenticaÃ§Ã£o SMTP. Verifique usuÃ¡rio e senha.";
                    suggestion = "Verifique se as credenciais SMTP estÃ£o corretas nas variÃ¡veis de ambiente MAIL_USERNAME e MAIL_PASSWORD.";
                } else if (cause instanceof jakarta.mail.MessagingException) {
                    errorType = "MESSAGING_EXCEPTION";
                    String causeMessage = cause.getMessage() != null ? cause.getMessage() : "";
                    if (causeMessage.contains("Could not connect") || causeMessage.contains("Couldn't connect")) {
                        errorMessage = "NÃ£o foi possÃ­vel conectar ao servidor SMTP " + mailHost + ":" + mailPort;
                        suggestion = "O servidor SMTP nÃ£o estÃ¡ acessÃ­vel. Verifique:\n" +
                                    "1. Firewall/antivÃ­rus nÃ£o estÃ¡ bloqueando a porta " + mailPort + "\n" +
                                    "2. Servidor SMTP estÃ¡ online e acessÃ­vel\n" +
                                    "3. Para desenvolvimento local, considere usar Gmail SMTP (smtp.gmail.com:587) ou Mailtrap (smtp.mailtrap.io:2525)";
                    } else if (causeMessage.contains("timeout") || causeMessage.contains("Connection timed out")) {
                        errorMessage = "Timeout ao conectar ao servidor SMTP " + mailHost + ":" + mailPort;
                        suggestion = "A conexÃ£o com o servidor SMTP expirou apÃ³s 60 segundos. PossÃ­veis causas:\n" +
                                    "1. Servidor SMTP nÃ£o estÃ¡ acessÃ­vel da sua rede\n" +
                                    "2. Firewall bloqueando a porta " + mailPort + "\n" +
                                    "3. Para desenvolvimento local, use um servidor SMTP alternativo (Gmail ou Mailtrap)";
                    } else {
                        errorMessage = "Erro ao enviar email: " + causeMessage;
                        suggestion = "Verifique a configuraÃ§Ã£o SMTP e os logs do backend para mais detalhes.";
                    }
                }
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", errorMessage,
                "to", toEmail != null ? toEmail : "N/A",
                "error", errorType,
                "details", cause != null ? cause.getMessage() : e.getMessage(),
                "suggestion", suggestion,
                "smtp_host", mailHost,
                "smtp_port", mailPort
            ));
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro inesperado ao testar envio de email: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erro inesperado: " + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido"),
                "to", toEmail != null ? toEmail : "N/A",
                "error", e.getClass().getSimpleName(),
                "details", e.toString()
            ));
        }
    }

    @GetMapping("/config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Ver configuraÃ§Ã£o de email", description = "Retorna configuraÃ§Ã£o atual de email (sem senha)")
    public ResponseEntity<?> getEmailConfig() {
        // PRIORIDADE 1: VariÃ¡veis de ambiente (tÃªm precedÃªncia absoluta)
        String mailHostEnv = System.getenv("MAIL_HOST");
        String mailPortEnv = System.getenv("MAIL_PORT");
        String mailUsernameEnv = System.getenv("MAIL_USERNAME");
        String mailSslEnableEnv = System.getenv("MAIL_SSL_ENABLE");
        String mailStarttlsEnableEnv = System.getenv("MAIL_STARTTLS_ENABLE");
        
        // PRIORIDADE 2: Propriedades do Spring Environment (do perfil ativo)
        String host = environment.getProperty("spring.mail.host", "nÃ£o configurado");
        String port = environment.getProperty("spring.mail.port", "nÃ£o configurado");
        String username = environment.getProperty("spring.mail.username", "nÃ£o configurado");
        String sslEnabled = environment.getProperty("spring.mail.properties.mail.smtp.ssl.enable", "false");
        String starttlsEnabled = environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "false");
        
        // Obter perfil ativo
        String[] activeProfiles = environment.getActiveProfiles();
        String activeProfile = activeProfiles.length > 0 ? activeProfiles[0] : "default";
        
        // Usar variÃ¡veis de ambiente se disponÃ­veis (tÃªm prioridade absoluta)
        if (mailHostEnv != null && !mailHostEnv.trim().isEmpty()) {
            host = mailHostEnv.trim();
            log.info("ðŸ“§ Usando MAIL_HOST da variÃ¡vel de ambiente: {}", host);
        }
        if (mailPortEnv != null && !mailPortEnv.trim().isEmpty()) {
            port = mailPortEnv.trim();
            log.info("ðŸ“§ Usando MAIL_PORT da variÃ¡vel de ambiente: {}", port);
        }
        if (mailUsernameEnv != null && !mailUsernameEnv.trim().isEmpty()) {
            username = mailUsernameEnv.trim();
            log.info("ðŸ“§ Usando MAIL_USERNAME da variÃ¡vel de ambiente: {}", username);
        }
        if (mailSslEnableEnv != null && !mailSslEnableEnv.trim().isEmpty()) {
            sslEnabled = mailSslEnableEnv.trim();
            log.info("ðŸ“§ Usando MAIL_SSL_ENABLE da variÃ¡vel de ambiente: {}", sslEnabled);
        }
        if (mailStarttlsEnableEnv != null && !mailStarttlsEnableEnv.trim().isEmpty()) {
            starttlsEnabled = mailStarttlsEnableEnv.trim();
            log.info("ðŸ“§ Usando MAIL_STARTTLS_ENABLE da variÃ¡vel de ambiente: {}", starttlsEnabled);
        }
        
        log.info("ðŸ“§ ConfiguraÃ§Ã£o de email solicitada - Perfil ativo: {}", activeProfile);
        log.info("ðŸ“§ Host: {} (env: {}), Port: {} (env: {}), Username: {} (env: {})", 
                host, mailHostEnv, port, mailPortEnv, username, mailUsernameEnv);
        log.info("ðŸ“§ SSL: {} (env: {}), STARTTLS: {} (env: {})", 
                sslEnabled, mailSslEnableEnv, starttlsEnabled, mailStarttlsEnableEnv);
        
        // Determinar se SSL ou STARTTLS estÃ¡ habilitado
        boolean ssl = "true".equalsIgnoreCase(sslEnabled);
        boolean starttls = "true".equalsIgnoreCase(starttlsEnabled);
        String sslTlsStatus = ssl ? "Habilitado (SSL)" : (starttls ? "Habilitado (STARTTLS)" : "Desabilitado");
        
        // Determinar fonte da configuraÃ§Ã£o
        String source = "properties";
        if (mailHostEnv != null && !mailHostEnv.trim().isEmpty()) {
            source = "environment";
        }
        
        return ResponseEntity.ok(Map.of(
            "host", host,
            "port", port,
            "username", username,
            "ssl", sslEnabled,
            "starttls", starttlsEnabled,
            "sslTlsStatus", sslTlsStatus,
            "activeProfile", activeProfile,
            "configured", true,
            "source", source
        ));
    }

    private String createTestEmailBody() {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                    .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .success { color: #16a34a; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ðŸ§ª Teste de Email</h1>
                        <p>Secured Guard - Ambiente CI</p>
                    </div>
                    <div class="content">
                        <p class="success">âœ… ConfiguraÃ§Ã£o de email funcionando corretamente!</p>
                        <p><strong>Servidor SMTP:</strong> mail.z7design.com.br</p>
                        <p><strong>Porta:</strong> 465 (SSL/TLS)</p>
                        <p><strong>Remetente:</strong> securedguard@z7design.com.br</p>
                        <p><strong>Status:</strong> Email enviado com sucesso</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                        <p><strong>PrÃ³ximos passos:</strong></p>
                        <ul>
                            <li>âœ… ConfiguraÃ§Ã£o SMTP validada</li>
                            <li>âœ… ConexÃ£o SSL/TLS estabelecida</li>
                            <li>âœ… Sistema pronto para envio de documentos</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>Secured Guard &copy; 2025 - Sistema de GestÃ£o de SeguranÃ§a</p>
                        <p>Este Ã© um email automÃ¡tico de teste. NÃ£o responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }
}


