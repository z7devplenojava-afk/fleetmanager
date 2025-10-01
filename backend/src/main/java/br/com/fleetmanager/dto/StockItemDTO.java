package br.com.fleetmanager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.StockItem;
import br.com.fleetmanager.model.enums.StockCategory;

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
    private String supplier;
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
        dto.setSupplier(entity.getSupplier());
        dto.setBarcode(entity.getBarcode());
        dto.setQrCode(entity.getQrCode());
        dto.setActive(entity.getActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setNotes(entity.getNotes());
        dto.setIsLowStock(entity.isLowStock());
        dto.setFullName(entity.getFullName());

        if (entity.getUnit() != null) {
            dto.setUnitId(entity.getUnit().getId());
            dto.setUnitName(entity.getUnit().getName());
        }

        return dto;
    }

    public static StockItem toEntity(StockItemDTO dto) {
        StockItem entity = new StockItem();
        entity.setId(dto.getId());
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setCategory(dto.getCategory());
        entity.setSizeVariation(dto.getSizeVariation());
        entity.setDescription(dto.getDescription());
        entity.setCurrentQuantity(dto.getCurrentQuantity());
        entity.setMinimumQuantity(dto.getMinimumQuantity());
        entity.setUnitCost(dto.getUnitCost());
        entity.setSupplier(dto.getSupplier());
        entity.setBarcode(dto.getBarcode());
        entity.setQrCode(dto.getQrCode());
        entity.setActive(dto.getActive());
        entity.setNotes(dto.getNotes());
        return entity;
    }
}