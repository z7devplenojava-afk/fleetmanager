package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockReportDTO {
    private Long totalItems;
    private Long lowStockItems;
    private Long outOfStockItems;
    private Long criticalItems; // Itens com estoque <= 10% do mÃ­nimo
    private BigDecimal totalValueAtRisk;
    private List<StockItemReportDTO> items;
    private List<StockItemReportDTO> criticalItemsList;
    private List<StockItemReportDTO> outOfStockItemsList;
}


