package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientChecklistTemplateDTO {

    private UUID id;
    private UUID clientId;
    private String clientName;
    private String name;
    private String revision;
    private Integer orderIndex;
    private List<ClientChecklistTemplateItemDTO> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
