package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.z7design.fleet_manager.model.VehicleRentalExpense;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleRentalExpenseDTO {

    private UUID id;
    private UUID vehicleId;
    private UUID clientId;
    private String clientName;
    private UUID workPostId;
    private String workPostName;
    private String contractNumber;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expenseDate;
    private String category;
    private String description;
    private String documentNumber;
    private BigDecimal amount;
    private String responsibility;
    private String reimbursementStatus;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleRentalExpenseDTO fromEntity(VehicleRentalExpense e) {
        if (e == null) return null;
        return VehicleRentalExpenseDTO.builder()
                .id(e.getId())
                .vehicleId(e.getVehicleId())
                .clientId(e.getClientId())
                .clientName(e.getClientName())
                .workPostId(e.getWorkPostId())
                .workPostName(e.getWorkPostName())
                .contractNumber(e.getContractNumber())
                .expenseDate(e.getExpenseDate())
                .category(e.getCategory())
                .description(e.getDescription())
                .documentNumber(e.getDocumentNumber())
                .amount(e.getAmount())
                .responsibility(e.getResponsibility())
                .reimbursementStatus(e.getReimbursementStatus())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}

