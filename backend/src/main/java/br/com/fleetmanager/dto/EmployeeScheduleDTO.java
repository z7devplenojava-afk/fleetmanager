package br.com.fleetmanager.dto;

import lombok.Data;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;

@Data
public class EmployeeScheduleDTO {
    private UUID id;
    @NotNull(message = "Schedule ID is required")
    private UUID scheduleId;
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    @NotNull(message = "Position ID is required")
    private UUID positionId;
    private String observations;
} 