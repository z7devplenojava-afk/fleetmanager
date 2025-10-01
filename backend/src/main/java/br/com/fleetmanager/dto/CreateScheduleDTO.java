package br.com.fleetmanager.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.enums.ScheduleStatus;
import br.com.fleetmanager.model.enums.Shift;

@Data
public class CreateScheduleDTO {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    
    @NotNull(message = "Location ID is required")
    private UUID locationId;
    
    @NotNull(message = "Schedule date is required")
    private LocalDate scheduleDate;
    
    @NotNull(message = "Shift is required")
    private Shift shift;
    
    @NotNull(message = "Status is required")
    private ScheduleStatus status;
    
    private String observations;
}