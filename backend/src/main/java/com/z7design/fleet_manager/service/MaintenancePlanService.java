package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MaintenancePlanDTO;
import com.z7design.fleet_manager.dto.MaintenancePlanStatusDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceStatusDTO;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.VehicleMaintenanceAlertDTO;
import com.z7design.fleet_manager.dto.OverdueMaintenanceAlertDTO;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository repository;
    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<MaintenancePlanDTO> getAll() {
        return repository.findAll().stream()
                .map(MaintenancePlanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanDTO> getByVehicle(UUID vehicleId) {
        return repository.findByVehicleId(vehicleId).stream()
                .map(MaintenancePlanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenancePlanDTO createOrUpdate(MaintenancePlanDTO dto) {
        MaintenancePlan entity;
        if (dto.getId() != null) {
            entity = repository.findById(dto.getId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("MaintenancePlan not found with id: " + dto.getId()));
        } else {
            entity = new MaintenancePlan();
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            entity.setVehicle(vehicle);
            // Tenant: prioriza o contexto da requisição; cai para a empresa do veículo
            entity.setCompanyId(TenantContext.get() != null
                    ? TenantContext.get()
                    : vehicle.getCompanyId());
        }

        // Backfill de registros legados sem empresa
        if (entity.getCompanyId() == null && entity.getVehicle() != null) {
            entity.setCompanyId(TenantContext.get() != null
                    ? TenantContext.get()
                    : entity.getVehicle().getCompanyId());
        }

        entity.setTaskName(dto.getTaskName());
        entity.setIntervalKm(dto.getIntervalKm());
        entity.setIntervalDays(dto.getIntervalDays());
        entity.setLastExecutionKm(dto.getLastExecutionKm());
        entity.setLastExecutionDate(dto.getLastExecutionDate());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        calculateNextDue(entity);

        return MaintenancePlanDTO.fromEntity(repository.save(entity));
    }

    private void calculateNextDue(MaintenancePlan plan) {
        if (plan.getLastExecutionKm() != null && plan.getIntervalKm() != null) {
            plan.setNextDueKm(plan.getLastExecutionKm() + plan.getIntervalKm());
        }

        if (plan.getLastExecutionDate() != null && plan.getIntervalDays() != null) {
            plan.setNextDueDate(plan.getLastExecutionDate().plusDays(plan.getIntervalDays()));
        }
    }

    /**
     * PRD Módulo 6: expõe o cálculo de próxima execução para outros serviços
     * (ex.: OdometerService ao semear planos padrão de PMP).
     */
    public void calculateNextDuePublic(MaintenancePlan plan) {
        calculateNextDue(plan);
    }

    @Transactional
    public void markAsExecuted(UUID planId, Integer executionKm, LocalDate executionDate) {
        MaintenancePlan plan = repository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenancePlan not found with id: " + planId));

        plan.setLastExecutionKm(executionKm);
        plan.setLastExecutionDate(executionDate);
        calculateNextDue(plan);
        repository.save(plan);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    // ── Status de próxima manutenção ─────────────────────────────────────────

    /** Tolerância padrão de "próximo do vencimento": 500 km ou 7 dias */
    private static final int UPCOMING_KM_THRESHOLD = 500;
    private static final long UPCOMING_DAYS_THRESHOLD = 7;

    /**
     * Calcula o status de próxima manutenção do veículo a partir dos planos
     * ativos, da quilometragem atual do veículo e das datas de vencimento.
     */
    @Transactional(readOnly = true)
    public VehicleMaintenanceStatusDTO getVehicleMaintenanceStatus(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        List<MaintenancePlan> plans = repository.findByVehicleIdAndIsActiveTrueOrderById(vehicleId);

        Integer currentMileage = vehicle.getCurrentMileage();
        LocalDate today = LocalDate.now();

        List<MaintenancePlanStatusDTO> planStatuses = plans.stream()
                .map(plan -> buildPlanStatus(plan, currentMileage, today))
                .collect(Collectors.toList());

        long overdueCount = planStatuses.stream()
                .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.OVERDUE).count();
        long upcomingCount = planStatuses.stream()
                .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.UPCOMING).count();

        MaintenancePlanStatusDTO mostCritical = planStatuses.stream()
                .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.OVERDUE
                        || s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.UPCOMING)
                .min(this::compareCriticality)
                .orElse(null);

        MaintenancePlanStatusDTO.AlertLevel overall = planStatuses.stream()
                .map(MaintenancePlanStatusDTO::getAlertLevel)
                .min(java.util.Comparator.comparingInt(this::rank))
                .orElse(MaintenancePlanStatusDTO.AlertLevel.NO_SCHEDULE);

        return VehicleMaintenanceStatusDTO.builder()
                .vehicleId(vehicle.getId())
                .plate(vehicle.getPlate())
                .model(vehicle.getModel())
                .brand(vehicle.getBrand())
                .currentMileage(currentMileage)
                .lastMaintenanceDate(vehicle.getLastMaintenanceDate())
                .nextMaintenanceDate(vehicle.getNextMaintenanceDate())
                .plans(planStatuses)
                .overallAlertLevel(overall)
                .mostCriticalPlan(mostCritical)
                .overdueCount(overdueCount)
                .upcomingCount(upcomingCount)
                .build();
    }

    /**
     * Alerta consolidado de manutenção por veículo, para todas as empresas.
     * Otimizado para listagens: uma única consulta de veículos + uma de planos.
     */
    @Transactional(readOnly = true)
    public List<VehicleMaintenanceAlertDTO> getAllVehiclesMaintenanceAlerts() {
        LocalDate today = LocalDate.now();

        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        Map<UUID, Integer> mileageByVehicle = new HashMap<>();
        for (Vehicle v : vehicles) {
            mileageByVehicle.put(v.getId(), v.getCurrentMileage() != null ? v.getCurrentMileage() : 0);
        }

        Map<UUID, List<MaintenancePlan>> plansByVehicle = repository.findByIsActiveTrueAndVehicle_IdIn(
                vehicles.stream().map(Vehicle::getId).collect(Collectors.toList()))
                .stream()
                .collect(Collectors.groupingBy(p -> p.getVehicle().getId()));

        List<VehicleMaintenanceAlertDTO> result = new ArrayList<>(vehicles.size());

        for (Vehicle vehicle : vehicles) {
            Integer mileage = mileageByVehicle.get(vehicle.getId());
            List<MaintenancePlanStatusDTO> statuses = plansByVehicle
                    .getOrDefault(vehicle.getId(), java.util.Collections.emptyList())
                    .stream()
                    .map(plan -> buildPlanStatus(plan, mileage, today))
                    .collect(Collectors.toList());

            long overdueCount = statuses.stream()
                    .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.OVERDUE).count();
            long upcomingCount = statuses.stream()
                    .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.UPCOMING).count();

            MaintenancePlanStatusDTO mostCritical = statuses.stream()
                    .filter(s -> s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.OVERDUE
                            || s.getAlertLevel() == MaintenancePlanStatusDTO.AlertLevel.UPCOMING)
                    .min(this::compareCriticality)
                    .orElse(null);

            MaintenancePlanStatusDTO.AlertLevel overall = statuses.stream()
                    .map(MaintenancePlanStatusDTO::getAlertLevel)
                    .min(java.util.Comparator.comparingInt(this::rank))
                    .orElse(MaintenancePlanStatusDTO.AlertLevel.NO_SCHEDULE);

            result.add(VehicleMaintenanceAlertDTO.builder()
                    .vehicleId(vehicle.getId())
                    .plate(vehicle.getPlate())
                    .alertLevel(overall)
                    .overdueCount(overdueCount)
                    .upcomingCount(upcomingCount)
                    .mostCriticalTaskName(mostCritical != null ? mostCritical.getTaskName() : null)
                    .mostCriticalMessage(mostCritical != null ? mostCritical.getMessage() : null)
                    .build());
        }

        return result;
    }

    private MaintenancePlanStatusDTO buildPlanStatus(MaintenancePlan plan, Integer currentMileage, LocalDate today) {
        Integer kmRemaining = null;
        Long daysRemaining = null;

        boolean hasKmSchedule = plan.getNextDueKm() != null && currentMileage != null;
        boolean hasDateSchedule = plan.getNextDueDate() != null;

        if (hasKmSchedule) {
            kmRemaining = plan.getNextDueKm() - currentMileage;
        }
        if (hasDateSchedule) {
            daysRemaining = ChronoUnit.DAYS.between(today, plan.getNextDueDate());
        }

        boolean overdueKm = kmRemaining != null && kmRemaining <= 0;
        boolean overdueDate = daysRemaining != null && daysRemaining < 0;
        boolean upcomingKm = !overdueKm && kmRemaining != null && kmRemaining <= UPCOMING_KM_THRESHOLD;
        boolean upcomingDate = !overdueDate && daysRemaining != null && daysRemaining <= UPCOMING_DAYS_THRESHOLD;

        MaintenancePlanStatusDTO.AlertLevel level;
        String message;

        if (overdueKm || overdueDate) {
            level = MaintenancePlanStatusDTO.AlertLevel.OVERDUE;
            if (overdueKm && overdueDate) {
                message = String.format("Vencida há %d km e %d dias", -kmRemaining, -daysRemaining);
            } else if (overdueKm) {
                message = String.format("Vencida há %d km", -kmRemaining);
            } else {
                message = String.format("Vencida há %d dias", -daysRemaining);
            }
        } else if (upcomingKm || upcomingDate) {
            level = MaintenancePlanStatusDTO.AlertLevel.UPCOMING;
            if (upcomingKm && upcomingDate) {
                message = String.format("Faltam %d km ou %d dias", kmRemaining, daysRemaining);
            } else if (upcomingKm) {
                message = String.format("Faltam %d km", kmRemaining);
            } else {
                message = String.format("Faltam %d dias", daysRemaining);
            }
        } else if (hasKmSchedule || hasDateSchedule) {
            level = MaintenancePlanStatusDTO.AlertLevel.OK;
            if (kmRemaining != null) {
                message = String.format("Faltam %d km", kmRemaining);
            } else {
                message = String.format("Faltam %d dias", daysRemaining);
            }
        } else {
            level = MaintenancePlanStatusDTO.AlertLevel.NO_SCHEDULE;
            message = "Plano sem intervalo configurado";
        }

        return MaintenancePlanStatusDTO.builder()
                .planId(plan.getId())
                .taskName(plan.getTaskName())
                .intervalKm(plan.getIntervalKm())
                .intervalDays(plan.getIntervalDays())
                .lastExecutionKm(plan.getLastExecutionKm())
                .lastExecutionDate(plan.getLastExecutionDate())
                .nextDueKm(plan.getNextDueKm())
                .nextDueDate(plan.getNextDueDate())
                .currentMileage(currentMileage)
                .kmRemaining(kmRemaining)
                .kmSinceLast(plan.getLastExecutionKm() != null && currentMileage != null
                        ? currentMileage - plan.getLastExecutionKm() : null)
                .daysRemaining(daysRemaining)
                .alertLevel(level)
                .message(message)
                .build();
    }

    /**
     * Varre todos os planos ativos e retorna os VENCIDOS, agrupados por empresa.
     * Usado pelo MaintenanceAlertScheduler para notificar supervisores.
     */
    @Transactional(readOnly = true)
    public java.util.Map<UUID, List<OverdueMaintenanceAlertDTO>> findOverduePlansGroupedByCompany() {
        return findPlansByAlertLevelGroupedByCompany(MaintenancePlanStatusDTO.AlertLevel.OVERDUE);
    }

    /**
     * Varre todos os planos ativos e retorna os PRÓXIMOS DO VENCIMENTO
     * (≤ 7 dias ou ≤ 500 km), agrupados por empresa. Usado pelo scheduler.
     */
    @Transactional(readOnly = true)
    public java.util.Map<UUID, List<OverdueMaintenanceAlertDTO>> findUpcomingPlansGroupedByCompany() {
        return findPlansByAlertLevelGroupedByCompany(MaintenancePlanStatusDTO.AlertLevel.UPCOMING);
    }

    private java.util.Map<UUID, List<OverdueMaintenanceAlertDTO>> findPlansByAlertLevelGroupedByCompany(
            MaintenancePlanStatusDTO.AlertLevel targetLevel) {
        LocalDate today = LocalDate.now();

        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            return java.util.Collections.emptyMap();
        }

        Map<UUID, Integer> mileageByVehicle = new HashMap<>();
        for (Vehicle v : vehicles) {
            mileageByVehicle.put(v.getId(), v.getCurrentMileage() != null ? v.getCurrentMileage() : 0);
        }

        Map<UUID, List<MaintenancePlan>> plansByVehicle = repository.findByIsActiveTrueAndVehicle_IdIn(
                vehicles.stream().map(Vehicle::getId).collect(Collectors.toList()))
                .stream()
                .collect(Collectors.groupingBy(p -> p.getVehicle().getId()));

        java.util.Map<UUID, List<OverdueMaintenanceAlertDTO>> result = new java.util.LinkedHashMap<>();

        for (Vehicle vehicle : vehicles) {
            for (MaintenancePlan plan : plansByVehicle.getOrDefault(vehicle.getId(), java.util.Collections.emptyList())) {
                MaintenancePlanStatusDTO status = buildPlanStatus(plan, mileageByVehicle.get(vehicle.getId()), today);
                if (status.getAlertLevel() == targetLevel) {
                    UUID companyId = plan.getCompanyId() != null
                            ? plan.getCompanyId()
                            : vehicle.getCompanyId();
                    if (companyId == null) continue;

                    result.computeIfAbsent(companyId, k -> new ArrayList<>())
                            .add(OverdueMaintenanceAlertDTO.builder()
                                    .companyId(companyId)
                                    .vehicleId(vehicle.getId())
                                    .plate(vehicle.getPlate())
                                    .vehicleModel(vehicle.getModel())
                                    .vehicleBrand(vehicle.getBrand())
                                    .planId(plan.getId())
                                    .taskName(plan.getTaskName())
                                    .message(status.getMessage())
                                    .nextDueKm(plan.getNextDueKm())
                                    .nextDueDate(plan.getNextDueDate())
                                    .build());
                }
            }
        }

        return result;
    }

    /** Menor = mais crítico (OVERDUE > UPCOMING > OK > NO_SCHEDULE) */
    private int compareCriticality(MaintenancePlanStatusDTO a, MaintenancePlanStatusDTO b) {
        return Integer.compare(rank(a.getAlertLevel()), rank(b.getAlertLevel()));
    }

    private int rank(MaintenancePlanStatusDTO.AlertLevel level) {
        switch (level) {
            case OVERDUE: return 0;
            case UPCOMING: return 1;
            case OK: return 2;
            case NO_SCHEDULE:
            default: return 3;
        }
    }
}
