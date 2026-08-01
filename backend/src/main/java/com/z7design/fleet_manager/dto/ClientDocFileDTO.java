package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ClientDocFile;
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
public class ClientDocFileDTO {
    private UUID id;
    private UUID stageId;
    private UUID categoryId;
    private String categoryName;
    private String originalName;
    private String storedPath;
    private Long fileSize;
    private String displaySize;
    private String mimeType;
    private UUID uploadedBy;
    private LocalDateTime createdAt;

    public static ClientDocFileDTO fromEntity(ClientDocFile file) {
        return ClientDocFileDTO.builder()
                .id(file.getId())
                .stageId(file.getStage().getId())
                .categoryId(file.getCategory().getId())
                .categoryName(file.getCategory().getName())
                .originalName(file.getOriginalName())
                .storedPath(file.getStoredPath())
                .fileSize(file.getFileSize())
                .displaySize(formatFileSize(file.getFileSize()))
                .mimeType(file.getMimeType())
                .uploadedBy(file.getUploadedBy())
                .createdAt(file.getCreatedAt())
                .build();
    }

    private static String formatFileSize(Long size) {
        if (size == null || size == 0) return "0 B";
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024.0));
        return String.format("%.1f GB", size / (1024.0 * 1024.0 * 1024.0));
    }
}
