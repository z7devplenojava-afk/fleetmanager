package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.ScheduleStatus;
import com.z7design.fleet_manager.model.enums.Shift;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateScheduleDTO {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    // LocationId Ã© opcional se workPostId for fornecido (o backend criarÃ¡ a
    // Location automaticamente)
    private UUID locationId;

    private UUID workPostId; // Posto de trabalho (opcional, mas recomendado)

    private UUID travelTripId; // Viagem associada (alternativa ao workPostId)

    private Integer legs; // Número de pegadas (1-4)

    @NotNull(message = "Schedule date is required")
    private LocalDate scheduleDate;

    @NotNull(message = "Shift is required")
    private Shift shift;

    @NotNull(message = "Status is required")
    private ScheduleStatus status;

    private String observations;

    private UUID routeId;

    private UUID vehicleId;
}
