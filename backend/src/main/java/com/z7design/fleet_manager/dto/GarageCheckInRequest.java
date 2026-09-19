package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Solicitação de Check-in (Entrada de veículo na garagem/pátio). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarageCheckInRequest {

    @NotNull(message = "Veículo é obrigatório")
    private UUID vehicleId;

    @NotNull(message = "Garagem de destino é obrigatória")
    private UUID garageId;

    /** Motorista que entregou o veículo no pátio */
    private String driverName;

    /** Cliente / Contrato vinculado */
    private String clientName;

    /** Motivo: MANUTENCAO, LIMPEZA, OPERACAO, ESCALA, RECOLHIMENTO, RESERVA, OUTROS */
    private String reason;

    /** Detalhe livre do motivo */
    private String reasonDetail;

    /** KM no momento da entrada */
    private Integer kmReading;

    /** Horário da entrada (se omitido, usa momento atual) */
    private LocalDateTime entryTime;
}
