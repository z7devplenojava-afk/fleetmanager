package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO de entrada para criaÃ§Ã£o/atualizaÃ§Ã£o de HistÃ³rico de FuncionÃ¡rio.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeHistoryRequestDTO {

    private String eventType;
    private LocalDate eventDate;
    private String description;
    private String relatedDocumentUrl;
    private String createdBy;
}
