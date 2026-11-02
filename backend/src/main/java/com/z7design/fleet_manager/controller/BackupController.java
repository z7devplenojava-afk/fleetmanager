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
import java.util.Optional;
import java.util.UUID;

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

    @Operation(summary = "Listar configurações de backup")
    @GetMapping("/configurations")
    public ResponseEntity<List<BackupConfiguration>> getAllConfigurations() {
        return ResponseEntity.ok(backupConfigurationRepository.findAll());
    }

    @Operation(summary = "Criar ou atualizar configuração de backup")
    @PostMapping("/configurations")
    public ResponseEntity<BackupConfiguration> saveConfiguration(
            @RequestBody BackupConfiguration config) {
        try {
            BackupConfiguration target = null;
            if (config.getId() != null) {
                target = backupConfigurationRepository.findById(config.getId()).orElse(null);
            }
            if (target == null && config.getName() != null) {
                target = backupConfigurationRepository.findByName(config.getName()).orElse(null);
            }
            if (target == null && config.getType() != null) {
                target = backupConfigurationRepository.findByType(config.getType()).orElse(null);
            }

            if (target != null) {
                target.setName(config.getName());
                target.setType(config.getType());
                target.setHost(config.getHost());
                target.setPort(config.getPort());
                target.setDatabase(config.getDatabase());
                target.setUsername(config.getUsername());
                if (config.getPassword() != null && !config.getPassword().isBlank()) {
                    target.setPassword(config.getPassword());
                }
                if (config.getEnabled() != null) target.setEnabled(config.getEnabled());
                if (config.getAutoBackup() != null) target.setAutoBackup(config.getAutoBackup());
                if (config.getSchedule() != null) target.setSchedule(config.getSchedule());
                if (config.getRetentionDays() != null) target.setRetentionDays(config.getRetentionDays());
                if (config.getCompressBackup() != null) target.setCompressBackup(config.getCompressBackup());
                if (config.getEnvironment() != null) target.setEnvironment(config.getEnvironment());
                if (config.getBackupType() != null) target.setBackupType(config.getBackupType());
                target = backupConfigurationRepository.save(target);
                log.info("✅ Configuração de backup atualizada: {}", target.getName());
                return ResponseEntity.ok(target);
            } else {
                if (config.getBackupType() == null) {
                    config.setBackupType(com.z7design.fleet_manager.model.BackupType.FULL);
                }
                BackupConfiguration saved = backupConfigurationRepository.save(config);
                log.info("✅ Configuração de backup criada: {}", saved.getName());
                return ResponseEntity.ok(saved);
            }
        } catch (Exception e) {
            log.error("❌ Erro ao salvar configuração de backup: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @Operation(summary = "Testar conexão com banco de dados de backup")
    @PostMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestBody Map<String, Object> payload) {
        try {
            String host = (String) payload.get("host");
            Integer port = null;
            if (payload.get("port") != null) {
                try {
                    port = Integer.valueOf(payload.get("port").toString());
                } catch (Exception ignore) {}
            }
            String database = (String) payload.get("database");
            String username = (String) payload.get("username");
            String password = (String) payload.get("password");

            // Se senha vazia, tenta recuperar senha pré-existente no banco
            if (password == null || password.isBlank()) {
                String name = (String) payload.get("name");
                String type = (String) payload.get("type");
                Optional<BackupConfiguration> existing = (name != null) ? backupConfigurationRepository.findByName(name) : Optional.empty();
                if (existing.isEmpty() && type != null) {
                    existing = backupConfigurationRepository.findByType(type);
                }
                if (existing.isPresent() && existing.get().getPassword() != null) {
                    password = existing.get().getPassword();
                }
            }

            boolean ok = backupService.testConnection(host, port, database, username, password);
            return ResponseEntity.ok(Map.of(
                    "success", ok,
                    "message", ok ? "Conexão com o banco estabelecida com sucesso!" : "Não foi possível conectar ao banco."
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao testar conexão: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", e.getMessage() != null ? e.getMessage() : "Falha na conexão"
            ));
        }
    }

    @Operation(summary = "Executar backup manual por ID da configuração")
    @PostMapping("/execute/{configurationId}")
    public ResponseEntity<Map<String, Object>> executeBackupById(@PathVariable UUID configurationId) {
        try {
            log.info("🚀 Executando backup manual para config id: {}", configurationId);
            BackupHistory history = backupService.executeBackupForConfiguration(configurationId);
            boolean success = "SUCCESS".equalsIgnoreCase(history.getStatus());
            return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Backup executado com sucesso!" : "Falha: " + history.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao executar backup manual: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Executar backup manual")
    @PostMapping("/execute")
    public ResponseEntity<?> executeBackup(@RequestParam(value = "description", required = false, defaultValue = "manual") String description) {
        try {
            log.info("🔄 Executando backup manual: {}", description);
            backupService.performManualBackup(description);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Backup executado com sucesso"
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao executar backup: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Listar histórico de backups")
    @GetMapping("/history")
    public ResponseEntity<List<BackupHistory>> getHistory(
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit) {
        try {
            List<BackupHistory> history = backupHistoryRepository.findAll()
                    .stream()
                    .sorted((a, b) -> b.getBackupDate().compareTo(a.getBackupDate()))
                    .limit(limit)
                    .toList();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar histórico: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    @Operation(summary = "Obter estatísticas de backup")
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

    @Operation(summary = "Deletar configuração")
    @DeleteMapping("/configurations/{id}")
    public ResponseEntity<?> deleteConfiguration(@PathVariable("id") UUID id) {
        try {
            backupConfigurationRepository.deleteById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Configuração removida"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Atualizar configuração")
    @PutMapping("/configurations/{id}")
    public ResponseEntity<BackupConfiguration> updateConfiguration(
            @PathVariable("id") UUID id,
            @RequestBody BackupConfiguration config) {
        try {
            var existing = backupConfigurationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Configuração não encontrada"));

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
            log.error("❌ Erro ao atualizar configuração: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // =============================================
    // Integração Google Drive (configuração básica)
    // =============================================

    @Operation(summary = "Configurar envio de backups para o Google Drive")
    @PostMapping("/google-drive/config")
    public ResponseEntity<?> configureGoogleDrive(@RequestBody GoogleDriveBackupConfig config) {
        try {
            log.info("🔧 Configuração Google Drive recebida: enabled={}, folderId={}",
                    config.getEnabled(), config.getFolderId());

            googleDriveBackupSettings.setEnabled(Boolean.TRUE.equals(config.getEnabled()));
            googleDriveBackupSettings.setFolderId(config.getFolderId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Configuração de envio para Google Drive atualizada em memória."
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao processar configuração do Google Drive: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @Operation(summary = "Testar configuração de envio para o Google Drive")
    @PostMapping("/google-drive/test")
    public ResponseEntity<?> testGoogleDrive(@RequestBody GoogleDriveBackupConfig config) {
        try {
            log.info("🧪 Testando configuração Google Drive: enabled={}, folderId={}",
                    config.getEnabled(), config.getFolderId());

            googleDriveBackupSettings.setEnabled(Boolean.TRUE.equals(config.getEnabled()));
            googleDriveBackupSettings.setFolderId(config.getFolderId());

            java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("backup_test_", ".txt");
            java.nio.file.Files.writeString(tempFile, "Teste de upload de backup para Google Drive - " + java.time.LocalDateTime.now());

            googleDriveBackupService.uploadBackupFile(tempFile);

            try {
                java.nio.file.Files.deleteIfExists(tempFile);
            } catch (Exception ignore) {}

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Teste de Google Drive executado. Verifique a pasta configurada para o arquivo de teste."
            ));
        } catch (Exception e) {
            log.error("❌ Erro ao testar Google Drive: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
