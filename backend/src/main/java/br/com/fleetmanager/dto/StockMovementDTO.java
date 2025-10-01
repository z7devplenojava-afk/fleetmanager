package br.com.fleetmanager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.StockMovement;
import br.com.fleetmanager.model.enums.MovementReason;
import br.com.fleetmanager.model.enums.MovementType;

@Data
public class StockMovementDTO {
    private UUID id;
    private UUID stockItemId;
    private String stockItemName;
    private String stockItemCode;
    private String stockItemFullName;
    private MovementType movementType;
    private MovementReason reason;
    private Integer quantity;
    private Integer previousQuantity;
    private Integer newQuantity;
    private UUID employeeId;
    private String employeeName;
    private UUID userId;
    private String userName;
    private String documentNumber;
    private String supplier;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private LocalDateTime movementDate;
    private String notes;
    private String qrCodeUsed;
    private UUID unitId;
    private String unitName;

    public static StockMovementDTO fromEntity(StockMovement entity) {
        StockMovementDTO dto = new StockMovementDTO();
        dto.setId(entity.getId());
        dto.setMovementType(entity.getMovementType());
        dto.setReason(entity.getReason());
        dto.setQuantity(entity.getQuantity());
        dto.setPreviousQuantity(entity.getPreviousQuantity());
        dto.setNewQuantity(entity.getNewQuantity());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setUserName(entity.getUserName());
        dto.setDocumentNumber(entity.getDocumentNumber());
        dto.setSupplier(entity.getSupplier());
        dto.setUnitCost(entity.getUnitCost());
        dto.setTotalCost(entity.getTotalCost());
        dto.setMovementDate(entity.getMovementDate());
        dto.setNotes(entity.getNotes());
        dto.setQrCodeUsed(entity.getQrCodeUsed());

        if (entity.getStockItem() != null) {
            dto.setStockItemId(entity.getStockItem().getId());
            dto.setStockItemName(entity.getStockItem().getName());
            dto.setStockItemCode(entity.getStockItem().getCode());
            dto.setStockItemFullName(entity.getStockItem().getFullName());
        }

        if (entity.getEmployee() != null) {
            dto.setEmployeeId(entity.getEmployee().getId());
        }

        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
        }

        if (entity.getUnit() != null) {
            dto.setUnitId(entity.getUnit().getId());
            dto.setUnitName(entity.getUnit().getName());
        }

        return dto;
    }

    public static StockMovement toEntity(StockMovementDTO dto) {
        StockMovement entity = new StockMovement();
        entity.setId(dto.getId());
        entity.setMovementType(dto.getMovementType());
        entity.setReason(dto.getReason());
        entity.setQuantity(dto.getQuantity());
        entity.setPreviousQuantity(dto.getPreviousQuantity());
        entity.setNewQuantity(dto.getNewQuantity());
        entity.setEmployeeName(dto.getEmployeeName());
        entity.setUserName(dto.getUserName());
        entity.setDocumentNumber(dto.getDocumentNumber());
        entity.setSupplier(dto.getSupplier());
        entity.setUnitCost(dto.getUnitCost());
        entity.setTotalCost(dto.getTotalCost());
        entity.setNotes(dto.getNotes());
        entity.setQrCodeUsed(dto.getQrCodeUsed());
        return entity;
    }
}