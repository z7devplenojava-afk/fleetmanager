package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.PasswordResetToken;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.PasswordResetTokenRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final BaileysRestService baileysRestService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.url:http://localhost:3000}")
    private String appUrl;

    /**
     * Inicia processo de recuperaÃ§Ã£o de senha
     */
    public boolean requestPasswordReset(String email, String ipAddress, String userAgent) {
        log.info("ðŸ“§ SolicitaÃ§Ã£o de recuperaÃ§Ã£o de senha para: {}", email);

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Por seguranÃ§a, nÃ£o revelar se o email existe ou nÃ£o
            log.warn("âš ï¸ Email nÃ£o encontrado, mas retornando sucesso por seguranÃ§a: {}", email);
            return true;
        }

        User user = userOpt.get();

        // Invalidar tokens antigos
        tokenRepository.expireAllUserTokens(user.getId());

        // Gerar novo token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        PasswordResetToken saved = tokenRepository.save(resetToken);

        // Enviar email com link de reset
        String resetLink = String.format("%s/reset-password?token=%s", appUrl, token);
        boolean sent = sendPasswordResetEmail(email, user.getName(), resetLink, token);

        if (!sent) {
            log.error("âŒ Falha ao enviar email de recuperaÃ§Ã£o para: {}", email);
            saved.markAsExpired();
            tokenRepository.save(saved);
            return false;
        }

        log.info("âœ… Email de recuperaÃ§Ã£o enviado para: {}", email);
        return true;
    }

    /**
     * Valida token de reset
     */
    public boolean validateToken(String token) {
        var tokenOpt = tokenRepository.findValidToken(token, LocalDateTime.now());
        return tokenOpt.isPresent();
    }

    /**
     * Reseta a senha usando o token
     */
    public boolean resetPassword(String token, String newPassword) {
        log.info("ðŸ”‘ Tentando resetar senha com token");

        var tokenOpt = tokenRepository.findValidToken(token, LocalDateTime.now());
        if (tokenOpt.isEmpty()) {
            log.warn("âŒ Token invÃ¡lido ou expirado");
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();
        User user = resetToken.getUser();

        // Validar forÃ§a da senha
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 6 caracteres");
        }

        boolean isCpfDefault = newPassword.matches("^\\d{11}@2025$");
        if (!isCpfDefault && !newPassword.matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*$")) {
            throw new IllegalArgumentException(
                "Senha deve conter pelo menos uma letra maiÃºscula, uma minÃºscula, um nÃºmero e um caractere especial"
            );
        }

        // Atualizar senha
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLastPasswordChange(LocalDateTime.now());
        user.setRequirePasswordChange(false);
        userRepository.save(user);

        // Marcar token como usado
        resetToken.markAsUsed();
        tokenRepository.save(resetToken);

        log.info("âœ… Senha resetada com sucesso para usuÃ¡rio {}", user.getId());
        return true;
    }

    /**
     * Envia email de recuperaÃ§Ã£o de senha
     */
    private boolean sendPasswordResetEmail(String email, String userName, String resetLink, String token) {
        String subject = "ðŸ”‘ RecuperaÃ§Ã£o de Senha - Secured Guard";
        String htmlBody = String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
                        .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; }
                        .token { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>ðŸ”‘ RecuperaÃ§Ã£o de Senha</h1>
                            <p>Secured Guard</p>
                        </div>
                        <div class="content">
                            <p>OlÃ¡, <strong>%s</strong>!</p>
                            <p>VocÃª solicitou a recuperaÃ§Ã£o de senha da sua conta no Secured Guard.</p>
                            <p>Clique no botÃ£o abaixo para criar uma nova senha:</p>
                            <div style="text-align: center;">
                                <a href="%s" class="button">Redefinir Senha</a>
                            </div>
                            <p>Ou copie e cole este link no seu navegador:</p>
                            <div class="token">%s</div>
                            <div class="warning">
                                <p><strong>â° Importante:</strong></p>
                                <ul style="margin: 5px 0;">
                                    <li>Este link expira em <strong>1 hora</strong></li>
                                    <li>Use-o apenas uma vez</li>
                                    <li>NÃ£o compartilhe com ninguÃ©m</li>
                                </ul>
                            </div>
                            <p>Se vocÃª nÃ£o solicitou a recuperaÃ§Ã£o de senha, ignore este email. Sua senha atual permanecerÃ¡ ativa.</p>
                        </div>
                        <div class="footer">
                            <p>Secured Guard &copy; 2025 - Sistema de GestÃ£o de SeguranÃ§a</p>
                            <p>Este Ã© um email automÃ¡tico. NÃ£o responda.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, userName, resetLink, resetLink);

        return emailService.sendEmailWithAttachment(email, subject, htmlBody, null, null);
    }

    /**
     * VersÃ£o melhorada com suporte a WhatsApp
     */
    public Map<String, Object> requestPasswordReset(String contact, String deliveryMethod, String ipAddress, String userAgent) {
        log.info("ðŸ“§ SolicitaÃ§Ã£o de recuperaÃ§Ã£o de senha para: {} via {}", contact, deliveryMethod);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);

        boolean isWhatsapp = "whatsapp".equalsIgnoreCase(deliveryMethod);
        User user;
        if (isWhatsapp) {
            String normalized = contact != null ? contact.replaceAll("[^0-9]", "") : "";
            if (normalized.isEmpty()) {
                log.warn("âš ï¸ Nenhum nÃºmero de WhatsApp informado");
                result.put("success", false);
                result.put("warning", "Informe o nÃºmero de WhatsApp com DDD (somente nÃºmeros).");
                return result;
            }

            var userOpt = userRepository.findByWhatsapp(normalized);
            if (userOpt.isEmpty() && normalized.startsWith("55")) {
                String withoutCountry = normalized.substring(2);
                userOpt = userRepository.findByWhatsapp(withoutCountry);
            } else if (userOpt.isEmpty() && normalized.length() >= 10) {
                userOpt = userRepository.findByWhatsapp("55" + normalized);
            }

            if (userOpt.isEmpty()) {
                log.warn("âš ï¸ Nenhum usuÃ¡rio encontrado com WhatsApp {}", normalized);
                result.put("success", false);
                result.put("warning", "NÃ£o encontramos um cadastro com este nÃºmero de WhatsApp. Verifique o nÃºmero (DDI + DDD) ou escolha a opÃ§Ã£o de email.");
                return result;
            }

            user = userOpt.get();

            if (user.getWhatsapp() == null || user.getWhatsapp().trim().isEmpty()) {
                log.warn("âš ï¸ UsuÃ¡rio {} nÃ£o possui WhatsApp cadastrado", user.getEmail());
                result.put("success", false);
                result.put("warning", "Seu cadastro nÃ£o possui WhatsApp registrado. Use a opÃ§Ã£o de Email ou solicite ao administrador que atualize seus dados de contato.");
                return result;
            }
            if (user.getWhatsappConsent() == null || !user.getWhatsappConsent()) {
                log.warn("âš ï¸ UsuÃ¡rio {} nÃ£o autorizou recebimento via WhatsApp", user.getEmail());
                result.put("success", false);
                result.put("warning", "Seu usuÃ¡rio ainda nÃ£o autorizou o recebimento de notificaÃ§Ãµes via WhatsApp. Use a opÃ§Ã£o de Email ou peÃ§a ao administrador para registrar o consentimento.");
                return result;
            }
        } else {
            var userOpt = userRepository.findByEmail(contact);
            if (userOpt.isEmpty()) {
                // Por seguranÃ§a, nÃ£o revelar se o email existe ou nÃ£o
                log.warn("âš ï¸ Email nÃ£o encontrado, mas retornando sucesso por seguranÃ§a: {}", contact);
                result.put("message", "Se o email estiver cadastrado, vocÃª receberÃ¡ um link para recuperaÃ§Ã£o de senha.");
                return result;
            }
            user = userOpt.get();
        }

        // Invalidar tokens antigos
        tokenRepository.expireAllUserTokens(user.getId());

        // Gerar novo token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .email(user.getEmail())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        PasswordResetToken saved = tokenRepository.save(resetToken);

        // Enviar link de reset
        String resetLink = String.format("%s/reset-password?token=%s", appUrl, token);
        boolean sent = false;

        if (isWhatsapp) {
            sent = sendPasswordResetWhatsApp(user.getWhatsapp(), user.getName(), resetLink);
            if (sent) {
                log.info("âœ… Mensagem de recuperaÃ§Ã£o enviada via WhatsApp para: {}", user.getWhatsapp());
            }
        } else {
            sent = sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink, token);
            if (sent) {
                log.info("âœ… Email de recuperaÃ§Ã£o enviado para: {}", user.getEmail());
            }
        }

        if (!sent) {
            String destination = isWhatsapp ? user.getWhatsapp() : user.getEmail();
            log.error("âŒ Falha ao enviar recuperaÃ§Ã£o via {} para: {}", deliveryMethod, destination);
            saved.markAsExpired();
            tokenRepository.save(saved);
            result.put("success", false);
            result.put("message", "Erro ao enviar link de recuperaÃ§Ã£o. Tente novamente.");
            return result;
        }

        result.put("message", "Link de recuperaÃ§Ã£o enviado com sucesso!");
        return result;
    }

    /**
     * Envia link de recuperaÃ§Ã£o via WhatsApp
     */
    private boolean sendPasswordResetWhatsApp(String whatsapp, String userName, String resetLink) {
        if (baileysRestService == null) {
            log.error("âŒ BaileysRestService nÃ£o disponÃ­vel!");
            return false;
        }

        String message = String.format(
                "ðŸ”‘ *RecuperaÃ§Ã£o de Senha - Secured Guard*\n\n" +
                "OlÃ¡, *%s*!\n\n" +
                "VocÃª solicitou a recuperaÃ§Ã£o de senha da sua conta.\n\n" +
                "Clique no link abaixo para criar uma nova senha:\n" +
                "%s\n\n" +
                "â° *Importante:*\n" +
                "â€¢ Este link expira em 1 hora\n" +
                "â€¢ Use-o apenas uma vez\n" +
                "â€¢ NÃ£o compartilhe com ninguÃ©m\n\n" +
                "Se vocÃª nÃ£o solicitou a recuperaÃ§Ã£o de senha, ignore esta mensagem.\n\n" +
                "_Secured Guard Â© 2025_",
                userName, resetLink);

        try {
            // Normalizar nÃºmero de telefone
            String normalized = whatsapp.replaceAll("[^0-9]", "");
            if (!normalized.startsWith("55")) {
                normalized = "55" + normalized;
            }
            
            return baileysRestService.sendTextMessage(normalized, message);
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar WhatsApp de recuperaÃ§Ã£o: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Limpa tokens expirados (executar via scheduler)
     */
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        tokenRepository.deleteExpiredTokens(cutoff);
        log.info("ðŸ§¹ Tokens de reset expirados removidos");
    }
}


