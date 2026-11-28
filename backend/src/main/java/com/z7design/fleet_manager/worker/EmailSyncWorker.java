package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.service.email.ImapSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sincronização incremental automática das caixas IMAP.
 * Trava em memória evita execuções sobrepostas na instância única da VPS.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailSyncWorker {

    private final EmailAccountRepository accountRepository;
    private final ImapSyncService imapSyncService;

    private final AtomicBoolean running = new AtomicBoolean(false);

    @Value("${app.email.sync-interval-ms:300000}")
    private long intervalMs;

    @Scheduled(fixedDelayString = "${app.email.sync-interval-ms:300000}", initialDelayString = "${app.email.sync-initial-delay-ms:60000}")
    public void syncActiveAccounts() {
        if (!running.compareAndSet(false, true)) {
            log.debug("EmailSyncWorker já em execução; pulando ciclo.");
            return;
        }
        try {
            List<EmailAccount> accounts = accountRepository.findByStatus("ACTIVE");
            for (EmailAccount account : accounts) {
                try {
                    imapSyncService.syncAccount(account.getId(), false);
                } catch (Exception e) {
                    log.warn("Falha ao sincronizar conta de e-mail {}: {}", account.getEmailAddress(), e.getMessage());
                }
            }
            if (!accounts.isEmpty()) {
                log.info("EmailSyncWorker: {} conta(s) processada(s)", accounts.size());
            }
        } finally {
            running.set(false);
        }
    }
}
