package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.Permission;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDTO {
    private UUID id;
    private String name;
    private String description;
    private Set<String> permissionNames;

    public static RoleDTO fromEntity(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissionNames(role.getPermissions() != null ? 
                    role.getPermissions().stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet()) : 
                    Set.of())
                .build();
    }
} 
