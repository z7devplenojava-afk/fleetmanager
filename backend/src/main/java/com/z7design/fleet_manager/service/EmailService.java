package com.z7design.fleet_manager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import org.springframework.mail.MailException;
import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:securedguard@z7design.com.br}")
    private String fromEmail;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    /**
     * Envia documento unificado por email
     */
    public boolean sendUnifiedDocument(String toEmail, String employeeName, String month, String year, String filePath) {
        try {
            log.info("ðŸ“§ Enviando documento unificado por email para: {}", toEmail);
            log.info("FuncionÃ¡rio: {} - {}/{}", employeeName, month, year);
            log.info("Arquivo: {}", filePath);

            // Verificar se arquivo existe
            File file = new File(filePath);
            if (!file.exists()) {
                log.error("âŒ Arquivo nÃ£o encontrado: {}", filePath);
                return false;
            }

            // Criar email simples (sem anexo por enquanto)
            SimpleMailMessage emailMessage = new SimpleMailMessage();
            emailMessage.setFrom(fromEmail);
            emailMessage.setTo(toEmail);
            emailMessage.setSubject(String.format("Documento Unificado - %s - %s/%s", employeeName, month, year));
            
            // Corpo do email
            String emailBody = createEmailBody(employeeName, month, year);
            emailMessage.setText(emailBody);

            // Enviar email
            mailSender.send(emailMessage);
            log.info("âœ… Email enviado com sucesso para: {}", toEmail);
            log.info("ðŸ“Ž Arquivo: {} ({} bytes) - Anexo nÃ£o suportado nesta versÃ£o", file.getName(), file.length());
            return true;

        } catch (MailException e) {
            Throwable cause = e.getCause();
            if (cause instanceof jakarta.mail.AuthenticationFailedException) {
                log.error("âŒ Erro de autenticaÃ§Ã£o ao enviar email para {}: {}", toEmail, cause.getMessage());
                log.error("Verifique as credenciais SMTP (usuÃ¡rio e senha) nas configuraÃ§Ãµes");
            } else if (cause instanceof jakarta.mail.MessagingException) {
                log.error("âŒ Erro de mensagem ao enviar email para {}: {}", toEmail, cause.getMessage());
                log.error("Causa: {}", cause.getCause() != null ? cause.getCause().getMessage() : "Desconhecida");
                if (cause.getMessage() != null && cause.getMessage().contains("Could not connect to SMTP host")) {
                    log.error("âš ï¸ NÃ£o foi possÃ­vel conectar ao servidor SMTP. Verifique:");
                    log.error("   - Host e porta estÃ£o corretos?");
                    log.error("   - Firewall/antivÃ­rus estÃ¡ bloqueando?");
                    log.error("   - Servidor SMTP estÃ¡ acessÃ­vel?");
                }
            } else {
                log.error("ðŸ’¥ Erro ao enviar email para {}: {}", toEmail, e.getMessage(), e);
                if (cause != null) {
                    log.error("Causa raiz: {}", cause.getMessage());
                }
            }
            return false;
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro inesperado ao enviar email para {}: {}", toEmail, e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Causa raiz: {}", e.getCause().getMessage());
            }
            return false;
        }
    }

    /**
     * Envia email com anexo em bytes (PDF)
     */
    public boolean sendEmailWithAttachment(String toEmail, String subject, String htmlBody, byte[] attachmentBytes, String attachmentFileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Se nÃ£o hÃ¡ anexo, nÃ£o precisa de multipart
            boolean hasAttachment = attachmentBytes != null && attachmentBytes.length > 0 && attachmentFileName != null && !attachmentFileName.trim().isEmpty();
            MimeMessageHelper helper = new MimeMessageHelper(message, hasAttachment, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            // Adicionar anexo apenas se fornecido
            if (hasAttachment && attachmentBytes != null && attachmentFileName != null) {
                helper.addAttachment(attachmentFileName, new org.springframework.core.io.ByteArrayResource(attachmentBytes));
                log.info("âœ… Email com anexo enviado para {} ({} bytes)", toEmail, attachmentBytes.length);
            } else {
                log.info("âœ… Email enviado para {} (sem anexo)", toEmail);
            }
            
            mailSender.send(message);
            return true;
        } catch (MailException e) {
            Throwable cause = e.getCause();
            if (cause instanceof jakarta.mail.AuthenticationFailedException) {
                log.error("âŒ Erro de autenticaÃ§Ã£o ao enviar email com anexo para {}: {}", toEmail, cause.getMessage());
                log.error("Verifique as credenciais SMTP (usuÃ¡rio e senha) nas configuraÃ§Ãµes");
            } else if (cause instanceof jakarta.mail.MessagingException) {
                log.error("âŒ Erro de mensagem ao enviar email com anexo para {}: {}", toEmail, cause.getMessage());
                log.error("Causa: {}", cause.getCause() != null ? cause.getCause().getMessage() : "Desconhecida");
                String causeMessage = cause.getMessage() != null ? cause.getMessage() : "";
                if (causeMessage.contains("Could not connect") || causeMessage.contains("Couldn't connect")) {
                    log.error("âš ï¸ NÃ£o foi possÃ­vel conectar ao servidor SMTP. Verifique:");
                    log.error("   - Host e porta estÃ£o corretos?");
                    log.error("   - Firewall/antivÃ­rus estÃ¡ bloqueando?");
                    log.error("   - Servidor SMTP estÃ¡ acessÃ­vel?");
                } else if (causeMessage.contains("timeout") || causeMessage.contains("Connection timed out")) {
                    log.error("âš ï¸ Timeout ao conectar ao servidor SMTP:");
                    log.error("   - A conexÃ£o expirou apÃ³s 60 segundos");
                    log.error("   - Servidor pode estar inacessÃ­vel da sua rede");
                    log.error("   - Verifique firewall e conectividade de rede");
                    log.error("   - Para desenvolvimento local, considere usar Gmail SMTP ou Mailtrap");
                }
            } else {
                log.error("ðŸ’¥ Erro ao enviar email com anexo para {}: {}", toEmail, e.getMessage(), e);
                if (cause != null) {
                    log.error("Causa raiz: {}", cause.getMessage());
                }
            }
            return false;
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao enviar email com anexo para {}: {}", toEmail, e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Causa raiz: {}", e.getCause().getMessage());
            }
            return false;
        }
    }

    /**
     * Cria corpo do email em HTML
     */
    private String createEmailBody(String employeeName, String month, String year) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { background: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; }
                    .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ðŸ¢ SecuredGuard</h1>
                    <h2>Documento Unificado</h2>
                </div>
                
                <div class="content">
                    <h3>OlÃ¡!</h3>
                    <p>O documento unificado para <strong>%s</strong> referente ao perÃ­odo <strong>%s/%s</strong> foi gerado com sucesso.</p>
                    
                    <p>Este documento contÃ©m:</p>
                    <ul>
                        <li>ðŸ“„ <strong>Holerite</strong> com informaÃ§Ãµes salariais</li>
                        <li>ðŸ’° <strong>Recibo de Pagamento</strong> com comprovante bancÃ¡rio</li>
                    </ul>
                    
                    <p>O arquivo estÃ¡ anexado a este email para sua conveniÃªncia.</p>
                    
                    <p style="margin-top: 30px;">
                        <strong>InformaÃ§Ãµes importantes:</strong>
                    </p>
                    <ul>
                        <li>Guarde este documento para seus registros</li>
                        <li>Use para declaraÃ§Ã£o de imposto de renda</li>
                        <li>Comprovante oficial de recebimento</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Este Ã© um email automÃ¡tico do sistema SecuredGuard.</p>
                    <p>Em caso de dÃºvidas, entre em contato com o departamento de RH.</p>
                    <p>Â© 2025 SecuredGuard - Todos os direitos reservados</p>
                </div>
            </body>
            </html>
            """, employeeName, month, year);
    }

    /**
     * Testa configuraÃ§Ã£o de email
     */
    public boolean testEmailConfiguration() {
        try {
            log.info("ðŸ§ª Testando configuraÃ§Ã£o de email...");
            log.info("ðŸ“§ Host: {}", mailSender);
            log.info("ðŸ“§ From: {}", fromEmail);
            
            SimpleMailMessage testMessage = new SimpleMailMessage();
            testMessage.setFrom(fromEmail);
            testMessage.setTo("test@example.com");
            testMessage.setSubject("Teste de ConfiguraÃ§Ã£o - SecuredGuard");
            testMessage.setText("Este Ã© um email de teste para verificar a configuraÃ§Ã£o do sistema.");
            
            mailSender.send(testMessage);
            log.info("âœ… ConfiguraÃ§Ã£o de email funcionando");
            return true;
            
        } catch (MailException e) {
            Throwable cause = e.getCause();
            if (cause instanceof jakarta.mail.AuthenticationFailedException) {
                log.error("âŒ Erro de autenticaÃ§Ã£o na configuraÃ§Ã£o de email: {}", cause.getMessage());
                log.error("Verifique as credenciais SMTP (usuÃ¡rio e senha) nas configuraÃ§Ãµes");
            } else if (cause instanceof jakarta.mail.MessagingException) {
                log.error("âŒ Erro de mensagem na configuraÃ§Ã£o de email: {}", cause.getMessage());
                log.error("Causa: {}", cause.getCause() != null ? cause.getCause().getMessage() : "Desconhecida");
                String causeMessage = cause.getMessage() != null ? cause.getMessage() : "";
                if (causeMessage.contains("Could not connect") || causeMessage.contains("Couldn't connect")) {
                    log.error("âš ï¸ NÃ£o foi possÃ­vel conectar ao servidor SMTP. Verifique:");
                    log.error("   - Host e porta estÃ£o corretos?");
                    log.error("   - Firewall/antivÃ­rus estÃ¡ bloqueando?");
                    log.error("   - Servidor SMTP estÃ¡ acessÃ­vel?");
                } else if (causeMessage.contains("timeout") || causeMessage.contains("Connection timed out")) {
                    log.error("âš ï¸ Timeout ao conectar ao servidor SMTP:");
                    log.error("   - A conexÃ£o expirou apÃ³s 60 segundos");
                    log.error("   - Servidor pode estar inacessÃ­vel da sua rede");
                    log.error("   - Verifique firewall e conectividade de rede");
                    log.error("   - Para desenvolvimento local, considere usar Gmail SMTP ou Mailtrap");
                }
            } else {
                log.error("âŒ Erro na configuraÃ§Ã£o de email: {}", e.getMessage(), e);
                if (cause != null) {
                    log.error("Causa raiz: {}", cause.getMessage());
                }
            }
            return false;
        } catch (Exception e) {
            log.error("âŒ Erro na configuraÃ§Ã£o de email: {}", e.getMessage(), e);
            if (e.getCause() != null) {
                log.error("Causa raiz: {}", e.getCause().getMessage());
            }
            return false;
        }
    }
} 
