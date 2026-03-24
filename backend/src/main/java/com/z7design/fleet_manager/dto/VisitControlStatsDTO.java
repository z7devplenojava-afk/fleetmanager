package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitControlStatsDTO {
    private Long today;
    private Long completed;
    private Long pending;
    private Double successRate;
    private Long activeSupervisors;
}





