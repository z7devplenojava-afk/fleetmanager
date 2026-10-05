package com.z7design.fleet_manager.dto.warehouse;

import com.z7design.fleet_manager.model.enums.WarehouseInventoryScope;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInventoryCreateDTO {

    private String code;
    private String description;
    private WarehouseInventoryScope scopeType;
    private UUID targetCategoryId;
    private UUID targetLocationId;
    private Boolean freezeMovements;
    private String notes;
}
