package br.com.fleetmanager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import br.com.fleetmanager.model.MeasurementItem;

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
        entity.setTotalValue(dto.getTotalValue());
        entity.setCostCenterName(dto.getCostCenterName());
        return entity;
    }
}