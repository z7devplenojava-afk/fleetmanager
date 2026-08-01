package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ClientDocCategory;
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
public class ClientDocCategoryDTO {
    private UUID id;
    private String name;
    private String description;
    private Boolean isSystem;
    private UUID companyId;
    private LocalDateTime createdAt;

    public static ClientDocCategoryDTO fromEntity(ClientDocCategory category) {
        return ClientDocCategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .isSystem(category.getIsSystem())
                .companyId(category.getCompanyId())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
