package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleChecklistConfigCopyRequest {

    /**
     * Veículos de destino que receberão a configuração (substituindo a existente).
     * Obrigatório e não pode ser vazio.
     */
    private List<UUID> targetVehicleIds;

    /**
     * Itens do checklist a aplicar nos veículos de destino.
     * Itens com título vazio são ignorados.
     */
    private List<VehicleChecklistConfigDTO> items;
}
