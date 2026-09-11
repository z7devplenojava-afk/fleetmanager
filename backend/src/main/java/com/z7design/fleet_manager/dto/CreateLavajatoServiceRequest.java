package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateLavajatoServiceRequest {

    @NotNull(message = "Veículo é obrigatório")
    private UUID vehicleId;

    private UUID driverId;

    private UUID driverUserId;

    private String driverPhone;

    private String checklistInternal;

    private String checklistExternal;

    private String observations;
}
