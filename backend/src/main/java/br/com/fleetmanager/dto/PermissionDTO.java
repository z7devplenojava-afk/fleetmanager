package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

import br.com.fleetmanager.model.Permission;

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