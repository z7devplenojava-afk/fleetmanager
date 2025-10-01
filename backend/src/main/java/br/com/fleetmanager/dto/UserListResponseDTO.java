package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.UserRole;
import br.com.fleetmanager.model.enums.UserStatus;

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
} 