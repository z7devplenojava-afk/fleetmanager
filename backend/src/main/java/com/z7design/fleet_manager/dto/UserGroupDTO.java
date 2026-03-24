package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import lombok.Data;

@Data
public class UserGroupDTO {
    private UUID id;
    private String name;
    private String displayName;
    private String description;
    private String groupName; // Campo adicionado para compatibilidade
    private Set<String> permissions;
    private Long userCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
