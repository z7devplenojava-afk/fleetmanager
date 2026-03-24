package com.z7design.fleet_manager.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class UserResponseDTO {
    private UUID id;
    private String username;
    private String email;
    private String name;
    private String fullName;
    private String role;
    private String status;
    private Boolean isActive;
    private Boolean active;
    private List<UserGroupDTO> groups;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
