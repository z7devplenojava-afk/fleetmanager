package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.enums.StockCategory;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class StockItemDTO {
    private UUID id;
    private String code;
    private String name;
    private StockCategory category;
    private String sizeVariation;
    private String description;
    private Integer currentQuantity;
    private Integer minimumQuantity;
    private BigDecimal unitCost;
    private BigDecimal averageCost;
    private Integer movementCount;
    private String supplier;
    private String invoiceNumber;
    private String barcode;
    private String qrCode;
    private Boolean active;
    private UUID unitId;
    private String unitName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String notes;
    private Boolean isLowStock;
    private String fullName;
    private String caNumber;
    private java.time.LocalDate caValidity;
    private String manufacturer;
    private UUID epiId;

    public static StockItemDTO fromEntity(StockItem entity) {
        StockItemDTO dto = new StockItemDTO();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setSizeVariation(entity.getSizeVariation());
        dto.setDescription(entity.getDescription());
        dto.setCurrentQuantity(entity.getCurrentQuantity());
        dto.setMinimumQuantity(entity.getMinimumQuantity());
        dto.setUnitCost(entity.getUnitCost());
        dto.setAverageCost(entity.getAverageCost());
        dto.setSupplier(entity.getSupplier());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setBarcode(entity.getBarcode());
        dto.setQrCode(entity.getQrCode());
        dto.setCaNumber(entity.getCaNumber());
        dto.setCaValidity(entity.getCaValidity());
        dto.setManufacturer(entity.getManufacturer());
        dto.setEpiId(entity.getEpiId());
        dto.setActive(entity.getActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setNotes(entity.getNotes());
        dto.setIsLowStock(entity.isLowStock());
        dto.setFullName(entity.getFullName());
        dto.setMovementCount(0);

        if (entity.getUnit() != null) {
            dto.setUnitId(entity.getUnit().getId());
            dto.setUnitName(entity.getUnit().getName());
        }

        return dto;
    }

    public static StockItem toEntity(StockItemDTO dto) {
        StockItem entity = new StockItem();
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setCategory(dto.getCategory());
        entity.setSizeVariation(dto.getSizeVariation());
        entity.setDescription(dto.getDescription());
        entity.setCurrentQuantity(dto.getCurrentQuantity() != null ? dto.getCurrentQuantity() : 0);
        entity.setMinimumQuantity(dto.getMinimumQuantity() != null ? dto.getMinimumQuantity() : 0);
        entity.setUnitCost(dto.getUnitCost());
        entity.setAverageCost(dto.getAverageCost());
        entity.setSupplier(dto.getSupplier());
        entity.setInvoiceNumber(dto.getInvoiceNumber());
        entity.setBarcode(dto.getBarcode());
        entity.setQrCode(dto.getQrCode());
        entity.setCaNumber(dto.getCaNumber());
        entity.setCaValidity(dto.getCaValidity());
        entity.setManufacturer(dto.getManufacturer());
        entity.setEpiId(dto.getEpiId());
        entity.setActive(dto.getActive() != null ? dto.getActive() : Boolean.TRUE);
        entity.setNotes(dto.getNotes());
        return entity;
    }
}
