package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.MaterialRequisition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialRequisitionDTO {
    private UUID id;
    private UUID companyId;
    private String requisitionNumber;
    private UUID workOrderId;
    private String workOrderNumber;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private UUID stockItemId;
    private String itemName;
    private String itemCode;
    private BigDecimal quantity;
    private String unit;
    private MaterialRequisition.UrgencyLevel urgency;
    private String justification;
    private UUID requesterId;
    private String requesterName;
    private String originDepartment;
    private MaterialRequisition.RequisitionStatus status;
    private String statusDescription;
    private UUID managerApprovalId;
    private String managerApprovalName;
    private LocalDateTime managerApprovalDate;
    private String rejectionReason;
    private LocalDateTime releasedAt;
    private Long slaLeadTimeMinutes;
    private Long slaTargetMinutes;
    private boolean isSlaBreached;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Campos associados
    private UUID purchaseOrderId;
    private String ocNumber;
    private UUID quoteComparisonId;

    // Campos de Entrega e Baixa
    private LocalDateTime deliveryDate;
    private LocalDateTime deliveredAt;
    private UUID deliveredById;
    private String deliveredByName;
    private String receivedByName;
    private String deliveryNotes;
}
