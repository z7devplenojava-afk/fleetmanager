package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovementsReportDTO {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long totalMovements;
    private Long totalEntries;
    private Long totalExits;
    private Integer totalQuantityEntered;
    private Integer totalQuantityExited;
    private BigDecimal totalCostEntered;
    private BigDecimal totalCostExited;
    private List<MovementSummaryDTO> movements;
    private Map<String, Long> movementsByType;
    private Map<String, Long> movementsByReason;
    private Map<String, Integer> movementsByDay;
    private Map<String, Integer> movementsByMonth;
    private List<ItemMovementSummaryDTO> topMovedItems;
    private List<EmployeeMovementSummaryDTO> topEmployees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemMovementSummaryDTO {
        private String itemId;
        private String itemName;
        private String itemCode;
        private Long movementCount;
        private Integer totalQuantity;
        private BigDecimal totalCost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeMovementSummaryDTO {
        private String employeeId;
        private String employeeName;
        private Long movementCount;
        private Integer totalQuantity;
        private List<String> itemsReceived;
    }
}


