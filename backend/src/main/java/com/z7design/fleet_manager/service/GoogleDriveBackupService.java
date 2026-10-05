package com.z7design.fleet_manager.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * ServiÃ§o responsÃ¡vel por enviar arquivos de backup para o Google Drive.
 *
 * IMPORTANTE:
 * - Requer uma Service Account configurada no Google Cloud.
 * - O caminho do JSON de credenciais deve ser configurado em
 *   app.backup.google-drive.credentials-path
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleDriveBackupService {

    private final GoogleDriveBackupSettings settings;

    private Drive driveClient;
    private boolean initialized = false;

    /**
     * Inicializa o client do Google Drive usando o arquivo de credenciais.
     */
    private synchronized void initIfNeeded() {
        if (initialized) {
            return;
        }
        initialized = true;

        String credentialsPath = settings.getCredentialsPath();
        try {
            if (credentialsPath == null || credentialsPath.isBlank()) {
                log.warn("âš ï¸ Google Drive nÃ£o configurado: app.backup.google-drive.credentials-path estÃ¡ vazio.");
                return;
            }

            log.info("ðŸ” Inicializando Google Drive com credenciais de: {}", credentialsPath);
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new FileInputStream(credentialsPath))
                    .createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));

            driveClient = new Drive.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials)
            ).setApplicationName("fluxbus-backend")
             .build();

            log.info("âœ… Cliente Google Drive inicializado com sucesso.");
        } catch (IOException | GeneralSecurityException e) {
            log.error("âŒ Erro ao inicializar Google Drive: {}", e.getMessage(), e);
            driveClient = null;
        }
    }

    /**
     * Faz upload de um arquivo de backup para a pasta configurada no Google Drive.
     *
     * @param backupFile caminho do arquivo de backup no disco
     */
    public void uploadBackupFile(Path backupFile) {
        if (!settings.isEnabled()) {
            log.debug("Google Drive desabilitado (settings.enabled = false). Ignorando upload.");
            return;
        }

        String folderId = settings.getFolderId();
        if (folderId == null || folderId.isBlank()) {
            log.warn("âš ï¸ Google Drive habilitado mas folderId nÃ£o configurado. Ignorando upload.");
            return;
        }

        initIfNeeded();
        if (driveClient == null) {
            log.warn("âš ï¸ Google Drive client nÃ£o inicializado. Upload nÃ£o serÃ¡ realizado.");
            return;
        }

        try {
            java.io.File file = backupFile.toFile();
            if (!file.exists()) {
                log.warn("âš ï¸ Arquivo de backup nÃ£o encontrado para upload: {}", backupFile);
                return;
            }

            log.info("ðŸ“¤ Enviando backup para Google Drive: {} ({} bytes)", file.getName(), file.length());

            File fileMetadata = new File();
            fileMetadata.setName(file.getName());
            fileMetadata.setParents(Collections.singletonList(folderId));

            FileContent mediaContent = new FileContent("application/octet-stream", file);

            File uploadedFile = driveClient.files()
                    .create(fileMetadata, mediaContent)
                    .setFields("id, name, parents")
                    .execute();

            log.info("âœ… Backup enviado para Google Drive com sucesso. FileId={}", uploadedFile.getId());
        } catch (IOException e) {
            log.error("âŒ Erro ao enviar backup para Google Drive: {}", e.getMessage(), e);
        }
    }
}



