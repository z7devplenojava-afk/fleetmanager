package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.WorkOrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderItemDTO {

    private UUID id;
    private String description;
    private WorkOrderItem.ItemType type;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private UUID productId;
    private String provider;
    private LocalDateTime createdAt;

    public static WorkOrderItemDTO fromEntity(WorkOrderItem entity) {
        if (entity == null)
            return null;
        return WorkOrderItemDTO.builder()
                .id(entity.getId())
                .description(entity.getDescription())
                .type(entity.getType())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .totalPrice(entity.getTotalPrice())
                .productId(entity.getProductId())
                .provider(entity.getProvider())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
