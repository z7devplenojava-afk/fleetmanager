package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Permission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionDTO {
    private UUID id;
    private String name;
    private String description;

    public static PermissionDTO fromEntity(Permission permission) {
        if (permission == null) return null;
        return new PermissionDTO(
            permission.getId(),
            permission.getName(),
            permission.getDescription()
        );
    }
} 
