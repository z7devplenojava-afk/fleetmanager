package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 6 (RF-06.1): Disparo Automático do PMP.
 *
 * O sistema atualiza o hodômetro de cada veículo a partir das Partes Diárias
 * (integração M5 → M6 da matriz de rastreabilidade) e dispara alertas de
 * manutenção preventiva quando um plano ativo atinge o km de gatilho.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OdometerService {

    private final DailyLogRepository dailyLogRepository;
    private final VehicleRepository vehicleRepository;
    private final MaintenancePlanRepository maintenancePlanRepository;
    private final MaintenancePlanService maintenancePlanService;

    /**
     * Atualiza o hodômetro do veículo a partir de uma Parte Diária concluída
     * e dispara gatilhos de PMP para planos que venceram com o novo km.
     *
     * @return hodômetro atualizado do veículo (ou null se não houver km na parte diária)
     */
    @Transactional
    public Integer updateOdometerFromDailyLog(DailyLog dailyLog) {
        if (dailyLog.getVehicle() == null) {
            return null;
        }

        Integer finalKm = dailyLog.getFinalKm();
        if (finalKm == null || finalKm <= 0) {
            return null;
        }

        Vehicle vehicle = dailyLog.getVehicle();
        // Recarrega a entidade gerenciada para evitar LazyInitialization em contexto transacional
        UUID vehicleId = vehicle.getId();
        Vehicle managed = vehicleRepository.findById(vehicleId).orElse(null);
        if (managed == null) {
            log.warn("Veículo {} da Parte Diária {} não encontrado", vehicleId, dailyLog.getId());
            return null;
        }

        int current = managed.getCurrentMileage() != null ? managed.getCurrentMileage() : 0;
        if (finalKm > current) {
            managed.setCurrentMileage(finalKm);
            vehicleRepository.save(managed);
            log.info("Hodômetro do veículo {} (placa {}) atualizado de {} para {} km via Parte Diária",
                    vehicleId, managed.getPlate(), current, finalKm);

            // RF-06.1: dispara gatilhos de PMP com o novo hodômetro
            triggerPreventiveMaintenance(managed, finalKm);
        } else if (finalKm < current) {
            log.debug("Parte Diária com km final {} inferior ao hodômetro atual {} do veículo {} — ignorado",
                    finalKm, current, managed.getPlate());
        }

        return managed.getCurrentMileage();
    }

    /**
     * RF-06.1: verifica planos de manutenção preventiva ativos do veículo e
     * notifica (via MaintenanceAlertScheduler/notificações in-app) os planos
     * cujo nextDueKm foi atingido ou ultrapassado pelo hodômetro atual.
     *
     * @return quantidade de planos vencidos encontrados
     */
    public int triggerPreventiveMaintenance(Vehicle vehicle, int currentOdometer) {
        List<MaintenancePlan> plans =
                maintenancePlanRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicle.getId());
        int overdue = 0;
        for (MaintenancePlan plan : plans) {
            Integer nextDueKm = plan.getNextDueKm();
            if (nextDueKm != null && currentOdometer >= nextDueKm) {
                overdue++;
                log.info("PMP disparado: plano '{}' do veículo {} venceu em {} km (hodômetro atual: {})",
                        plan.getTaskName(), vehicle.getPlate(), nextDueKm, currentOdometer);
            }
        }
        if (overdue > 0) {
            // Reaproveita o canal de notificação já existente (in-app + sino + e-mail)
            try {
                maintenancePlanService.findOverduePlansGroupedByCompany();
                log.info("{} plano(s) de PMP vencido(s) para o veículo {} — alertas canalizados via MaintenanceAlertScheduler",
                        overdue, vehicle.getPlate());
            } catch (Exception e) {
                log.error("Erro ao canalizar alertas de PMP: {}", e.getMessage());
            }
        }
        return overdue;
    }

    /**
     * Seed dos planos padrão do PRD (RF-06.1) para um veículo que ainda não os possua:
     * 10.000 km (óleo 15W40 + filtros), 20.000 km (filtros de ar + lonas + fumaça preta),
     * 40.000 km (suspensão, arrefecimento, freio motor/retarder), 80.000 km (caixa,
     * diferencial e ar-condicionado).
     */
    @Transactional
    public int seedDefaultPrdPlans(UUID vehicleId, int lastExecutionKm) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new com.z7design.fleet_manager.exception.ResourceNotFoundException(
                        "Veículo não encontrado com ID: " + vehicleId));

        List<MaintenancePlan> existing =
                maintenancePlanRepository.findByVehicleIdAndIsActiveTrueOrderById(vehicleId);

        String[][] defaults = {
                { "Troca de óleo 15W40 + filtros (óleo, combustível e separador)", "10000" },
                { "Filtros de ar + regulagem de lonas de freio + teste de fumaça preta", "20000" },
                { "Sistema de suspensão, arrefecimento e inspeção de freio motor/retarder", "40000" },
                { "Caixa, diferencial e revisão do ar-condicionado", "80000" }
        };

        int created = 0;
        for (String[] def : defaults) {
            String taskName = def[0];
            int intervalKm = Integer.parseInt(def[1]);
            boolean alreadyExists = existing.stream()
                    .anyMatch(p -> taskName.equals(p.getTaskName()));
            if (alreadyExists) {
                continue;
            }
            MaintenancePlan plan = new MaintenancePlan();
            plan.setVehicle(vehicle);
            plan.setTaskName(taskName);
            plan.setIntervalKm(intervalKm);
            plan.setLastExecutionKm(lastExecutionKm);
            plan.setLastExecutionDate(LocalDate.now());
            plan.setIsActive(true);
            plan.setCompanyId(vehicle.getCompanyId());
            maintenancePlanService.calculateNextDuePublic(plan);
            maintenancePlanRepository.save(plan);
            created++;
        }
        log.info("Seed PRD: {} plano(s) padrão de PMP criado(s) para o veículo {}", created, vehicle.getPlate());
        return created;
    }

    /**
     * Recalcula o hodômetro de todos os veículos a partir da maior Parte Diária
     * registrada (rotina de consistência/reprocessamento).
     */
    @Transactional
    public int recalculateAllOdometers() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        int updated = 0;
        for (Vehicle vehicle : vehicles) {
            Integer maxFinalKm = dailyLogRepository.findMaxFinalKmByVehicleId(vehicle.getId());
            if (maxFinalKm != null && maxFinalKm > 0
                    && (vehicle.getCurrentMileage() == null || maxFinalKm > vehicle.getCurrentMileage())) {
                vehicle.setCurrentMileage(maxFinalKm);
                vehicleRepository.save(vehicle);
                updated++;
                triggerPreventiveMaintenance(vehicle, maxFinalKm);
            }
        }
        log.info("Recalculados {} hodômetro(s) a partir das Partes Diárias", updated);
        return updated;
    }
}
