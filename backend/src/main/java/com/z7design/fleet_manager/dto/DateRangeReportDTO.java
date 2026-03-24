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
public class DateRangeReportDTO {
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long totalMovements;
    private Long totalEntries;
    private Long totalExits;
    private Integer totalQuantityEntered;
    private Integer totalQuantityExited;
    private BigDecimal totalCostEntered;
    private BigDecimal totalCostExited;
    private Map<String, DailySummaryDTO> dailySummaries;
    private Map<String, MonthlySummaryDTO> monthlySummaries;
    private List<StockItemReportDTO> itemsWithMovements;
    private List<CategorySummaryDTO> categorySummaries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySummaryDTO {
        private String date;
        private Long movements;
        private Integer entries;
        private Integer exits;
        private BigDecimal costEntered;
        private BigDecimal costExited;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySummaryDTO {
        private String month;
        private Long movements;
        private Integer entries;
        private Integer exits;
        private BigDecimal costEntered;
        private BigDecimal costExited;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummaryDTO {
        private String category;
        private Long totalMovements;
        private Integer totalQuantity;
        private BigDecimal totalCost;
        private Long itemsCount;
    }
}


