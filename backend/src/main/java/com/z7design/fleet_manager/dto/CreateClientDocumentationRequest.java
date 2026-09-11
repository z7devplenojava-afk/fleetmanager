package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClientDocumentationRequest {
    @NotNull
    private UUID clientId;

    @NotNull
    @Min(value = 2020, message = "Ano inválido")
    private Integer year;

    @NotNull
    @Min(value = 1, message = "Mês inválido")
    @Max(value = 12, message = "Mês inválido")
    private Integer month;
}
