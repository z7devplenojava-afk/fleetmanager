package com.z7design.fleet_manager.dto.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockItemAvailabilityDTO {
    private UUID stockItemId;
    private String itemName;
    private String itemCode;
    private BigDecimal currentQuantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableFreeQuantity;
    private boolean isAvailable;
    private boolean hasConflict;
    
    @Builder.Default
    private List<ReservationConflictDetailDTO> activeReservations = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationConflictDetailDTO {
        private UUID reservationId;
        private UUID workOrderId;
        private String workOrderNumber;
        private UUID vehicleId;
        private String vehiclePlate;
        private String vehicleModel;
        private BigDecimal quantityReserved;
        private String status;
    }
}
