package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSpecificActivityRequest {
    
    private UUID employeeId;
    private String activityType;
    private LocalDate activityDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private UUID locationId;
    private String description;
    private String observations;
    private UUID assignedById;
    private UUID supervisedById;
}


























