package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.z7design.fleet_manager.model.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private UUID id;
    private String documentType;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDate issueDate;
    private LocalDate expirationDate;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isExpiringSoon;
    private Integer daysToExpiration;

    public static DocumentDTO fromEntity(Document document) {
        if (document == null) return null;
        
        LocalDate today = LocalDate.now();
        Integer daysToExpiration = null;
        Boolean isExpiringSoon = false;
        
        LocalDate expDate = document.getExpirationDate() != null ? document.getExpirationDate().toLocalDate() : null;
        if (expDate != null) {
            daysToExpiration = (int) java.time.temporal.ChronoUnit.DAYS.between(today, expDate);
            isExpiringSoon = daysToExpiration <= 30 && daysToExpiration >= 0;
        }
        
        String calculatedStatus = "ATIVO";
        if (expDate != null && expDate.isBefore(today)) {
            calculatedStatus = "EXPIRADO";
        }
        
        return DocumentDTO.builder()
                .id(document.getId())
                .documentType(document.getType() != null ? document.getType().name() : null)
                .fileName(document.getFileName())
                .fileType("pdf") // Default fallback
                .fileSize(0L) // Default fallback
                .issueDate(document.getIssueDate() != null ? document.getIssueDate().toLocalDate() : null)
                .expirationDate(expDate)
                .description(document.getDescription())
                .status(calculatedStatus)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .isExpiringSoon(isExpiringSoon)
                .daysToExpiration(daysToExpiration)
                .build();
    }
}
