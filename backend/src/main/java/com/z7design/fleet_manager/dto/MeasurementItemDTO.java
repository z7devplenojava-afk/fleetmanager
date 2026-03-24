package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class MeasurementItemDTO {
    private UUID id;
    private Integer itemNumber;
    private String code;
    private String description;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalValue;
    private UUID bulletinId;
    private String costCenterId;
    private String costCenterName;
    private String vehiclePlate;
    private Integer tripCount;
    private Boolean isExtraTrip;
    private BigDecimal baseValue;
    private Integer workingDays;
    private MeasurementCategory category;
    private BigDecimal initialKm;
    private BigDecimal finalKm;
    private BigDecimal franchiseKm;
    private BigDecimal disregardedKm;

    public static MeasurementItemDTO fromEntity(MeasurementItem entity) {
        MeasurementItemDTO dto = new MeasurementItemDTO();
        dto.setId(entity.getId());
        dto.setItemNumber(entity.getItemNumber());
        dto.setCode(entity.getCode());
        dto.setDescription(entity.getDescription());
        dto.setUnit(entity.getUnit());
        dto.setQuantity(entity.getQuantity());
        dto.setUnitPrice(entity.getUnitPrice());
        dto.setTotalValue(entity.getTotalValue());
        dto.setCostCenterName(entity.getCostCenterName());
        dto.setVehiclePlate(entity.getVehiclePlate());
        dto.setTripCount(entity.getTripCount());
        dto.setIsExtraTrip(entity.getIsExtraTrip());
        dto.setBaseValue(entity.getBaseValue());
        dto.setWorkingDays(entity.getWorkingDays());
        dto.setCategory(entity.getCategory());
        dto.setInitialKm(entity.getInitialKm());
        dto.setFinalKm(entity.getFinalKm());
        dto.setFranchiseKm(entity.getFranchiseKm());
        dto.setDisregardedKm(entity.getDisregardedKm());

        if (entity.getBulletin() != null) {
            dto.setBulletinId(entity.getBulletin().getId());
        }

        if (entity.getCostCenterId() != null) {
            dto.setCostCenterId(entity.getCostCenterId());
        }

        return dto;
    }

    public static MeasurementItem toEntity(MeasurementItemDTO dto) {
        MeasurementItem entity = new MeasurementItem();
        entity.setId(dto.getId());
        entity.setItemNumber(dto.getItemNumber());
        entity.setCode(dto.getCode());
        entity.setDescription(dto.getDescription());
        entity.setUnit(dto.getUnit());
        entity.setQuantity(dto.getQuantity());
        entity.setUnitPrice(dto.getUnitPrice());
        // NÃ£o definir totalValue - serÃ¡ calculado automaticamente pelo banco de dados
        // entity.setTotalValue(dto.getTotalValue());
        entity.setCostCenterName(dto.getCostCenterName());
        entity.setVehiclePlate(dto.getVehiclePlate());
        entity.setTripCount(dto.getTripCount());
        entity.setIsExtraTrip(dto.getIsExtraTrip());
        entity.setBaseValue(dto.getBaseValue());
        entity.setWorkingDays(dto.getWorkingDays());
        entity.setCategory(dto.getCategory());
        entity.setInitialKm(dto.getInitialKm());
        entity.setFinalKm(dto.getFinalKm());
        entity.setFranchiseKm(dto.getFranchiseKm());
        entity.setDisregardedKm(dto.getDisregardedKm());
        if (dto.getCostCenterId() != null) {
            entity.setCostCenterId(dto.getCostCenterId());
        }
        return entity;
    }
}
