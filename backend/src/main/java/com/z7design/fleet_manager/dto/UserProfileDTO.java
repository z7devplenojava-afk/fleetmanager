package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID id;
    private String username;
    private String email;
    private String name;
    private String whatsapp;
    private List<String> roles;
    private String status;
    private boolean active;
    private boolean firstAccess;
    private boolean twoFactorEnabled;
    private LocalDateTime lastPasswordChange;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FunctionalityDTO> functionalities;
}


