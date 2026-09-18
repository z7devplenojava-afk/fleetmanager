package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.repository.VehicleCleaningOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Agendador do alerta preventivo de atraso da Gestão de Limpeza.
 * <p>
 * Executa a cada 5 minutos: quando faltarem ≤ 20 minutos para o horário limite de
 * liberação (viagem/escala) e a limpeza ainda não tiver atingido a fase final, envia
 * ao Gestor de Tráfego o alerta "risco de atraso / deseja trocar o carro na escala?".
 * Mesmo padrão do MaintenanceAlertScheduler.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VehicleCleaningDelayAlertScheduler {

    private final VehicleCleaningService vehicleCleaningService;

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT2M")
    public void checkDelayAlerts() {
        try {
            vehicleCleaningService.checkAndSendDelayAlerts();
        } catch (Exception e) {
            log.error("Erro ao verificar alertas de atraso da limpeza: {}", e.getMessage());
        }
    }
}
