package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Data;

@Data
public class BenefitCreateDTO {
    private String name;
    private String description;
    private String type;           // opcional
    private Boolean isActive;      // opcional
    private BigDecimal value;
    private LocalDate startDate;   // opcional (default hoje)
    private LocalDate endDate;     // opcional
    private UUID employeeId;       // opcional
    private UUID positionId;       // opcional
}



