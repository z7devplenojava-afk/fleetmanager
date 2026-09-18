package com.z7design.fleet_manager.dto.client;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReserveVehicleRequestDTO {
    private UUID contractId;
    
    @NotBlank(message = "A placa ou identificação do veículo com problema é obrigatória")
    private String affectedVehiclePlate;

    @NotBlank(message = "O motivo da solicitação é obrigatório")
    private String reason;

    private String observations;
    
    private Boolean isExtraReserve;
}
