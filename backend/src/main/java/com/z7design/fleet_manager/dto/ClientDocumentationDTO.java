package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ClientDocumentation;
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
public class ClientDocumentationDTO {
    private UUID id;
    private UUID clientId;
    private String clientName;
    private UUID companyId;
    private Integer year;
    private Integer month;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int stageCount;

    public static ClientDocumentationDTO fromEntity(ClientDocumentation doc) {
        return ClientDocumentationDTO.builder()
                .id(doc.getId())
                .clientId(doc.getClient().getId())
                .clientName(doc.getClient().getName())
                .companyId(doc.getCompanyId())
                .year(doc.getYear())
                .month(doc.getMonth())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
