package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Solicitação de Check-out (Saída de veículo da garagem/pátio). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarageCheckOutRequest {

    @NotNull(message = "Veículo é obrigatório")
    private UUID vehicleId;

    /** Motorista que retirou o veículo do pátio */
    private String driverName;

    /** Motivo da saída: OPERACAO, CLIENTE, MANUTENCAO_EXTERNA, VIAGEM, OUTROS */
    private String reason;

    /** Detalhe livre da saída */
    private String reasonDetail;

    /** KM no momento da saída */
    private Integer kmReading;

    /** Horário da saída (se omitido, usa momento atual) */
    private LocalDateTime exitTime;
}
