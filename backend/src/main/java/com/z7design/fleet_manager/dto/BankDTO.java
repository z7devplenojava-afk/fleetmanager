package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Bank;
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
public class BankDTO {
    
    private UUID id;
    private String code;
    private String name;
    private String shortName;
    private String cnpj;
    private String description;
    private Bank.BankStatus status;
    private String website;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static BankDTO fromEntity(Bank entity) {
        if (entity == null) return null;
        
        return BankDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .shortName(entity.getShortName())
                .cnpj(entity.getCnpj())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .website(entity.getWebsite())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .city(entity.getCity())
                .state(entity.getState())
                .zipCode(entity.getZipCode())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

