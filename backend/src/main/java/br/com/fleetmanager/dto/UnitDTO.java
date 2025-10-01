package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitDTO {
    
    private UUID id;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String email;
    private String code;
    private String manager;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Relacionamentos simplificados
    private UUID parentId;
    private String parentName;
    private UUID clientId;
    private String clientName;
    
    // Contadores
    private Long employeeCount;
    private Long childrenCount;
}