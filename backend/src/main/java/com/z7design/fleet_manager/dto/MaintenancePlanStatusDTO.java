package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Status de um plano de manutenção preventiva em relação à quilometragem
 * e data atuais do veículo — usado para calcular a próxima manutenção.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanStatusDTO {

    private UUID planId;
    private String taskName;

    private Integer intervalKm;
    private Integer intervalDays;

    private Integer lastExecutionKm;
    private LocalDate lastExecutionDate;

    private Integer nextDueKm;
    private LocalDate nextDueDate;

    /** Quilometragem atual do veículo */
    private Integer currentMileage;

    /** nextDueKm - currentMileage (negativo = vencido). Null se não calculável */
    private Integer kmRemaining;

    /** Quanto já rodou desde a última execução. Null se não calculável */
    private Integer kmSinceLast;

    /** Dias entre hoje e nextDueDate (negativo = vencido). Null se não calculável */
    private Long daysRemaining;

    /** Nível de alerta calculado */
    private AlertLevel alertLevel;

    /** Mensagem pronta para exibição, ex: "Vencida há 320 km" */
    private String message;

    public enum AlertLevel {
        OK,
        UPCOMING,
        OVERDUE,
        NO_SCHEDULE
    }
}
