package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.UserRole;
import com.z7design.fleet_manager.model.enums.UserStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponseDTO {
    
    private String id; // UUID como string para compatibilidade
    private String username;
    private String email;
    private String name;
    private List<String> roles;
    private UserStatus status;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UserGroupDTO> groups;
    
    // Campos opcionais para compatibilidade com o frontend
    private String avatar;
    private String department;
    private String position;
    private String employeeCode;
    private String phone;
    private String address;
    private String companyId;
    private String companyName;
    private Boolean isOnline; // Status online/offline do usuário
} 
