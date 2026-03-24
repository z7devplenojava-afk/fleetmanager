package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientChecklistTemplateItemDTO {

    private UUID id;
    private String title;
    private Integer orderIndex;
    private Boolean required;
}
