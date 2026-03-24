package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.StockCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockItemReportDTO {
    private UUID id;
    private String code;
    private String name;
    private StockCategory category;
    private String sizeVariation;
    private Integer currentQuantity;
    private Integer minimumQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalValue;
    private String supplier;
    private String unitName;
    private LocalDateTime lastMovementDate;
    private Long totalMovements;
    private Long totalEntries;
    private Long totalExits;
    private Integer totalQuantityEntered;
    private Integer totalQuantityExited;
    private BigDecimal totalCostEntered;
    private BigDecimal totalCostExited;
    private Double turnoverRate; // Giro de estoque
    private Integer averageMonthlyConsumption;
    private String status; // NORMAL, LOW, OUT, OVER
    private List<MovementSummaryDTO> recentMovements;
}


