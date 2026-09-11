package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ContractRetentionDTO {

    private UUID id;
    private UUID companyId;
    private UUID unitId;
    private String unitName;

    private UUID clientId;
    private String clientName;

    private UUID contractId;
    private String contractNumber;

    private UUID measurementId;
    private String measurementNumber;

    private String referenceMonth;
    private BigDecimal measuredValue;
    private BigDecimal rmuDiscount;
    private BigDecimal retentionRate;
    private BigDecimal retentionValue;
    private BigDecimal netInvoicedValue;

    private RetentionStatus status;
    private LocalDate expectedReleaseDate;
    private LocalDate actualReleaseDate;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ContractRetentionDTO fromEntity(ContractRetention entity) {
        if (entity == null) return null;

        ContractRetentionDTO dto = new ContractRetentionDTO();
        dto.setId(entity.getId());
        
        if (entity.getCompany() != null) {
            dto.setCompanyId(entity.getCompany().getId());
        }
        if (entity.getUnit() != null) {
            dto.setUnitId(entity.getUnit().getId());
            dto.setUnitName(entity.getUnit().getName());
        }
        if (entity.getClient() != null) {
            dto.setClientId(entity.getClient().getId());
            dto.setClientName(entity.getClient().getName());
        }
        if (entity.getContract() != null) {
            dto.setContractId(entity.getContract().getId());
            dto.setContractNumber(entity.getContract().getContractNumber());
        }
        if (entity.getMeasurement() != null) {
            dto.setMeasurementId(entity.getMeasurement().getId());
            dto.setMeasurementNumber(entity.getMeasurement().getContractNumber());
        }

        dto.setReferenceMonth(entity.getReferenceMonth());
        dto.setMeasuredValue(entity.getMeasuredValue());
        dto.setRmuDiscount(entity.getRmuDiscount());
        dto.setRetentionRate(entity.getRetentionRate());
        dto.setRetentionValue(entity.getRetentionValue());
        dto.setNetInvoicedValue(entity.getNetInvoicedValue());
        dto.setStatus(entity.getStatus());
        dto.setExpectedReleaseDate(entity.getExpectedReleaseDate());
        dto.setActualReleaseDate(entity.getActualReleaseDate());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }
}
