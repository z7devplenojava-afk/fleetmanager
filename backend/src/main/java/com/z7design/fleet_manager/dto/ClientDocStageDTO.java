package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ClientDocStage;
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
public class ClientDocStageDTO {
    private UUID id;
    private UUID documentationId;
    private String name;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public static ClientDocStageDTO fromEntity(ClientDocStage stage) {
        return ClientDocStageDTO.builder()
                .id(stage.getId())
                .documentationId(stage.getDocumentation().getId())
                .name(stage.getName())
                .sortOrder(stage.getSortOrder())
                .createdAt(stage.getCreatedAt())
                .build();
    }
}
