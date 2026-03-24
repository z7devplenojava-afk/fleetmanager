package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVacationCoverageRequest {
    
    private UUID vacationId;
    private UUID employeeId; // ID do funcionÃ¡rio em fÃ©rias (para criar vacation se nÃ£o existir)
    private UUID substituteEmployeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private UUID locationId;
    private String shift; // DAY, NIGHT, MIXED
    private String observations;
}


























