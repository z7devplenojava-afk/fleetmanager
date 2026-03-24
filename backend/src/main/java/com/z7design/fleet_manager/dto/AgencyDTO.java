package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Agency;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgencyDTO {
    
    private UUID id;
    private UUID bankId;
    private String bankName;
    private String bankCode;
    private String code;
    private String name;
    private String shortName;
    private String description;
    private Agency.AgencyStatus status;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String manager;
    private String managerPhone;
    private String managerEmail;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static AgencyDTO fromEntity(Agency entity) {
        if (entity == null) return null;
        
        return AgencyDTO.builder()
                .id(entity.getId())
                .bankId(entity.getBank() != null ? entity.getBank().getId() : null)
                .bankName(entity.getBank() != null ? entity.getBank().getName() : null)
                .bankCode(entity.getBank() != null ? entity.getBank().getCode() : null)
                .code(entity.getCode())
                .name(entity.getName())
                .shortName(entity.getShortName())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .city(entity.getCity())
                .state(entity.getState())
                .zipCode(entity.getZipCode())
                .manager(entity.getManager())
                .managerPhone(entity.getManagerPhone())
                .managerEmail(entity.getManagerEmail())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

