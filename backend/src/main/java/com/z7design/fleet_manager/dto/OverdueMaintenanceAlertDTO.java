package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Plano de manutenção preventiva vencido — usado pelo MaintenanceAlertScheduler
 * para notificar os supervisores da empresa responsável.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverdueMaintenanceAlertDTO {

    private UUID companyId;

    private UUID vehicleId;
    private String plate;
    private String vehicleModel;
    private String vehicleBrand;

    private UUID planId;
    private String taskName;

    /** Mensagem pronta, ex: "Vencida há 200 km" */
    private String message;

    private Integer nextDueKm;
    private LocalDate nextDueDate;
}
