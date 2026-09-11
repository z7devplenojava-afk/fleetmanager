package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDocumentDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private VehicleDocument.DocumentType docType;
    private String title;
    private String documentNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String originalName;
    private Long fileSize;
    private String displaySize;
    private String mimeType;
    private UUID uploadedBy;
    private UUID companyId;
    private LocalDateTime createdAt;

    public static VehicleDocumentDTO fromEntity(VehicleDocument doc) {
        VehicleDocumentDTO dto = new VehicleDocumentDTO();
        dto.setId(doc.getId());
        dto.setVehicleId(doc.getVehicle().getId());
        dto.setVehiclePlate(doc.getVehicle().getPlate());
        dto.setDocType(doc.getDocType());
        dto.setTitle(doc.getTitle());
        dto.setDocumentNumber(doc.getDocumentNumber());
        dto.setIssueDate(doc.getIssueDate());
        dto.setExpiryDate(doc.getExpiryDate());
        dto.setOriginalName(doc.getOriginalName());
        dto.setFileSize(doc.getFileSize());
        dto.setDisplaySize(formatSize(doc.getFileSize()));
        dto.setMimeType(doc.getMimeType());
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setCompanyId(doc.getCompanyId());
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
