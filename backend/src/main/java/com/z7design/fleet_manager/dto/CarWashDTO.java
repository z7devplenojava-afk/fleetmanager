package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CarWash;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarWashDTO {
    private UUID id;
    private String name;
    private String cnpjCpf;
    private String phone;
    private String address;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal priceInternal;
    private BigDecimal priceExternal;
    private BigDecimal priceComplete;
    private BigDecimal priceSanitary;
    private UUID companyId;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CarWashDTO fromEntity(CarWash entity) {
        if (entity == null) return null;
        return CarWashDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .cnpjCpf(entity.getCnpjCpf())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .supplierId(entity.getSupplierId())
                .priceInternal(entity.getPriceInternal())
                .priceExternal(entity.getPriceExternal())
                .priceComplete(entity.getPriceComplete())
                .priceSanitary(entity.getPriceSanitary())
                .companyId(entity.getCompanyId())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
