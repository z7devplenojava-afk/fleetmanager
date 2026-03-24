package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.fleet_manager.model.FinancialTransaction;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.repository.SupplierRepository;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransactionDTO {
    private UUID id;
    private String type;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate date;
    @NotBlank(message = "Status Ã© obrigatÃ³rio")
    private String status;
    private String reference;
    private String notes;
    private UUID unitId;
    private String unitName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate dueDate;
    private String expenseType;
    private String costCenter;
    private String barcode;
    private String receiptUrl;
    private java.util.UUID supplierId;
    private String supplierName; // Adicionado campo para o nome do fornecedor

    public static FinancialTransactionDTO fromEntity(FinancialTransaction entity) {
        return new FinancialTransactionDTO(
            entity.getId(),
            entity.getType(),
            entity.getCategory(),
            entity.getDescription(),
            entity.getAmount(),
            entity.getDate(),
            entity.getStatus(),
            entity.getReference(),
            entity.getNotes(),
            entity.getUnit() != null ? entity.getUnit().getId() : null,
            entity.getUnit() != null ? entity.getUnit().getName() : null,
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getDueDate(),
            entity.getExpenseType() != null ? entity.getExpenseType().name() : null,
            entity.getCostCenter(),
            entity.getBarcode(),
            entity.getReceiptUrl(),
            entity.getSupplier() != null ? entity.getSupplier().getId() : null,
            entity.getSupplier() != null ? entity.getSupplier().getName() : null // Mapeando o nome do fornecedor
        );
    }

    public static FinancialTransaction toEntity(FinancialTransactionDTO dto, UnitRepository unitRepository, SupplierRepository supplierRepository) {
        FinancialTransaction entity = new FinancialTransaction();
        entity.setId(dto.getId());
        entity.setType(dto.getType());
        entity.setCategory(dto.getCategory());
        entity.setDescription(dto.getDescription());
        entity.setAmount(dto.getAmount());
        entity.setDate(dto.getDate());
        entity.setStatus(dto.getStatus());
        entity.setReference(dto.getReference());
        entity.setNotes(dto.getNotes());
        entity.setDueDate(dto.getDueDate());
        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                .orElseThrow(() -> new RuntimeException("Unit not found: " + dto.getUnitId()));
            entity.setUnit(unit);
        } else {
            entity.setUnit(null);
        }
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());
        if (dto.getExpenseType() != null) {
            entity.setExpenseType(com.z7design.fleet_manager.model.enums.ExpenseType.valueOf(dto.getExpenseType()));
        }
        entity.setCostCenter(dto.getCostCenter());
        entity.setBarcode(dto.getBarcode());
        entity.setReceiptUrl(dto.getReceiptUrl());
        if (dto.getSupplierId() != null) {
            if (supplierRepository != null) {
                Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                    .orElse(null);
                entity.setSupplier(supplier);
            } else {
                // RepositÃ³rio nÃ£o injetado no chamador; mantÃ©m sem fornecedor para evitar NPE
                entity.setSupplier(null);
            }
        }
        return entity;
    }
} 
