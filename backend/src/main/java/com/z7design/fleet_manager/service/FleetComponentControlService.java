package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetComponentControlDashboardDTO;
import com.z7design.fleet_manager.dto.FleetComponentControlRowDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.FleetComponentControlConfigRepository;
import com.z7design.fleet_manager.repository.FleetComponentControlRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FleetComponentControlService {

    public static final List<String> ALL_CONTROL_TYPES = List.of(
            "ALIGNMENT", "ENGINE_OIL", "PULLEY_BEARING", "STARTER", "ALTERNATOR_INSPECTION", "ALTERNATOR"
    );

    private final FleetComponentControlRepository controlRepository;
    private final FleetComponentControlConfigRepository configRepository;
    private final VehicleRepository vehicleRepository;

    public FleetComponentControlConfig getConfig(UUID companyId) {
        if (companyId == null) {
            return FleetComponentControlConfig.builder().build();
        }
        return configRepository.findByCompanyId(companyId)
                .orElseGet(() -> configRepository.save(
                        FleetComponentControlConfig.builder().companyId(companyId).build()
                ));
    }

    @Transactional
    public FleetComponentControlConfig updateConfig(UUID companyId, FleetComponentControlConfig req) {
        FleetComponentControlConfig cfg = (companyId != null)
                ? configRepository.findByCompanyId(companyId)
                        .orElse(FleetComponentControlConfig.builder().companyId(companyId).build())
                : FleetComponentControlConfig.builder().build();

        if (req.getAlignmentIntervalKm() != null && req.getAlignmentIntervalKm() > 0)
            cfg.setAlignmentIntervalKm(req.getAlignmentIntervalKm());
        if (req.getEngineOilIntervalKm() != null && req.getEngineOilIntervalKm() > 0)
            cfg.setEngineOilIntervalKm(req.getEngineOilIntervalKm());
        if (req.getPulleyBearingIntervalKm() != null && req.getPulleyBearingIntervalKm() > 0)
            cfg.setPulleyBearingIntervalKm(req.getPulleyBearingIntervalKm());
        if (req.getStarterIntervalKm() != null && req.getStarterIntervalKm() > 0)
            cfg.setStarterIntervalKm(req.getStarterIntervalKm());
        if (req.getAlternatorIntervalKm() != null && req.getAlternatorIntervalKm() > 0)
            cfg.setAlternatorIntervalKm(req.getAlternatorIntervalKm());
        if (req.getAlternatorQuickCheckIntervalKm() != null && req.getAlternatorQuickCheckIntervalKm() > 0)
            cfg.setAlternatorQuickCheckIntervalKm(req.getAlternatorQuickCheckIntervalKm());
        if (req.getAutoOpenPreventiveOs() != null)
            cfg.setAutoOpenPreventiveOs(req.getAutoOpenPreventiveOs());
        if (req.getDefaultPreventiveModel() != null && !req.getDefaultPreventiveModel().isBlank())
            cfg.setDefaultPreventiveModel(req.getDefaultPreventiveModel().trim().toUpperCase());
        if (req.getAlertThresholdKm() != null && req.getAlertThresholdKm() >= 0)
            cfg.setAlertThresholdKm(req.getAlertThresholdKm());

        return configRepository.save(cfg);
    }

    public FleetComponentControlDashboardDTO getDashboard(
            UUID companyId,
            String controlTypeFilter,
            Integer month,
            Integer year) {
        FleetComponentControlConfig cfg = getConfig(companyId);
        int thresholdKm = cfg.getAlertThresholdKm() != null ? cfg.getAlertThresholdKm() : 3000;

        List<Vehicle> vehicles = companyId != null
                ? vehicleRepository.findByCompanyId(companyId)
                : vehicleRepository.findAll().stream().filter(v -> v.getDeletedAt() == null).toList();

        vehicles = new ArrayList<>(vehicles);
        vehicles.sort(Comparator.comparing(
                v -> (v.getFleetNumber() != null && !v.getFleetNumber().isBlank() ? v.getFleetNumber() : v.getPlate()),
                String.CASE_INSENSITIVE_ORDER));

        List<FleetComponentControl> latestControls = companyId != null
                ? controlRepository.findByCompanyIdAndIsLatestTrue(companyId)
                : controlRepository.findByIsLatestTrue();

        Map<String, FleetComponentControl> latestByKey = new HashMap<>();
        for (FleetComponentControl c : latestControls) {
            latestByKey.put(c.getVehicleId() + ":" + c.getControlType(), c);
        }

        List<String> targetTypes = (controlTypeFilter != null && ALL_CONTROL_TYPES.contains(controlTypeFilter))
                ? List.of(controlTypeFilter)
                : ALL_CONTROL_TYPES;

        List<FleetComponentControlRowDTO> rows = new ArrayList<>();
        List<FleetComponentControlRowDTO> expiringAlerts = new ArrayList<>();
        int overdueCount = 0;
        int dueSoonCount = 0;
        int okCount = 0;

        for (Vehicle v : vehicles) {
            int currentKm = v.getCurrentMileage() != null ? v.getCurrentMileage() : 0;

            for (String ct : ALL_CONTROL_TYPES) {
                FleetComponentControl latest = latestByKey.get(v.getId() + ":" + ct);
                int intervalKm = getIntervalForType(cfg, ct);
                int nextDueKm = latest != null ? latest.getNextDueKm() : intervalKm;
                int kmRemaining = nextDueKm - currentKm;

                String alertStatus = kmRemaining <= 0
                        ? "OVERDUE"
                        : (kmRemaining <= thresholdKm ? "DUE_SOON" : "OK");

                FleetComponentControlRowDTO row = FleetComponentControlRowDTO.builder()
                        .id(latest != null ? latest.getId() : null)
                        .vehicleId(v.getId())
                        .fleetNumber(v.getFleetNumber())
                        .plate(v.getPlate())
                        .model(v.getModel())
                        .controlType(ct)
                        .controlLabel(getLabelForType(ct))
                        .workOrderId(latest != null ? latest.getWorkOrderId() : null)
                        .osNumber(latest != null ? latest.getOsNumber() : null)
                        .serviceDate(latest != null ? latest.getServiceDate() : null)
                        .serviceKm(latest != null ? latest.getServiceKm() : null)
                        .currentKm(currentKm)
                        .nextDueKm(nextDueKm)
                        .kmRemaining(kmRemaining)
                        .intervalKm(latest != null ? latest.getIntervalKm() : intervalKm)
                        .oilFilterChanged(latest != null && Boolean.TRUE.equals(latest.getOilFilterChanged()))
                        .dieselFilterChanged(latest != null && Boolean.TRUE.equals(latest.getDieselFilterChanged()))
                        .waterSeparatorFilterChanged(latest != null && Boolean.TRUE.equals(latest.getWaterSeparatorFilterChanged()))
                        .airFilterChanged(latest != null && Boolean.TRUE.equals(latest.getAirFilterChanged()))
                        .alertStatus(alertStatus)
                        .hasHistory(latest != null)
                        .notes(latest != null ? latest.getNotes() : null)
                        .build();

                if ("OVERDUE".equals(alertStatus) || "DUE_SOON".equals(alertStatus)) {
                    expiringAlerts.add(row);
                }

                if (!targetTypes.contains(ct)) {
                    continue;
                }

                if (month != null && year != null) {
                    if (row.getServiceDate() == null
                            || row.getServiceDate().getMonthValue() != month
                            || row.getServiceDate().getYear() != year) {
                        continue;
                    }
                }

                if ("OVERDUE".equals(alertStatus)) overdueCount++;
                else if ("DUE_SOON".equals(alertStatus)) dueSoonCount++;
                else okCount++;

                rows.add(row);
            }
        }

        expiringAlerts.sort(Comparator.comparing(FleetComponentControlRowDTO::getKmRemaining));

        return FleetComponentControlDashboardDTO.builder()
                .config(cfg)
                .totalRows(rows.size())
                .overdueCount(overdueCount)
                .dueSoonCount(dueSoonCount)
                .okCount(okCount)
                .rows(rows)
                .expiringAlerts(expiringAlerts)
                .build();
    }

    @Transactional
    public FleetComponentControlRowDTO recordManualEntry(UUID companyId, FleetComponentControlRowDTO req) {
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new NoSuchElementException("Veículo não encontrado: " + req.getVehicleId()));
        String ct = req.getControlType();
        if (!ALL_CONTROL_TYPES.contains(ct)) {
            throw new IllegalArgumentException("Tipo de controle inválido: " + ct);
        }

        UUID effectiveCompany = companyId != null ? companyId : vehicle.getCompanyId();
        FleetComponentControlConfig cfg = getConfig(effectiveCompany);
        int intervalKm = (req.getIntervalKm() != null && req.getIntervalKm() > 0)
                ? req.getIntervalKm()
                : getIntervalForType(cfg, ct);

        int serviceKm = req.getServiceKm() != null
                ? req.getServiceKm()
                : (vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0);
        int nextDueKm = (req.getNextDueKm() != null && req.getNextDueKm() > 0)
                ? req.getNextDueKm()
                : serviceKm + intervalKm;
        LocalDate serviceDate = req.getServiceDate() != null ? req.getServiceDate() : LocalDate.now();

        deactivatePreviousLatest(vehicle.getId(), ct);

        FleetComponentControl entity = FleetComponentControl.builder()
                .companyId(effectiveCompany)
                .vehicleId(vehicle.getId())
                .controlType(ct)
                .serviceDate(serviceDate)
                .serviceKm(serviceKm)
                .nextDueKm(nextDueKm)
                .intervalKm(intervalKm)
                .oilFilterChanged(Boolean.TRUE.equals(req.getOilFilterChanged()))
                .dieselFilterChanged(Boolean.TRUE.equals(req.getDieselFilterChanged()))
                .waterSeparatorFilterChanged(Boolean.TRUE.equals(req.getWaterSeparatorFilterChanged()))
                .airFilterChanged(Boolean.TRUE.equals(req.getAirFilterChanged()))
                .notes(req.getNotes())
                .isLatest(true)
                .build();

        FleetComponentControl saved = controlRepository.save(entity);
        int currentKm = vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : serviceKm;
        int kmRemaining = saved.getNextDueKm() - currentKm;
        int threshold = cfg.getAlertThresholdKm() != null ? cfg.getAlertThresholdKm() : 3000;

        return FleetComponentControlRowDTO.builder()
                .id(saved.getId())
                .vehicleId(vehicle.getId())
                .fleetNumber(vehicle.getFleetNumber())
                .plate(vehicle.getPlate())
                .model(vehicle.getModel())
                .controlType(ct)
                .controlLabel(getLabelForType(ct))
                .serviceDate(saved.getServiceDate())
                .serviceKm(saved.getServiceKm())
                .currentKm(currentKm)
                .nextDueKm(saved.getNextDueKm())
                .kmRemaining(kmRemaining)
                .intervalKm(saved.getIntervalKm())
                .oilFilterChanged(saved.getOilFilterChanged())
                .dieselFilterChanged(saved.getDieselFilterChanged())
                .waterSeparatorFilterChanged(saved.getWaterSeparatorFilterChanged())
                .airFilterChanged(saved.getAirFilterChanged())
                .alertStatus(kmRemaining <= 0 ? "OVERDUE" : (kmRemaining <= threshold ? "DUE_SOON" : "OK"))
                .hasHistory(true)
                .notes(saved.getNotes())
                .build();
    }

    public List<FleetComponentControl> getHistory(UUID vehicleId, String controlType) {
        return controlRepository.findByVehicleIdAndControlTypeOrderByServiceDateDescCreatedAtDesc(vehicleId, controlType);
    }

    /**
     * Chamado automaticamente ao concluir uma Ordem de Serviço (FleetWorkOrder).
     * Identifica os controles selecionados na OS (ou detectados na descrição/tipo)
     * e atualiza a data/KM efetivados + próximo KM de vencimento.
     */
    @Transactional
    public void syncFromCompletedWorkOrder(FleetWorkOrder order) {
        if (order == null || order.getVehicle() == null) return;

        Set<String> types = detectControlTypes(order);
        if (types.isEmpty()) return;

        Vehicle vehicle = order.getVehicle();
        UUID companyId = order.getCompanyId() != null ? order.getCompanyId() : vehicle.getCompanyId();
        FleetComponentControlConfig cfg = getConfig(companyId);

        LocalDate serviceDate = order.getExitDate() != null
                ? order.getExitDate()
                : (order.getCompletionDate() != null ? order.getCompletionDate().toLocalDate() : LocalDate.now());

        Integer serviceKm = order.getOdometerOut() != null ? order.getOdometerOut()
                : (order.getOdometerIn() != null ? order.getOdometerIn()
                : (vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0));

        for (String ct : types) {
            if (controlRepository.findFirstByWorkOrderIdAndControlType(order.getId(), ct).isPresent()) {
                continue;
            }
            int intervalKm = getIntervalForType(cfg, ct);
            deactivatePreviousLatest(vehicle.getId(), ct);

            boolean isOil = "ENGINE_OIL".equals(ct);
            FleetComponentControl rec = FleetComponentControl.builder()
                    .companyId(companyId)
                    .vehicleId(vehicle.getId())
                    .controlType(ct)
                    .workOrderId(order.getId())
                    .osNumber(order.getOsNumber())
                    .serviceDate(serviceDate)
                    .serviceKm(serviceKm)
                    .nextDueKm(serviceKm + intervalKm)
                    .intervalKm(intervalKm)
                    .oilFilterChanged(isOil && Boolean.TRUE.equals(order.getOilFilterChanged()))
                    .dieselFilterChanged(isOil && Boolean.TRUE.equals(order.getDieselFilterChanged()))
                    .waterSeparatorFilterChanged(isOil && Boolean.TRUE.equals(order.getWaterSeparatorFilterChanged()))
                    .airFilterChanged(isOil && Boolean.TRUE.equals(order.getAirFilterChanged()))
                    .notes("Atualizado automaticamente pela conclusão da " + order.getOsNumber())
                    .isLatest(true)
                    .build();

            controlRepository.save(rec);
            log.info("🔧 Controle {} atualizado automaticamente pela OS {} para veículo {} (KM {}, Próx {})",
                    ct, order.getOsNumber(), vehicle.getPlate(), serviceKm, serviceKm + intervalKm);
        }
    }

    private void deactivatePreviousLatest(UUID vehicleId, String controlType) {
        List<FleetComponentControl> prevs = controlRepository.findByVehicleIdAndControlTypeAndIsLatestTrue(vehicleId, controlType);
        if (!prevs.isEmpty()) {
            prevs.forEach(p -> p.setIsLatest(false));
            controlRepository.saveAll(prevs);
        }
    }

    private Set<String> detectControlTypes(FleetWorkOrder order) {
        Set<String> result = new LinkedHashSet<>();

        if (order.getPreventiveControlTypes() != null && !order.getPreventiveControlTypes().isBlank()) {
            for (String token : order.getPreventiveControlTypes().split(",")) {
                String clean = token.trim().toUpperCase();
                if (ALL_CONTROL_TYPES.contains(clean)) {
                    result.add(clean);
                }
            }
        }

        String text = String.join(" ",
                order.getAnomaliesDescription() != null ? order.getAnomaliesDescription() : "",
                order.getMaintenancePerformed() != null ? order.getMaintenancePerformed() : "",
                order.getStopReason() != null ? order.getStopReason() : "",
                order.getPlan() != null && order.getPlan().getTaskName() != null ? order.getPlan().getTaskName() : ""
        ).toLowerCase();

        if (text.contains("alinhamento")) result.add("ALIGNMENT");
        if (order.getMaintenanceType() == FleetWorkOrder.MaintenanceType.LUBRIFICACAO
                || text.contains("troca de oleo") || text.contains("troca de óleo")
                || text.contains("oleo de motor") || text.contains("óleo de motor")) {
            result.add("ENGINE_OIL");
        }
        if (text.contains("polia") || text.contains("rolamento da polia") || text.contains("rolamento polia")) {
            result.add("PULLEY_BEARING");
        }
        if (text.contains("arranque") || text.contains("motor de partida")) {
            result.add("STARTER");
        }
        if (text.contains("alternador")) {
            boolean isQuick = text.contains("15.000") || text.contains("inspeção elétrica") || text.contains("inspecao eletrica")
                    || text.contains("medição periódica") || text.contains("medicao periodica");
            boolean isOverhaul = text.contains("150.000") || text.contains("revisão geral") || text.contains("revisao geral")
                    || text.contains("recondicion") || text.contains("bancada") || text.contains("rolamentos internos")
                    || text.contains("retific") || text.contains("regulador de voltagem") || !isQuick;
            if (isQuick) result.add("ALTERNATOR_INSPECTION");
            if (isOverhaul) {
                result.add("ALTERNATOR");
                result.add("ALTERNATOR_INSPECTION");
            }
        }

        return result;
    }

    public int getIntervalForType(FleetComponentControlConfig cfg, String controlType) {
        return switch (controlType) {
            case "ALIGNMENT" -> cfg.getAlignmentIntervalKm() != null ? cfg.getAlignmentIntervalKm() : 20000;
            case "ENGINE_OIL" -> cfg.getEngineOilIntervalKm() != null ? cfg.getEngineOilIntervalKm() : 25000;
            case "PULLEY_BEARING" -> cfg.getPulleyBearingIntervalKm() != null ? cfg.getPulleyBearingIntervalKm() : 20000;
            case "STARTER" -> cfg.getStarterIntervalKm() != null ? cfg.getStarterIntervalKm() : 20000;
            case "ALTERNATOR_INSPECTION" -> cfg.getAlternatorQuickCheckIntervalKm() != null ? cfg.getAlternatorQuickCheckIntervalKm() : 15000;
            case "ALTERNATOR" -> cfg.getAlternatorIntervalKm() != null ? cfg.getAlternatorIntervalKm() : 150000;
            default -> 20000;
        };
    }

    public static String getLabelForType(String controlType) {
        return switch (controlType) {
            case "ALIGNMENT" -> "Alinhamento e Balanceamento";
            case "ENGINE_OIL" -> "Troca de Óleo de Motor";
            case "PULLEY_BEARING" -> "Rolamento da Polia";
            case "STARTER" -> "Revisão - Motor de Arranque";
            case "ALTERNATOR_INSPECTION" -> "Alternador (Inspeção Elétrica 15k)";
            case "ALTERNATOR" -> "Alternador (Revisão Geral / Troca 150k)";
            default -> controlType;
        };
    }
}

