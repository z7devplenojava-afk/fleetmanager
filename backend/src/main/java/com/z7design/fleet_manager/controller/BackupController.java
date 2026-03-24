package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.BackupConfiguration;
import com.z7design.fleet_manager.model.BackupHistory;
import com.z7design.fleet_manager.model.GoogleDriveBackupConfig;
import com.z7design.fleet_manager.repository.BackupConfigurationRepository;
import com.z7design.fleet_manager.repository.BackupHistoryRepository;
import com.z7design.fleet_manager.service.BackupService;
import com.z7design.fleet_manager.service.GoogleDriveBackupService;
import com.z7design.fleet_manager.service.GoogleDriveBackupSettings;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Backup", description = "Gerenciamento de backups do banco de dados")
@PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
public class BackupController {

    private final BackupService backupService;
    private final BackupConfigurationRepository backupConfigurationRepository;
    private final BackupHistoryRepository backupHistoryRepository;
    private final GoogleDriveBackupSettings googleDriveBackupSettings;
    private final GoogleDriveBackupService googleDriveBackupService;

    @Operation(summary = "Listar configuraÃ§Ãµes de backup")
    @GetMapping("/configurations")
    public ResponseEntity<List<BackupConfiguration>> getAllConfigurations() {
        return ResponseEntity.ok(backupConfigurationRepository.findAll());
    }

    @Operation(summary = "Criar configuraÃ§Ã£o de backup")
    @PostMapping("/configurations")
    public ResponseEntity<BackupConfiguration> createConfiguration(
            @RequestBody BackupConfiguration config) {
        try {
            BackupConfiguration saved = backupConfigurationRepository.save(config);
            log.info("âœ… ConfiguraÃ§Ã£o de backup criada: {}", saved.getName());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("âŒ Erro ao criar configuraÃ§Ã£o de backup: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @Operation(summary = "Executar backup manual")
    @PostMapping("/execute")
    public ResponseEntity<?> executeBackup(@RequestParam String description) {
        try {
            log.info("ðŸ”„ Executando backup manual: {}", description);
            backupService.performManualBackup(description);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Backup executado com sucesso"
            ));
        } catch (Exception e) {
            log.error("âŒ Erro ao executar backup: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Listar histÃ³rico de backups")
    @GetMapping("/history")
    public ResponseEntity<List<BackupHistory>> getHistory(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            List<BackupHistory> history = backupHistoryRepository.findAll()
                    .stream()
                    .sorted((a, b) -> b.getBackupDate().compareTo(a.getBackupDate()))
                    .limit(limit)
                    .toList();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar histÃ³rico: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    @Operation(summary = "Obter estatÃ­sticas de backup")
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            long totalConfigs = backupConfigurationRepository.count();
            long totalBackups = backupHistoryRepository.count();
            long activeConfigs = backupConfigurationRepository.findAll()
                    .stream()
                    .filter(BackupConfiguration::getEnabled)
                    .count();

            return ResponseEntity.ok(Map.of(
                    "totalConfigurations", totalConfigs,
                    "activeConfigurations", activeConfigs,
                    "totalBackups", totalBackups
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "totalConfigurations", 0,
                    "activeConfigurations", 0,
                    "totalBackups", 0
            ));
        }
    }

    @Operation(summary = "Deletar configuraÃ§Ã£o")
    @DeleteMapping("/configurations/{id}")
    public ResponseEntity<?> deleteConfiguration(@PathVariable java.util.UUID id) {
        try {
            backupConfigurationRepository.deleteById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ConfiguraÃ§Ã£o removida"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Atualizar configuraÃ§Ã£o")
    @PutMapping("/configurations/{id}")
    public ResponseEntity<BackupConfiguration> updateConfiguration(
            @PathVariable java.util.UUID id,
            @RequestBody BackupConfiguration config) {
        try {
            var existing = backupConfigurationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("ConfiguraÃ§Ã£o nÃ£o encontrada"));

            existing.setName(config.getName());
            existing.setType(config.getType());
            existing.setHost(config.getHost());
            existing.setPort(config.getPort());
            existing.setDatabase(config.getDatabase());
            existing.setUsername(config.getUsername());
            if (config.getPassword() != null && !config.getPassword().isEmpty()) {
                existing.setPassword(config.getPassword());
            }
            existing.setEnabled(config.getEnabled());
            existing.setAutoBackup(config.getAutoBackup());
            existing.setSchedule(config.getSchedule());
            existing.setRetentionDays(config.getRetentionDays());

            BackupConfiguration updated = backupConfigurationRepository.save(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar configuraÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // =============================================
    // IntegraÃ§Ã£o Google Drive (configuraÃ§Ã£o bÃ¡sica)
    // =============================================

    @Operation(summary = "Configurar envio de backups para o Google Drive")
    @PostMapping("/google-drive/config")
    public ResponseEntity<?> configureGoogleDrive(@RequestBody GoogleDriveBackupConfig config) {
        try {
            log.info("ðŸ”§ ConfiguraÃ§Ã£o Google Drive recebida: enabled={}, folderId={}",
                    config.getEnabled(), config.getFolderId());

            googleDriveBackupSettings.setEnabled(Boolean.TRUE.equals(config.getEnabled()));
            googleDriveBackupSettings.setFolderId(config.getFolderId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ConfiguraÃ§Ã£o de envio para Google Drive atualizada em memÃ³ria."
            ));
        } catch (Exception e) {
            log.error("âŒ Erro ao processar configuraÃ§Ã£o do Google Drive: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Testar configuraÃ§Ã£o de envio para o Google Drive")
    @PostMapping("/google-drive/test")
    public ResponseEntity<?> testGoogleDrive(@RequestBody GoogleDriveBackupConfig config) {
        try {
            log.info("ðŸ§ª Testando configuraÃ§Ã£o Google Drive: enabled={}, folderId={}",
                    config.getEnabled(), config.getFolderId());

            // Atualiza temporariamente as configuraÃ§Ãµes e tenta enviar um arquivo de teste
            googleDriveBackupSettings.setEnabled(Boolean.TRUE.equals(config.getEnabled()));
            googleDriveBackupSettings.setFolderId(config.getFolderId());

            // Criar arquivo temporÃ¡rio de teste
            java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("backup_test_", ".txt");
            java.nio.file.Files.writeString(tempFile, "Teste de upload de backup para Google Drive - " + java.time.LocalDateTime.now());

            googleDriveBackupService.uploadBackupFile(tempFile);

            // Apagar arquivo temporÃ¡rio local
            try {
                java.nio.file.Files.deleteIfExists(tempFile);
            } catch (Exception ignore) {
                // nÃ£o Ã© crÃ­tico
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Teste de Google Drive executado. Verifique a pasta configurada para o arquivo de teste."
            ));
        } catch (Exception e) {
            log.error("âŒ Erro ao testar Google Drive: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

