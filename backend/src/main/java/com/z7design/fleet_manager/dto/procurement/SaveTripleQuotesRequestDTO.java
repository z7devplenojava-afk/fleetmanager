package com.z7design.fleet_manager.dto.procurement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveTripleQuotesRequestDTO {

    @NotNull(message = "ID da requisição é obrigatório")
    private UUID requisitionId;

    @NotEmpty(message = "As 3 cotações são obrigatórias")
    @Size(min = 3, max = 3, message = "Devem ser fornecidas exatamente 3 cotações de fornecedores")
    @Valid
    private List<ProcurementQuoteOptionDTO> options;
}
