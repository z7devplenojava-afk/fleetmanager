package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.WhatsAppOutbox;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxKind;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxStatus;
import com.z7design.fleet_manager.repository.WhatsAppOutboxRepository;
import com.z7design.fleet_manager.service.FleetWorkOrderPdfService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Processa uma linha da outbox em transacao propria.
 *
 * <p>O tenant e aplicado manualmente porque o worker roda em uma thread de
 * scheduler sem {@code TenantContext}. Sem isso, o filtro Hibernate ficaria
 * desativado e o PDF poderia ser gerado a partir de dados de outra empresa.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppOutboxProcessor {

    private static final int MAX_ERROR_LENGTH = 2000;

    private final WhatsAppOutboxRepository outboxRepository;
    private final WhatsAppProviderRouter providerRouter;
    private final FleetWorkOrderPdfService pdfService;

    @Value("${whatsapp.outbox.stuck-minutes:10}")
    private int stuckMinutes;

    @Value("${whatsapp.outbox.retry-base-minutes:2}")
    private int retryBaseMinutes;

    @Transactional
    public int recoverStuck() {
        LocalDateTime now = LocalDateTime.now();
        int recovered = outboxRepository.recoverStuck(
                WhatsAppOutboxStatus.PENDING,
                WhatsAppOutboxStatus.PROCESSING,
                now,
                now.minusMinutes(stuckMinutes));
        if (recovered > 0) {
            log.warn("Recuperadas {} mensagens de WhatsApp presas em PROCESSING", recovered);
        }
        return recovered;
    }

    @Transactional
    public void process(UUID outboxId) {
        LocalDateTime now = LocalDateTime.now();
        int claimed = outboxRepository.claim(
                outboxId,
                WhatsAppOutboxStatus.PROCESSING,
                WhatsAppOutboxStatus.PENDING,
                now);
        if (claimed == 0) {
            return;
        }

        WhatsAppOutbox outbox = outboxRepository.findById(outboxId).orElse(null);
        if (outbox == null) {
            return;
        }

        UUID previousTenant = TenantContext.get();
        try {
            TenantContext.set(outbox.getCompanyId());
            performSend(outbox);
        } catch (Exception e) {
            log.error("Erro inesperado ao processar outbox {}: {}", outboxId, e.getMessage(), e);
            markFailure(outbox, "Erro inesperado: " + e.getMessage(), true);
        } finally {
            if (previousTenant != null) {
                TenantContext.set(previousTenant);
            } else {
                TenantContext.clear();
            }
        }
    }

    private void performSend(WhatsAppOutbox outbox) {
        WhatsAppProviderRouter.ResolvedProvider resolved = providerRouter.resolve(outbox.getCompanyId());
        WhatsAppSendResult result;

        if (outbox.getKind() == WhatsAppOutboxKind.DOCUMENT) {
            byte[] pdf = pdfService.generateDriverPdf(outbox.getWorkOrderId());
            result = resolved.provider().sendDocument(
                    resolved.sessionId(),
                    outbox.getRecipientPhone(),
                    pdf,
                    outbox.getDocumentFilename(),
                    "application/pdf",
                    outbox.getMessageText(),
                    outbox.getId().toString());
        } else {
            result = resolved.provider().sendText(
                    resolved.sessionId(),
                    outbox.getRecipientPhone(),
                    outbox.getMessageText(),
                    outbox.getId().toString());
        }

        if (result.success()) {
            outbox.setStatus(WhatsAppOutboxStatus.SENT);
            outbox.setSentAt(LocalDateTime.now());
            outbox.setProviderMessageId(result.providerMessageId());
            outbox.setLastError(null);
            outbox.setNextAttemptAt(null);
            outboxRepository.save(outbox);
            log.info("WhatsApp {} da OS {} enviado via {}",
                    outbox.getKind(), outbox.getWorkOrderId(), resolved.providerId());
        } else {
            markFailure(outbox, result.errorMessage(), result.retryable());
        }
    }

    private void markFailure(WhatsAppOutbox outbox, String error, boolean retryable) {
        int attempts = outbox.getAttempts() != null ? outbox.getAttempts() : 0;
        int maxAttempts = outbox.getMaxAttempts() != null ? outbox.getMaxAttempts() : 5;
        attempts++;
        outbox.setAttempts(attempts);
        outbox.setLastError(truncate(error, MAX_ERROR_LENGTH));

        if (!retryable || attempts >= maxAttempts) {
            outbox.setStatus(WhatsAppOutboxStatus.FAILED);
            outbox.setNextAttemptAt(null);
            log.error("WhatsApp {} da OS {} falhou definitivamente apos {} tentativa(s): {}",
                    outbox.getKind(), outbox.getWorkOrderId(), attempts, error);
        } else {
            outbox.setStatus(WhatsAppOutboxStatus.PENDING);
            outbox.setNextAttemptAt(LocalDateTime.now().plusMinutes(backoffMinutes(attempts)));
            log.warn("WhatsApp {} da OS {} falhou (tentativa {}); nova tentativa em {} min: {}",
                    outbox.getKind(), outbox.getWorkOrderId(), attempts,
                    backoffMinutes(attempts), error);
        }

        outboxRepository.save(outbox);
    }

    private long backoffMinutes(int attempts) {
        int base = Math.max(1, retryBaseMinutes);
        long delay = (long) base * (1L << Math.min(attempts - 1, 5));
        return Math.min(delay, 60L);
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
