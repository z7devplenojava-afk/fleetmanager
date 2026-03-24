package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CompanyDefaultEPI;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CompanyDefaultEPIDTO {
    
    private UUID id;
    
    @NotBlank(message = "EPI name is required")
    @Size(max = 255, message = "EPI name must not exceed 255 characters")
    private String epiName;
    
    @NotNull(message = "Quantity is required")
    @Builder.Default
    private Integer quantity = 1;
    
    @Size(max = 50, message = "CA number must not exceed 50 characters")
    private String caNumber;
    
    @Size(max = 100, message = "Validity must not exceed 100 characters")
    private String validity;
    
    private String observations;
    
    @NotNull(message = "Order index is required")
    @Builder.Default
    private Integer orderIndex = 0;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static CompanyDefaultEPIDTO fromEntity(CompanyDefaultEPI epi) {
        if (epi == null) {
            return null;
        }
        
        return CompanyDefaultEPIDTO.builder()
                .id(epi.getId())
                .epiName(epi.getEpiName())
                .quantity(epi.getQuantity())
                .caNumber(epi.getCaNumber())
                .validity(epi.getValidity())
                .observations(epi.getObservations())
                .orderIndex(epi.getOrderIndex())
                .createdAt(epi.getCreatedAt())
                .updatedAt(epi.getUpdatedAt())
                .build();
    }
    
    public CompanyDefaultEPI toEntity() {
        CompanyDefaultEPI epi = new CompanyDefaultEPI();
        epi.setId(this.id);
        epi.setEpiName(this.epiName);
        epi.setQuantity(this.quantity);
        epi.setCaNumber(this.caNumber);
        epi.setValidity(this.validity);
        epi.setObservations(this.observations);
        epi.setOrderIndex(this.orderIndex);
        return epi;
    }
}


