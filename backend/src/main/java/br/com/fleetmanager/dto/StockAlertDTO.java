package br.com.fleetmanager.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.StockAlert;

@Data
public class StockAlertDTO {
    private UUID id;
    private UUID stockItemId;
    private String stockItemName;
    private String stockItemCode;
    private String alertType;
    private String message;
    private Integer currentQuantity;
    private Integer minimumQuantity;
    private Boolean isRead;
    private Boolean isResolved;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private UUID resolvedByUserId;
    private String resolvedByUserName;
    private Integer priority;

    public static StockAlertDTO fromEntity(StockAlert entity) {
        StockAlertDTO dto = new StockAlertDTO();
        dto.setId(entity.getId());
        dto.setAlertType(entity.getAlertType());
        dto.setMessage(entity.getMessage());
        dto.setCurrentQuantity(entity.getCurrentQuantity());
        dto.setMinimumQuantity(entity.getMinimumQuantity());
        dto.setIsRead(entity.getIsRead());
        dto.setIsResolved(entity.getIsResolved());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setPriority(entity.getPriority());

        if (entity.getStockItem() != null) {
            dto.setStockItemId(entity.getStockItem().getId());
            dto.setStockItemName(entity.getStockItem().getName());
            dto.setStockItemCode(entity.getStockItem().getCode());
        }

        if (entity.getResolvedByUser() != null) {
            dto.setResolvedByUserId(entity.getResolvedByUser().getId());
            dto.setResolvedByUserName(entity.getResolvedByUser().getName());
        }

        return dto;
    }
}