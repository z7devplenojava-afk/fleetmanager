package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInventorySubmitCountDTO {

    private int countRound; // 1 = primeira contagem (cega), 2 = segunda contagem
    private List<WarehouseInventoryCountItemDTO> items;
}
