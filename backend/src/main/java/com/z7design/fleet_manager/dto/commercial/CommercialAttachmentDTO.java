package com.z7design.fleet_manager.dto.commercial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommercialAttachmentDTO {
    private UUID id;
    private UUID quotationId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String filePath;
    private String securityStatus;
    private String securityDetails;
    private String fileHash;
    private Boolean isManualUpload;
    private LocalDateTime createdAt;
}
