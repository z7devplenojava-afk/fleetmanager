package com.z7design.fleet_manager.dto.client;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ExtraTripRequestDTO {
    private UUID contractId;

    @NotBlank(message = "O local de origem é obrigatório")
    private String origin;

    @NotBlank(message = "O destino é obrigatório")
    private String destination;

    @NotNull(message = "A data e hora de saída são obrigatórias")
    private LocalDateTime departureDateTime;

    private LocalDateTime returnDateTime;

    @NotNull(message = "A quantidade estimada de passageiros é obrigatória")
    private Integer passengerCount;

    private String vehicleTypeNeeded; // Ônibus Executivo, Micro-ônibus, Van, etc.

    @NotBlank(message = "A justificativa ou finalidade do serviço é obrigatória")
    private String reason;

    private String observations;
}
