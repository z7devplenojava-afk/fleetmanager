package com.z7design.fleet_manager.dto.warehouse;

import com.z7design.fleet_manager.model.Tire;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mapeamento completo dos pneus montados no chassi do veículo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTireChassisDTO {

    private UUID vehicleId;
    private String plate;
    private String model;
    private String chassiType; // "4x2", "6x2", "ARTICULADO"
    private Integer currentKm;

    @Builder.Default
    private List<MountedPositionDTO> positions = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MountedPositionDTO {
        private String positionCode; // DE, DD, TIE, TOE, TID, TOD, AIE, AOE, AID, AOD, ESTEPE
        private Integer axleNumber;
        private Integer positionIndex;
        private String positionName; // "Dianteiro Esquerdo"
        private Tire tire; // null se desocupado
    }
}
