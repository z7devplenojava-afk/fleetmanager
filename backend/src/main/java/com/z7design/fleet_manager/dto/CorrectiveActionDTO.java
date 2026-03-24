package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para aÃ§Ãµes corretivas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectiveActionDTO {
    private UUID id;
    private String title;
    private String description;
    private String origin;
    private String priority;
    private String status;
    private UUID responsibleUserId;
    private String responsibleName;
    private LocalDate dueDate;
    private LocalDate completionDate;
    private String department;
    private String notes;
    private UUID relatedInspectionId;
    private UUID relatedAccidentId;
    private UUID relatedNonConformityId;
    private UUID createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}





