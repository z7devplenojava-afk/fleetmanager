package com.z7design.fleet_manager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    @Value("${app.whatsapp.api.url:https://api.whatsapp.com/send}")
    private String whatsappApiUrl;

    @Value("${app.whatsapp.default.message:OlÃ¡! Segue seu documento unificado anexado.}")
    private String defaultMessage;

    /**
     * Gera link do WhatsApp para envio de documento
     */
    public String generateWhatsAppLink(String phoneNumber, String employeeName, String month, String year) {
        try {
            log.info("ðŸ“± Gerando link do WhatsApp para: {}", phoneNumber);
            log.info("FuncionÃ¡rio: {} - {}/{}", employeeName, month, year);

            // Formatar nÃºmero de telefone (remover caracteres especiais)
            String cleanPhone = phoneNumber.replaceAll("[^0-9+]", "");
            
            // Adicionar cÃ³digo do paÃ­s se nÃ£o tiver
            if (!cleanPhone.startsWith("+")) {
                cleanPhone = "+55" + cleanPhone; // Brasil por padrÃ£o
            }

            // Criar mensagem personalizada
            String message = String.format("""
                ðŸ¢ *SecuredGuard*
                
                OlÃ¡! Seu documento unificado foi gerado com sucesso!
                
                ðŸ‘¤ *FuncionÃ¡rio:* %s
                ðŸ“… *PerÃ­odo:* %s/%s
                
                ðŸ“„ Este documento contÃ©m:
                â€¢ Holerite com informaÃ§Ãµes salariais
                â€¢ Recibo de pagamento bancÃ¡rio
                
                ðŸ’¾ O arquivo estÃ¡ disponÃ­vel para download no sistema.
                
                Em caso de dÃºvidas, entre em contato com o RH.
                """, employeeName, month, year);

            // Codificar mensagem para URL
            String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
            
            // Gerar link do WhatsApp
            String whatsappLink = String.format("%s?phone=%s&text=%s", 
                whatsappApiUrl, cleanPhone, encodedMessage);

            log.info("âœ… Link do WhatsApp gerado: {}", whatsappLink);
            return whatsappLink;

        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao gerar link do WhatsApp: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Gera link do WhatsApp com mensagem personalizada
     */
    public String generateWhatsAppLinkWithCustomMessage(String phoneNumber, String customMessage) {
        try {
            log.info("ðŸ“± Gerando link do WhatsApp com mensagem personalizada para: {}", phoneNumber);

            // Formatar nÃºmero de telefone
            String cleanPhone = phoneNumber.replaceAll("[^0-9+]", "");
            if (!cleanPhone.startsWith("+")) {
                cleanPhone = "+55" + cleanPhone;
            }

            // Codificar mensagem
            String encodedMessage = URLEncoder.encode(customMessage, StandardCharsets.UTF_8);
            
            // Gerar link
            String whatsappLink = String.format("%s?phone=%s&text=%s", 
                whatsappApiUrl, cleanPhone, encodedMessage);

            log.info("âœ… Link do WhatsApp com mensagem personalizada gerado");
            return whatsappLink;

        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao gerar link do WhatsApp com mensagem personalizada: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Valida nÃºmero de telefone
     */
    public boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }
        
        // Remover caracteres especiais e verificar se tem pelo menos 10 dÃ­gitos
        String cleanPhone = phoneNumber.replaceAll("[^0-9+]", "");
        return cleanPhone.length() >= 10;
    }

    /**
     * Formata nÃºmero de telefone para exibiÃ§Ã£o
     */
    public String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return "";
        }
        
        String cleanPhone = phoneNumber.replaceAll("[^0-9+]", "");
        
        // Formatar nÃºmero brasileiro
        if (cleanPhone.startsWith("+55")) {
            cleanPhone = cleanPhone.substring(3); // Remove +55
        }
        
        if (cleanPhone.length() == 11) {
            // (11) 99999-9999
            return String.format("(%s) %s-%s", 
                cleanPhone.substring(0, 2),
                cleanPhone.substring(2, 7),
                cleanPhone.substring(7));
        } else if (cleanPhone.length() == 10) {
            // (11) 9999-9999
            return String.format("(%s) %s-%s", 
                cleanPhone.substring(0, 2),
                cleanPhone.substring(2, 6),
                cleanPhone.substring(6));
        }
        
        return cleanPhone;
    }

    /**
     * Testa configuraÃ§Ã£o do WhatsApp
     */
    public boolean testWhatsAppConfiguration() {
        try {
            log.info("ðŸ§ª Testando configuraÃ§Ã£o do WhatsApp...");
            
            String testLink = generateWhatsAppLink("11999999999", "TESTE", "1", "2025");
            
            if (testLink != null && testLink.contains("api.whatsapp.com")) {
                log.info("âœ… ConfiguraÃ§Ã£o do WhatsApp funcionando");
                return true;
            } else {
                log.error("âŒ Link do WhatsApp invÃ¡lido");
                return false;
            }
            
        } catch (Exception e) {
            log.error("âŒ Erro na configuraÃ§Ã£o do WhatsApp: {}", e.getMessage());
            return false;
        }
    }
} 
