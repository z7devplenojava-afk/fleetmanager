package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Solicitação de remanejamento de veículo entre garagens. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GarageTransferRequest {

    @NotNull(message = "Veículo é obrigatório")
    private UUID vehicleId;

    @NotNull(message = "Garagem de destino é obrigatória")
    private UUID toGarageId;

    /** Motivo: REMANEJAMENTO, MANUTENCAO, LIMPEZA, OPERACAO, ESCALA, OUTROS. */
    private String reason;

    /** Detalhe livre do motivo. */
    private String reasonDetail;

    /** KM do veículo no momento da movimentação (opcional). */
    private Integer kmReading;
}
