package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInventoryCountItemDTO {

    private UUID itemId;
    private BigDecimal countedQuantity;
    private List<String> scannedSerials; // Para itens rastreáveis (pneus, baterias)
}
