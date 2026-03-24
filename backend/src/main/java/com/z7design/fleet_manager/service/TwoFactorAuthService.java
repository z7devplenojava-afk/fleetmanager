package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.TwoFactorCode;
import com.z7design.fleet_manager.model.TwoFactorCode.DeliveryChannel;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.TwoFactorCodeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TwoFactorAuthService {

    private final TwoFactorCodeRepository codeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Autowired(required = false)
    private BaileysRestService baileysRestService;

    private static final Random RANDOM = new Random();

    /**
     * Gera e envia cÃ³digo 2FA
     */
    public TwoFactorCode generateAndSendCode(
        UUID userId,
        DeliveryChannel channel,
        String ipAddress,
        String userAgent
    ) {
        log.info("ðŸ” Gerando cÃ³digo 2FA para usuÃ¡rio {} via {}", userId, channel);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        // Invalidar cÃ³digos antigos
        codeRepository.expireAllUserCodes(userId);

        // Gerar cÃ³digo de 6 dÃ­gitos
        String code = generateCode();

        // Determinar destino
        String destination;
        if (channel == DeliveryChannel.WHATSAPP) {
            destination = user.getTwoFactorWhatsapp() != null 
                ? user.getTwoFactorWhatsapp() 
                : user.getWhatsapp();
            if (destination == null || destination.trim().isEmpty()) {
                throw new RuntimeException("UsuÃ¡rio nÃ£o possui WhatsApp cadastrado");
            }
        } else if (channel == DeliveryChannel.EMAIL) {
            destination = user.getEmail();
        } else {
            throw new RuntimeException("Canal de entrega nÃ£o suportado: " + channel);
        }

        // Criar registro
        TwoFactorCode twoFactorCode = TwoFactorCode.builder()
                .user(user)
                .code(code)
                .deliveryChannel(channel)
                .destination(destination)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        TwoFactorCode saved = codeRepository.save(twoFactorCode);

        // Enviar cÃ³digo
        boolean sent = sendCode(code, destination, channel, user.getName());
        
        if (!sent) {
            log.error("âŒ Falha ao enviar cÃ³digo 2FA para {}", destination);
            saved.markAsExpired();
            codeRepository.save(saved);
            throw new RuntimeException("Falha ao enviar cÃ³digo de verificaÃ§Ã£o");
        }

        log.info("âœ… CÃ³digo 2FA enviado para {} via {}", destination, channel);
        return saved;
    }

    /**
     * Valida cÃ³digo 2FA
     */
    public boolean validateCode(UUID userId, String code) {
        log.info("ðŸ” Validando cÃ³digo 2FA para usuÃ¡rio {}", userId);

        var codeOpt = codeRepository.findValidCode(userId, code, LocalDateTime.now());

        if (codeOpt.isEmpty()) {
            log.warn("âŒ CÃ³digo 2FA invÃ¡lido ou expirado para usuÃ¡rio {}", userId);
            // Incrementar tentativas em todos os cÃ³digos recentes
            var latest = codeRepository.findLatestByUserId(userId);
            latest.ifPresent(twoFactorCode -> {
                twoFactorCode.incrementAttempts();
                codeRepository.save(twoFactorCode);
            });
            return false;
        }

        TwoFactorCode twoFactorCode = codeOpt.get();
        twoFactorCode.markAsUsed();
        codeRepository.save(twoFactorCode);

        log.info("âœ… CÃ³digo 2FA validado com sucesso para usuÃ¡rio {}", userId);
        return true;
    }

    /**
     * Habilita 2FA para um usuÃ¡rio
     */
    public void enable2FA(UUID userId, String whatsappNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        user.setTwoFactorEnabled(true);
        user.setTwoFactorWhatsapp(whatsappNumber);
        userRepository.save(user);

        log.info("âœ… 2FA habilitado para usuÃ¡rio {}", userId);
    }

    /**
     * Desabilita 2FA para um usuÃ¡rio
     */
    public void disable2FA(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));

        user.setTwoFactorEnabled(false);
        userRepository.save(user);

        log.info("ðŸ”“ 2FA desabilitado para usuÃ¡rio {}", userId);
    }

    /**
     * Verifica se usuÃ¡rio tem 2FA habilitado
     */
    public boolean is2FAEnabled(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        return user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled();
    }

    /**
     * Gera cÃ³digo aleatÃ³rio de 6 dÃ­gitos
     */
    private String generateCode() {
        int code = RANDOM.nextInt(900000) + 100000; // Gera entre 100000 e 999999
        return String.valueOf(code);
    }

    /**
     * Envia cÃ³digo via canal especificado
     */
    private boolean sendCode(String code, String destination, DeliveryChannel channel, String userName) {
        try {
            if (channel == DeliveryChannel.WHATSAPP) {
                return sendViaWhatsApp(code, destination, userName);
            } else if (channel == DeliveryChannel.EMAIL) {
                return sendViaEmail(code, destination, userName);
            }
            return false;
        } catch (Exception e) {
            log.error("Erro ao enviar cÃ³digo 2FA: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Envia cÃ³digo via WhatsApp
     */
    private boolean sendViaWhatsApp(String code, String phoneNumber, String userName) {
        if (baileysRestService == null) {
            log.error("âŒ BaileysRestService nÃ£o disponÃ­vel!");
            return false;
        }

        String message = String.format(
                "ðŸ” *Secured Guard - CÃ³digo de VerificaÃ§Ã£o*\n\n" +
                "OlÃ¡, %s!\n\n" +
                "Seu cÃ³digo de verificaÃ§Ã£o Ã©:\n\n" +
                "*%s*\n\n" +
                "â° Este cÃ³digo expira em 5 minutos.\n" +
                "ðŸ”’ NÃ£o compartilhe este cÃ³digo com ninguÃ©m.\n\n" +
                "Se vocÃª nÃ£o solicitou este cÃ³digo, ignore esta mensagem.",
                userName, code
        );

        return baileysRestService.sendTextMessage(phoneNumber, message);
    }

    /**
     * Envia cÃ³digo via Email
     */
    private boolean sendViaEmail(String code, String email, String userName) {
        String subject = "ðŸ” CÃ³digo de VerificaÃ§Ã£o - Secured Guard";
        String htmlBody = createEmailBody(code, userName);

        return emailService.sendEmailWithAttachment(email, subject, htmlBody, null, null);
    }

    /**
     * Cria corpo do email HTML
     */
    private String createEmailBody(String code, String userName) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
                        .code { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>ðŸ” CÃ³digo de VerificaÃ§Ã£o</h1>
                            <p>AutenticaÃ§Ã£o de Dois Fatores</p>
                        </div>
                        <div class="content">
                            <p>OlÃ¡, <strong>%s</strong>!</p>
                            <p>VocÃª solicitou um cÃ³digo de verificaÃ§Ã£o para acessar o Secured Guard.</p>
                            <div class="code">%s</div>
                            <div class="warning">
                                <p><strong>â° Importante:</strong></p>
                                <ul style="margin: 5px 0;">
                                    <li>Este cÃ³digo expira em <strong>5 minutos</strong></li>
                                    <li>Use-o apenas uma vez</li>
                                    <li>NÃ£o compartilhe com ninguÃ©m</li>
                                </ul>
                            </div>
                            <p>Se vocÃª nÃ£o solicitou este cÃ³digo, ignore este email e considere alterar sua senha.</p>
                        </div>
                        <div class="footer">
                            <p>Secured Guard &copy; 2025 - Sistema de GestÃ£o de SeguranÃ§a</p>
                            <p>Este Ã© um email automÃ¡tico. NÃ£o responda.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, userName, code);
    }

    /**
     * Limpa cÃ³digos expirados (executar via scheduler)
     */
    public void cleanupExpiredCodes() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        codeRepository.deleteExpiredCodes(cutoff);
        log.info("ðŸ§¹ CÃ³digos 2FA expirados removidos");
    }
}


