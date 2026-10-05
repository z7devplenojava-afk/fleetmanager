package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload para montagem de pneu em um eixo/posição do veículo da frota.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TireMountRequestDTO {

    private UUID tireId;
    private UUID vehicleId;
    private Integer axleNumber; // 1 (Dianteiro), 2 (Tração), 3 (Truck/Auxiliar)
    private Integer positionIndex; // 0, 1, 2, 3
    private String positionCode; // DE, DD, TIE, TOE, TID, TOD, AIE, AOE, AID, AOD, ESTEPE
    private Integer currentVehicleKm;
    private BigDecimal treadDepthMm; // Medição do sulco no momento da montagem
    private String notes;
}
