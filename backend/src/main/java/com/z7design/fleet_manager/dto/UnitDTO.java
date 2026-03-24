package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Unit;
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
    
    public static UnitDTO fromEntity(Unit unit) {
        if (unit == null) {
            return null;
        }
        
        return UnitDTO.builder()
                .id(unit.getId())
                .name(unit.getName())
                .description(unit.getDescription())
                .address(unit.getAddress())
                .phone(unit.getPhone())
                .email(unit.getEmail())
                .code(unit.getCode())
                .manager(unit.getManager())
                .active(unit.isActive())
                .createdAt(unit.getCreatedAt())
                .updatedAt(unit.getUpdatedAt())
                .parentId(unit.getParent() != null ? unit.getParent().getId() : null)
                .parentName(unit.getParent() != null ? unit.getParent().getName() : null)
                .clientId(unit.getClient() != null ? unit.getClient().getId() : null)
                .clientName(unit.getClient() != null ? unit.getClient().getName() : null)
                .build();
    }
    
    public Unit toEntity() {
        return Unit.builder()
                .id(this.id)
                .name(this.name)
                .description(this.description)
                .address(this.address)
                .phone(this.phone)
                .email(this.email)
                .code(this.code)
                .manager(this.manager)
                .active(this.active)
                .build();
    }
}
