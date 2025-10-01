package br.com.fleetmanager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import br.com.fleetmanager.model.MeasurementBulletin;
import br.com.fleetmanager.model.enums.MeasurementStatus;

@Data
public class MeasurementBulletinDTO {
    private UUID id;
    private String companyName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String contractNumber;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private String nfNumber;
    private String elaboratedBy;
    private String measuredBy;
    private String validatedBy;
    private String checkedBy;
    private MeasurementStatus status;
    private BigDecimal subtotal;
    private List<MeasurementItemDTO> items;
    private UUID clientId;
    private String clientName;
    private UUID contractId;
    private UUID unitId;
    private String unitName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String notes;
    private CalculationMemoryDTO calculationMemory;

    public static MeasurementBulletinDTO fromEntity(MeasurementBulletin entity) {
        MeasurementBulletinDTO dto = new MeasurementBulletinDTO();
        dto.setId(entity.getId());
        dto.setCompanyName(entity.getCompanyName());
        dto.setPeriodStart(entity.getPeriodStart());
        dto.setPeriodEnd(entity.getPeriodEnd());
        dto.setContractNumber(entity.getContractNumber());
        dto.setContractStart(entity.getContractStart());
        dto.setContractEnd(entity.getContractEnd());
        dto.setNfNumber(entity.getNfNumber());
        dto.setElaboratedBy(entity.getElaboratedBy());
        dto.setMeasuredBy(entity.getMeasuredBy());
        dto.setValidatedBy(entity.getValidatedBy());
        dto.setCheckedBy(entity.getCheckedBy());
        dto.setStatus(entity.getStatus());
        dto.setSubtotal(entity.getSubtotal());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setNotes(entity.getNotes());

        if (entity.getClient() != null) {
            dto.setClientId(entity.getClient().getId());
            dto.setClientName(entity.getClient().getName());
        }

        if (entity.getContract() != null) {
            dto.setContractId(entity.getContract().getId());
        }

        if (entity.getUnit() != null) {
            dto.setUnitId(entity.getUnit().getId());
            dto.setUnitName(entity.getUnit().getName());
        }

        if (entity.getItems() != null) {
            dto.setItems(entity.getItems().stream()
                    .map(MeasurementItemDTO::fromEntity)
                    .collect(Collectors.toList()));
        }

        // Note: calculationMemory não é uma relação direta na entidade MeasurementBulletin
        // Será tratado separadamente no serviço

        return dto;
    }

    public static MeasurementBulletin toEntity(MeasurementBulletinDTO dto) {
        MeasurementBulletin entity = new MeasurementBulletin();
        entity.setId(dto.getId());
        if (dto.getCompanyName() != null) {
            entity.setCompanyName(dto.getCompanyName());
        }
        entity.setPeriodStart(dto.getPeriodStart());
        entity.setPeriodEnd(dto.getPeriodEnd());
        entity.setContractNumber(dto.getContractNumber());
        entity.setContractStart(dto.getContractStart());
        entity.setContractEnd(dto.getContractEnd());
        entity.setNfNumber(dto.getNfNumber());
        entity.setElaboratedBy(dto.getElaboratedBy());
        entity.setMeasuredBy(dto.getMeasuredBy());
        entity.setValidatedBy(dto.getValidatedBy());
        entity.setCheckedBy(dto.getCheckedBy());
        entity.setStatus(dto.getStatus());
        entity.setSubtotal(dto.getSubtotal());
        entity.setNotes(dto.getNotes());
        return entity;
    }
}