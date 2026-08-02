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
public class VehicleChecklistConfigCopyResponse {

    /** Quantidade de veículos que receberam a configuração com sucesso. */
    private int copied;

    /** IDs dos veículos que receberam a configuração. */
    private List<UUID> vehicleIds;

    /** Quantidade de itens aplicados. */
    private int itemsCount;
}
