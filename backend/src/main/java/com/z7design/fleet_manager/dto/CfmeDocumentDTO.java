package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CfmeDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CfmeDocumentDTO {

    /** Janela (em dias) usada para sinalizar documentos "vencendo". */
    public static final int EXPIRING_DAYS = 30;

    private UUID id;
    private CfmeDocument.DocumentCategory category;
    private String categoryDescription;
    private String title;
    private String issuer;
    private String documentNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String originalName;
    private Long fileSize;
    private String displaySize;
    private String mimeType;
    private String notes;
    private UUID uploadedBy;
    private String uploadedByName;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** VIGENTE | VENCENDO | VENCIDO | SEM_VALIDADE */
    private String status;
    /** Dias até o vencimento (negativo quando já vencido). */
    private Long daysToExpiry;

    public static CfmeDocumentDTO fromEntity(CfmeDocument doc) {
        CfmeDocumentDTO dto = new CfmeDocumentDTO();
        dto.setId(doc.getId());
        dto.setCategory(doc.getCategory());
        dto.setCategoryDescription(doc.getCategory() != null ? doc.getCategory().getDescription() : null);
        dto.setTitle(doc.getTitle());
        dto.setIssuer(doc.getIssuer());
        dto.setDocumentNumber(doc.getDocumentNumber());
        dto.setIssueDate(doc.getIssueDate());
        dto.setExpiryDate(doc.getExpiryDate());
        dto.setOriginalName(doc.getOriginalName());
        dto.setFileSize(doc.getFileSize());
        dto.setDisplaySize(formatSize(doc.getFileSize()));
        dto.setMimeType(doc.getMimeType());
        dto.setNotes(doc.getNotes());
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setUploadedByName(doc.getUploadedByName());
        dto.setCompanyId(doc.getCompanyId());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        applyStatus(dto, doc.getExpiryDate());
        return dto;
    }

    private static void applyStatus(CfmeDocumentDTO dto, LocalDate expiryDate) {
        if (expiryDate == null) {
            dto.setStatus("SEM_VALIDADE");
            dto.setDaysToExpiry(null);
            return;
        }
        long days = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);
        dto.setDaysToExpiry(days);
        if (days < 0) {
            dto.setStatus("VENCIDO");
        } else if (days <= EXPIRING_DAYS) {
            dto.setStatus("VENCENDO");
        } else {
            dto.setStatus("VIGENTE");
        }
    }

    private static String formatSize(Long bytes) {
        if (bytes == null) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }
}
