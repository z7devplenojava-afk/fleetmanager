package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovementSummaryDTO {
    private UUID id;
    private LocalDateTime movementDate;
    private MovementType movementType;
    private MovementReason reason;
    private Integer quantity;
    private Integer previousQuantity;
    private Integer newQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String employeeName;
    private String userName;
    private String documentNumber;
    private String itemName;
    private String itemCode;
}


