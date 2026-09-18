package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleCleaningOrder;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVehicleCleaningOrderRequest {

    @NotNull(message = "Veículo é obrigatório")
    private UUID vehicleId;

    private UUID driverId;

    private UUID driverUserId;

    private String driverPhone;

    @NotNull(message = "Tipo de limpeza é obrigatório")
    private VehicleCleaningOrder.CleaningType cleaningType;

    private String checklistData;

    private String observations;

    /** Setor solicitante; ausente = tratado como OPERATIONAL (pátio). */
    private VehicleCleaningOrder.RequesterSector requesterSector;

    /** Prioridade; ausente = prioridade padrão do setor. */
    private VehicleCleaningOrder.Priority priority;

    /** Horário limite de liberação (próxima saída/escala). */
    private LocalDateTime releaseDeadline;

    /** Vaga prevista no pátio para liberação (opcional). */
    private String releaseSpot;
}
