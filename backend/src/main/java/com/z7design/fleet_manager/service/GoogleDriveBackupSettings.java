package com.z7design.fleet_manager.service;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Armazena em memÃ³ria as configuraÃ§Ãµes de envio de backup para o Google Drive.
 * Os valores iniciais podem ser definidos via properties / variÃ¡veis de ambiente,
 * e atualizados em runtime pelo endpoint de configuraÃ§Ã£o.
 */
@Component
@Getter
@Setter
@Slf4j
public class GoogleDriveBackupSettings {

    /**
     * Se o envio para o Google Drive estÃ¡ habilitado.
     */
    private boolean enabled;

    /**
     * ID da pasta de destino no Google Drive.
     */
    private String folderId;

    /**
     * Caminho para o arquivo de credenciais da Service Account do Google.
     * Ex.: /etc/fluxbus/google-service-account.json
     */
    private String credentialsPath;

    public GoogleDriveBackupSettings(
            @Value("${app.backup.google-drive.enabled:false}") boolean enabled,
            @Value("${app.backup.google-drive.folder-id:}") String folderId,
            @Value("${app.backup.google-drive.credentials-path:}") String credentialsPath
    ) {
        this.enabled = enabled;
        this.folderId = folderId;
        this.credentialsPath = credentialsPath;

        log.info("ðŸ”§ GoogleDriveBackupSettings inicializado: enabled={}, folderId set? {}, credentialsPath set? {}",
                enabled,
                folderId != null && !folderId.isBlank(),
                credentialsPath != null && !credentialsPath.isBlank());
    }
}



