package com.z7design.fleet_manager.config;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ConfiguraÃ§Ã£o de PROTEÃ‡ÃƒO para testes com Baileys
 * 
 * âš ï¸ TEMPORÃRIO - Apenas para desenvolvimento/testes
 * 
 * Esta classe limita o envio de mensagens WhatsApp via Baileys
 * para evitar detecÃ§Ã£o/banimento durante fase de testes.
 */
@Configuration
@Component
public class WhatsAppTestConfig {
    private static final Logger log = LoggerFactory.getLogger(WhatsAppTestConfig.class);

    @Value("${whatsapp.test.mode:false}")
    private boolean testMode;

    @Value("${whatsapp.max.messages.per.day:20}")
    private int maxMessagesPerDay;

    @Value("${whatsapp.test.numbers:}")
    private String testNumbersConfig;

    @Value("${baileys.enabled:false}")
    private boolean baileysEnabled;

    private final AtomicInteger messagesCount = new AtomicInteger(0);
    private LocalDate lastResetDate = LocalDate.now();
    private List<String> allowedTestNumbers;

    @PostConstruct
    public void init() {
        if (testMode && baileysEnabled) {
            log.warn(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.warn("âš ï¸  MODO DE TESTE ATIVADO - USANDO BAILEYS (NÃƒO OFICIAL)");
            log.warn(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.warn("ðŸš¨ ATENÃ‡ÃƒO:");
            log.warn("   - Baileys NÃƒO Ã© aprovado pela Meta");
            log.warn("   - Use APENAS para testes locais");
            log.warn("   - Limite: {} mensagens/dia", maxMessagesPerDay);
            log.warn("   - NÃƒO use em produÃ§Ã£o!");
            log.warn("   - Migre para WhatsApp Cloud API antes de produÃ§Ã£o");
            log.warn(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

            if (testNumbersConfig != null && !testNumbersConfig.isEmpty()) {
                allowedTestNumbers = Arrays.asList(testNumbersConfig.split(","));
                log.info("âœ… NÃºmeros permitidos para teste: {}", allowedTestNumbers);
            }
        } else if (baileysEnabled && !testMode) {
            log.error(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.error("ðŸ”´ ERRO CRÃTICO: Baileys habilitado SEM modo de teste!");
            log.error(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.error("âš ï¸  Configure whatsapp.test.mode=true no application.properties");
            log.error("âš ï¸  OU migre para WhatsApp Cloud API oficial");
            log.error(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        }
    }

    /**
     * Verifica se pode enviar mensagem (proteÃ§Ã£o contra banimento)
     */
    public boolean canSendMessage(String phoneNumber) {
        if (!testMode || !baileysEnabled) {
            return true; // Sem restriÃ§Ãµes se nÃ£o estiver em modo teste com Baileys
        }

        if (maxMessagesPerDay <= 0) {
            // Modo ilimitado
            return true;
        }

        // Resetar contador diÃ¡rio
        if (!LocalDate.now().equals(lastResetDate)) {
            messagesCount.set(0);
            lastResetDate = LocalDate.now();
            log.info("ðŸ”„ Contador de mensagens resetado para novo dia");
        }

        // Verificar limite diÃ¡rio
        if (messagesCount.get() >= maxMessagesPerDay) {
            log.error("ðŸš« LIMITE DIÃRIO ATINGIDO: {}/{} mensagens", messagesCount.get(), maxMessagesPerDay);
            log.error("âš ï¸  Aguarde atÃ© amanhÃ£ OU migre para WhatsApp Cloud API");
            return false;
        }

        // Verificar se nÃºmero estÃ¡ na lista permitida (se configurada)
        if (allowedTestNumbers != null && !allowedTestNumbers.isEmpty()) {
            String normalized = phoneNumber.replaceAll("[^0-9]", "");
            boolean allowed = allowedTestNumbers.stream()
                    .anyMatch(testNum -> testNum.replaceAll("[^0-9]", "").equals(normalized));

            if (!allowed) {
                log.warn("âš ï¸  NÃºmero {} NÃƒO estÃ¡ na lista de testes permitidos", phoneNumber);
                log.warn("ðŸ“‹ NÃºmeros permitidos: {}", allowedTestNumbers);
                return false;
            }
        }

        return true;
    }

    /**
     * Incrementa contador de mensagens enviadas
     */
    public void incrementMessageCount() {
        if (testMode && baileysEnabled && maxMessagesPerDay > 0) {
            int count = messagesCount.incrementAndGet();
            log.info("ðŸ“Š Mensagens enviadas hoje: {}/{}", count, maxMessagesPerDay);

            if (count >= maxMessagesPerDay * 0.8) {
                log.warn("âš ï¸  VocÃª estÃ¡ prÃ³ximo do limite diÃ¡rio! ({}/{})", count, maxMessagesPerDay);
            }
        }
    }

    /**
     * Verifica se estÃ¡ em modo de teste
     */
    public boolean isTestMode() {
        return testMode && baileysEnabled;
    }

    /**
     * Retorna quantas mensagens ainda podem ser enviadas hoje
     */
    public int getRemainingMessages() {
        if (!testMode || !baileysEnabled) {
            return Integer.MAX_VALUE;
        }
        if (maxMessagesPerDay <= 0) {
            return Integer.MAX_VALUE;
        }
        return Math.max(0, maxMessagesPerDay - messagesCount.get());
    }

    /**
     * Exibe aviso de migraÃ§Ã£o
     */
    public void showMigrationWarning() {
        if (testMode && baileysEnabled) {
            log.warn(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.warn("ðŸš€ LEMBRE-SE: Migre para WhatsApp Cloud API antes de produÃ§Ã£o!");
            log.warn("ðŸ“„ Guia: MIGRACAO_WHATSAPP_BUSINESS_API_OFICIAL.md");
            log.warn(
                    "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
        }
    }
}
