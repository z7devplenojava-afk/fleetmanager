package com.z7design.fleet_manager.dto.procurement;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveQuoteRequestDTO {

    @NotNull(message = "ID da comparação é obrigatório")
    private UUID comparisonId;

    @NotNull(message = "Opção de fornecedor escolhida é obrigatória")
    private UUID chosenOptionId;

    private String overrideReason;
    private String approverNotes;
}
