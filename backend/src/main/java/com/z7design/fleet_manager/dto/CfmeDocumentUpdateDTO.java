package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CfmeDocument;
import lombok.Data;

/**
 * Payload de atualização dos metadados de um documento CFME.
 * As datas chegam como string (yyyy-MM-dd) para tolerar campos vazios do formulário.
 */
@Data
public class CfmeDocumentUpdateDTO {
    private CfmeDocument.DocumentCategory category;
    private String title;
    private String issuer;
    private String documentNumber;
    private String issueDate;
    private String expiryDate;
    private String notes;
}
