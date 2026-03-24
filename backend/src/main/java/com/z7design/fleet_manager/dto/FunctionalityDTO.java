package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FunctionalityDTO {
    private String id;
    private String name;
    private String description;
    private String icon;
    private String route;
    private String category;
    private int order;
}


