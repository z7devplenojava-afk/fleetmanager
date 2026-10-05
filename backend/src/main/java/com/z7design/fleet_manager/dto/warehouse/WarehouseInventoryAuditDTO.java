package com.z7design.fleet_manager.dto.warehouse;

import com.z7design.fleet_manager.model.WarehouseInventoryAudit;
import com.z7design.fleet_manager.model.WarehouseInventoryAuditItem;
import com.z7design.fleet_manager.model.WarehouseInventoryScannedSerial;
import com.z7design.fleet_manager.model.enums.WarehouseInventoryScope;
import com.z7design.fleet_manager.model.enums.WarehouseInventoryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInventoryAuditDTO {

    private UUID id;
    private String code;
    private String description;
    private WarehouseInventoryScope scopeType;
    private UUID targetCategoryId;
    private String targetCategoryName;
    private UUID targetLocationId;
    private String targetLocationName;
    private Boolean freezeMovements;
    private WarehouseInventoryStatus status;
    private UUID openedByUserId;
    private String openedByName;
    private UUID approvedByUserId;
    private String approvedByName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String notes;

    private int totalItems;
    private int divergentItems;
    private BigDecimal totalDivergenceValue;

    @Builder.Default
    private List<ItemDTO> items = new ArrayList<>();

    @Builder.Default
    private List<ScannedSerialDTO> scannedSerials = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDTO {
        private UUID id;
        private UUID productId;
        private String productCode;
        private String productName;
        private String trackingType;
        private String unit;
        private UUID locationId;
        private String locationName;
        private BigDecimal unitCost;
        private BigDecimal quantitySystem;
        private BigDecimal quantityCount1;
        private BigDecimal quantityCount2;
        private BigDecimal quantityFinal;
        private BigDecimal difference;
        private BigDecimal divergenceValue;
        private String status;

        public static ItemDTO fromEntity(WarehouseInventoryAuditItem item, boolean blind) {
            ItemDTO dto = new ItemDTO();
            dto.setId(item.getId());
            if (item.getProduct() != null) {
                dto.setProductId(item.getProduct().getId());
                dto.setProductCode(item.getProduct().getCode());
                dto.setProductName(item.getProduct().getName());
                dto.setTrackingType(item.getProduct().getTrackingType() != null ? item.getProduct().getTrackingType().name() : "LIVRE");
                dto.setUnit(item.getProduct().getUnitMeasure());
            }
            if (item.getLocation() != null) {
                dto.setLocationId(item.getLocation().getId());
                dto.setLocationName(item.getLocation().getFullCode());
            }
            dto.setUnitCost(item.getUnitCost());
            // Contagem cega: se o status for EM_CONTAGEM e não tiver contagem 1 preenchida, não exibe quantitySystem
            dto.setQuantitySystem(blind ? null : item.getQuantitySystem());
            dto.setQuantityCount1(item.getQuantityCount1());
            dto.setQuantityCount2(item.getQuantityCount2());
            dto.setQuantityFinal(item.getQuantityFinal());
            dto.setDifference(blind ? null : item.getDifference());
            dto.setDivergenceValue(blind ? null : item.getDivergenceValue());
            dto.setStatus(item.getStatus());
            return dto;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScannedSerialDTO {
        private UUID id;
        private UUID productId;
        private String productName;
        private String serialOrDot;
        private Boolean foundInSystem;
        private LocalDateTime createdAt;

        public static ScannedSerialDTO fromEntity(WarehouseInventoryScannedSerial serial) {
            ScannedSerialDTO dto = new ScannedSerialDTO();
            dto.setId(serial.getId());
            if (serial.getProduct() != null) {
                dto.setProductId(serial.getProduct().getId());
                dto.setProductName(serial.getProduct().getName());
            }
            dto.setSerialOrDot(serial.getSerialOrDot());
            dto.setFoundInSystem(serial.getFoundInSystem());
            dto.setCreatedAt(serial.getCreatedAt());
            return dto;
        }
    }

    public static WarehouseInventoryAuditDTO fromEntity(WarehouseInventoryAudit audit, boolean blind) {
        WarehouseInventoryAuditDTO dto = new WarehouseInventoryAuditDTO();
        dto.setId(audit.getId());
        dto.setCode(audit.getCode());
        dto.setDescription(audit.getDescription());
        dto.setScopeType(audit.getScopeType());
        if (audit.getTargetCategory() != null) {
            dto.setTargetCategoryId(audit.getTargetCategory().getId());
            dto.setTargetCategoryName(audit.getTargetCategory().getName());
        }
        if (audit.getTargetLocation() != null) {
            dto.setTargetLocationId(audit.getTargetLocation().getId());
            dto.setTargetLocationName(audit.getTargetLocation().getFullCode());
        }
        dto.setFreezeMovements(audit.getFreezeMovements());
        dto.setStatus(audit.getStatus());
        dto.setOpenedByUserId(audit.getOpenedByUserId());
        dto.setApprovedByUserId(audit.getApprovedByUserId());
        dto.setOpenedAt(audit.getOpenedAt());
        dto.setClosedAt(audit.getClosedAt());
        dto.setNotes(audit.getNotes());

        int total = 0;
        int divergent = 0;
        BigDecimal totalDivergence = BigDecimal.ZERO;

        List<ItemDTO> itemDTOs = new ArrayList<>();
        if (audit.getItems() != null) {
            for (WarehouseInventoryAuditItem item : audit.getItems()) {
                total++;
                if ("DIVERGENTE".equalsIgnoreCase(item.getStatus())) {
                    divergent++;
                }
                if (item.getDivergenceValue() != null) {
                    totalDivergence = totalDivergence.add(item.getDivergenceValue());
                }
                itemDTOs.add(ItemDTO.fromEntity(item, blind));
            }
        }
        dto.setTotalItems(total);
        dto.setDivergentItems(divergent);
        dto.setTotalDivergenceValue(totalDivergence);
        dto.setItems(itemDTOs);

        List<ScannedSerialDTO> serialDTOs = new ArrayList<>();
        if (audit.getScannedSerials() != null) {
            for (WarehouseInventoryScannedSerial s : audit.getScannedSerials()) {
                serialDTOs.add(ScannedSerialDTO.fromEntity(s));
            }
        }
        dto.setScannedSerials(serialDTOs);

        return dto;
    }
}
