package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.FleetWorkOrderHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetWorkOrderHistoryDTO {

    private UUID id;
    private UUID workOrderId;
    private String actionType;
    private String description;
    private String performedBy;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;

    public static FleetWorkOrderHistoryDTO fromEntity(FleetWorkOrderHistory e) {
        if (e == null) return null;
        return FleetWorkOrderHistoryDTO.builder()
                .id(e.getId())
                .workOrderId(e.getWorkOrderId())
                .actionType(e.getActionType())
                .description(e.getDescription())
                .performedBy(e.getPerformedBy())
                .oldValue(e.getOldValue())
                .newValue(e.getNewValue())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
