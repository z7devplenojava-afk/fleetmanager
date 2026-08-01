package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAttachmentDTO {
    private UUID id;
    private String fileName;
    private String contentType;
    private Long sizeBytes;
    private Boolean inline;
    private String contentId;
    private String downloadUrl;
}
