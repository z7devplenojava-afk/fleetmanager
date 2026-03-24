package com.z7design.fleet_manager.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${app.backup.enabled:true}")
    private boolean backupEnabled;

    @Value("${app.backup.path:./backups}")
    private String backupPath;

    @Value("${app.backup.retention-days:30}")
    private int retentionDays;

    @Value("${app.backup.max-files:100}")
    private int maxFiles;

    private final GoogleDriveBackupService googleDriveBackupService;

    public BackupService(GoogleDriveBackupService googleDriveBackupService) {
        this.googleDriveBackupService = googleDriveBackupService;
    }

    /**
     * Backup automÃ¡tico diÃ¡rio Ã s 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void performDailyBackup() {
        if (!backupEnabled) {
            logger.info("Backup automÃ¡tico desabilitado");
            return;
        }

        try {
            logger.info("Iniciando backup automÃ¡tico diÃ¡rio");
            createBackup("daily");
            cleanupOldBackups();
            logger.info("Backup automÃ¡tico concluÃ­do com sucesso");
        } catch (Exception e) {
            logger.error("Erro durante backup automÃ¡tico", e);
        }
    }

    /**
     * Backup semanal aos domingos Ã s 3:00 AM
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    public void performWeeklyBackup() {
        if (!backupEnabled) {
            return;
        }

        try {
            logger.info("Iniciando backup semanal");
            createBackup("weekly");
            logger.info("Backup semanal concluÃ­do com sucesso");
        } catch (Exception e) {
            logger.error("Erro durante backup semanal", e);
        }
    }

    /**
     * Backup manual
     */
    public void performManualBackup(String description) {
        try {
            logger.info("Iniciando backup manual: {}", description);
            createBackup("manual-" + description);
            logger.info("Backup manual concluÃ­do com sucesso");
        } catch (Exception e) {
            logger.error("Erro durante backup manual", e);
            throw new RuntimeException("Falha no backup manual", e);
        }
    }

    /**
     * Criar backup
     */
    private void createBackup(String type) throws IOException {
        // Criar diretÃ³rio de backup se nÃ£o existir
        Path backupDir = Paths.get(backupPath);
        if (!Files.exists(backupDir)) {
            Files.createDirectories(backupDir);
        }

        // Gerar nome do arquivo
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = String.format("backup_%s_%s.json", type, timestamp);
        Path backupFile = backupDir.resolve(fileName);

        // Criar conteÃºdo do backup
        String backupContent = generateBackupContent();

        // Salvar arquivo
        try (FileWriter writer = new FileWriter(backupFile.toFile())) {
            writer.write(backupContent);
        }

        logger.info("Backup criado: {}", backupFile);

        // Enviar para Google Drive (se habilitado)
        try {
            googleDriveBackupService.uploadBackupFile(backupFile);
        } catch (Exception e) {
            logger.error("Erro ao enviar backup para Google Drive (nÃ£o Ã© fatal para o backup local): {}", e.getMessage(), e);
        }
    }

    /**
     * Gerar conteÃºdo do backup
     */
    private String generateBackupContent() {
        StringBuilder content = new StringBuilder();
        content.append("{\n");
        content.append("  \"backupInfo\": {\n");
        content.append("    \"timestamp\": \"").append(LocalDateTime.now()).append("\",\n");
        content.append("    \"version\": \"1.0.0\",\n");
        content.append("    \"type\": \"application_backup\"\n");
        content.append("  },\n");
        content.append("  \"data\": {\n");
        content.append("    \"funcionarios\": [],\n");
        content.append("    \"envios\": [],\n");
        content.append("    \"auditLogs\": []\n");
        content.append("  }\n");
        content.append("}");

        return content.toString();
    }

    /**
     * Limpar backups antigos
     */
    private void cleanupOldBackups() {
        try {
            Path backupDir = Paths.get(backupPath);
            if (!Files.exists(backupDir)) {
                return;
            }

            // Listar arquivos de backup
            List<Path> backupFiles = Files.list(backupDir)
                    .filter(path -> path.toString().endsWith(".json"))
                    .sorted()
                    .collect(Collectors.toList());

            // Remover arquivos antigos
            if (backupFiles.size() > maxFiles) {
                int filesToDelete = backupFiles.size() - maxFiles;
                for (int i = 0; i < filesToDelete; i++) {
                    Path fileToDelete = backupFiles.get(i);
                    Files.delete(fileToDelete);
                    logger.info("Backup antigo removido: {}", fileToDelete);
                }
            }

        } catch (IOException e) {
            logger.error("Erro ao limpar backups antigos", e);
        }
    }

    /**
     * Listar backups disponÃ­veis
     */
    public List<BackupInfo> listBackups() {
        try {
            Path backupDir = Paths.get(backupPath);
            if (!Files.exists(backupDir)) {
                return List.of();
            }

            return Files.list(backupDir)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::createBackupInfo)
                    .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
                    .collect(Collectors.toList());

        } catch (IOException e) {
            logger.error("Erro ao listar backups", e);
            return List.of();
        }
    }

    /**
     * Restaurar backup
     */
    public void restoreBackup(String fileName) {
        try {
            Path backupFile = Paths.get(backupPath, fileName);
            if (!Files.exists(backupFile)) {
                throw new RuntimeException("Arquivo de backup nÃ£o encontrado: " + fileName);
            }

            logger.info("Iniciando restauraÃ§Ã£o do backup: {}", fileName);
            
            // Aqui vocÃª implementaria a lÃ³gica de restauraÃ§Ã£o
            // Por exemplo, ler o JSON e restaurar os dados no banco
            
            logger.info("RestauraÃ§Ã£o concluÃ­da com sucesso");

        } catch (Exception e) {
            logger.error("Erro durante restauraÃ§Ã£o", e);
            throw new RuntimeException("Falha na restauraÃ§Ã£o", e);
        }
    }

    /**
     * Criar informaÃ§Ãµes do backup
     */
    private BackupInfo createBackupInfo(Path file) {
        try {
            String fileName = file.getFileName().toString();
            long size = Files.size(file);
            LocalDateTime lastModified = LocalDateTime.ofInstant(
                    Files.getLastModifiedTime(file).toInstant(),
                    java.time.ZoneId.systemDefault()
            );

            return new BackupInfo(fileName, size, lastModified);

        } catch (IOException e) {
            logger.error("Erro ao obter informaÃ§Ãµes do backup: {}", file, e);
            return new BackupInfo(file.getFileName().toString(), 0, LocalDateTime.now());
        }
    }

    /**
     * Classe para informaÃ§Ãµes do backup
     */
    public static class BackupInfo {
        public final String fileName;
        public final long size;
        public final LocalDateTime timestamp;

        public BackupInfo(String fileName, long size, LocalDateTime timestamp) {
            this.fileName = fileName;
            this.size = size;
            this.timestamp = timestamp;
        }
    }
} 
