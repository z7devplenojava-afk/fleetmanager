package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.enums.WhatsAppOutboxStatus;
import com.z7design.fleet_manager.repository.WhatsAppOutboxRepository;
import com.z7design.fleet_manager.service.whatsapp.WhatsAppOutboxProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Worker periodico da outbox de WhatsApp.
 *
 * <p>O processamento roda sem TenantContext; cada linha e processada em uma
 * transacao propria pelo {@link WhatsAppOutboxProcessor}, que aplica o tenant
 * da empresa correspondente.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WhatsAppOutboxWorker {

    private final WhatsAppOutboxRepository outboxRepository;
    private final WhatsAppOutboxProcessor outboxProcessor;

    @Value("${whatsapp.outbox.enabled:true}")
    private boolean enabled;

    @Value("${whatsapp.outbox.batch-size:10}")
    private int batchSize;

    @Scheduled(
            fixedDelayString = "${whatsapp.outbox.poll-interval-ms:30000}",
            initialDelayString = "${whatsapp.outbox.initial-delay-ms:15000}")
    public void poll() {
        if (!enabled) {
            return;
        }

        try {
            outboxProcessor.recoverStuck();

            List<UUID> dueIds = outboxRepository.findDueIds(
                    WhatsAppOutboxStatus.PENDING,
                    LocalDateTime.now(),
                    PageRequest.of(0, Math.max(1, batchSize)));

            for (UUID id : dueIds) {
                try {
                    outboxProcessor.process(id);
                } catch (Exception e) {
                    log.error("Falha ao processar mensagem de WhatsApp {}: {}", id, e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Erro no worker da outbox de WhatsApp: {}", e.getMessage(), e);
        }
    }
}
