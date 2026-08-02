package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ContractDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDocumentDTO {

    private UUID id;
    private UUID contractId;
    private String contractNumber;
    private String originalName;
    private Long fileSize;
    private String displaySize;
    private String mimeType;
    private UUID uploadedBy;
    private LocalDateTime createdAt;

    public static ContractDocumentDTO fromEntity(ContractDocument doc) {
        ContractDocumentDTO dto = new ContractDocumentDTO();
        dto.setId(doc.getId());
        dto.setContractId(doc.getContract().getId());
        dto.setContractNumber(doc.getContract().getContractNumber());
        dto.setOriginalName(doc.getOriginalName());
        dto.setFileSize(doc.getFileSize());
        dto.setDisplaySize(formatSize(doc.getFileSize()));
        dto.setMimeType(doc.getMimeType());
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setCreatedAt(doc.getCreatedAt());
        return dto;
    }

    private static String formatSize(Long bytes) {
        if (bytes == null) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }
}
