package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.MaterialRequisition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRequisitionRequestDTO {
    private UUID workOrderId;
    private UUID vehicleId;
    private UUID stockItemId;

    @NotBlank(message = "Nome do item é obrigatório")
    private String itemName;

    private String itemCode;

    @NotNull(message = "Quantidade é obrigatória")
    private BigDecimal quantity;

    @Builder.Default
    private String unit = "UN";

    @NotNull(message = "Nível de urgência é obrigatório")
    private MaterialRequisition.UrgencyLevel urgency;

    @NotBlank(message = "Justificativa da requisição é obrigatória")
    private String justification;

    private String originDepartment;
}
