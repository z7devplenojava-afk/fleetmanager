package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload para desmontagem/remoção de pneu do veículo com cálculo automático de KM e CPK.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TireDismountRequestDTO {

    private UUID tireId;
    private Integer currentVehicleKm;
    private BigDecimal treadDepthMm; // Medição do sulco na desmontagem
    private String removalReason; // 'ESTOQUE', 'ENVIAR_REFORMA', 'DESCARTE_SUCATA', 'FURO_AVARIA'
    private UUID targetLocationId; // Endereço de destino no almoxarifado
    private String notes;
}
