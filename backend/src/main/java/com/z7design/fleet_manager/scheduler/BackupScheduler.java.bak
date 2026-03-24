package com.z7design.secured_guard.scheduler;

import com.z7design.secured_guard.model.BackupConfiguration;
import com.z7design.secured_guard.repository.BackupConfigurationRepository;
import com.z7design.secured_guard.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduler para execução automática de backups
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BackupScheduler {

    private final BackupService backupService;
    private final BackupConfigurationRepository configRepository;

    /**
     * Executa backups automáticos configurados
     * Roda a cada hora para verificar se há backups agendados
     */
    @Scheduled(cron = "0 0 * * * ?") // A cada hora
    public void executeScheduledBackups() {
        log.info("🔄 Verificando backups agendados...");

        List<BackupConfiguration> configurations = configRepository.findAll();

        for (BackupConfiguration config : configurations) {
            if (config.getEnabled() && config.getAutoBackup()) {
                try {
                    log.info("📦 Executando backup automático para: {}", config.getName());
                    backupService.executeBackup(config.getId());
                } catch (Exception e) {
                    log.error("❌ Erro ao executar backup automático para {}: {}", 
                            config.getName(), e.getMessage(), e);
                }
            }
        }

        log.info("✅ Verificação de backups agendados concluída");
    }

    /**
     * Limpa backups antigos diariamente à meia-noite
     */
    @Scheduled(cron = "0 0 0 * * ?") // Todo dia à meia-noite
    public void cleanOldBackups() {
        log.info("🧹 Iniciando limpeza de backups antigos...");

        List<BackupConfiguration> configurations = configRepository.findAll();

        for (BackupConfiguration config : configurations) {
            try {
                log.info("🗑️ Limpando backups antigos para: {}", config.getName());
                backupService.cleanOldBackups(config);
            } catch (Exception e) {
                log.error("❌ Erro ao limpar backups de {}: {}", config.getName(), e.getMessage());
            }
        }

        log.info("✅ Limpeza de backups concluída");
    }
}

