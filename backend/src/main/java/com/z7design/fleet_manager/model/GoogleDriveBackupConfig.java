package com.z7design.fleet_manager.model;

import lombok.Data;

/**
 * ConfiguraÃ§Ã£o simples para envio de backups para o Google Drive.
 *
 * Esta classe Ã© usada apenas como DTO na API por enquanto.
 * A integraÃ§Ã£o real com o Google Drive poderÃ¡ ser implementada em um serviÃ§o dedicado.
 */
@Data
public class GoogleDriveBackupConfig {

    /**
     * Se o envio automÃ¡tico para o Google Drive estÃ¡ habilitado.
     */
    private Boolean enabled = Boolean.FALSE;

    /**
     * ID da pasta de destino no Google Drive.
     * Exemplo: 1QJrZ9Xk0wtJhOVZN_HEo61lKa9cfvwiS
     */
    private String folderId;

    /**
     * DescriÃ§Ã£o ou observaÃ§Ãµes adicionais sobre esta configuraÃ§Ã£o.
     */
    private String description;
}



