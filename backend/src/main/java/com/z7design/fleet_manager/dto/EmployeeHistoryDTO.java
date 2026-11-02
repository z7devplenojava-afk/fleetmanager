package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.EmployeeHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de leitura de HistÃ³rico de FuncionÃ¡rio (campos planos).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeHistoryDTO {

    private UUID id;
    private UUID employeeId;
    private String eventType;
    private LocalDate eventDate;
    private String description;
    private String relatedDocumentUrl;
    private String createdBy;
    private LocalDateTime createdAt;

    public static EmployeeHistoryDTO fromEntity(EmployeeHistory entity) {
        if (entity == null) {
            return null;
        }
        return EmployeeHistoryDTO.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployee() != null ? entity.getEmployee().getId() : null)
                .eventType(entity.getEventType())
                .eventDate(entity.getEventDate())
                .description(entity.getDescription())
                .relatedDocumentUrl(entity.getRelatedDocumentUrl())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
