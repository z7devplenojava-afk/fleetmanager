package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.MessageRequestDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.repository.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PreventiveModel2Service {

    private final FleetWorkOrderRepository workOrderRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final FleetComponentControlRepository controlRepository;
    private final FleetComponentControlConfigRepository configRepository;
    private final VehicleRepository vehicleRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreventiveScheduleItemDTO {
        private String code;
        private String systemName;
        private String urbanRangeLabel;
        private int urbanTriggerKm;
        private String roadRangeLabel;
        private int roadTriggerKm;
        private String controlType;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AutoSweepResultDTO {
        private int checkedVehicles;
        private int createdCount;
        private List<FleetWorkOrderDTO> createdOrders;
    }

    public static final List<PreventiveScheduleItemDTO> SCHEDULE_MATRIX = List.of(
            PreventiveScheduleItemDTO.builder()
                    .code("OIL_ENGINE").systemName("Óleo do motor + Filtro de óleo")
                    .urbanRangeLabel("10.000 – 15.000 km").urbanTriggerKm(10000)
                    .roadRangeLabel("20.000 – 40.000 km").roadTriggerKm(20000)
                    .controlType("ENGINE_OIL")
                    .notes("Troca simultânea obrigatória.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("FUEL_FILTER").systemName("Filtro de combustível / separador")
                    .urbanRangeLabel("10.000 – 15.000 km").urbanTriggerKm(10000)
                    .roadRangeLabel("20.000 – 30.000 km").roadTriggerKm(20000)
                    .controlType(null)
                    .notes("Drenar a bacia decantadora diariamente.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("ALTERNATOR_QUICK").systemName("Alternador (Inspeção elétrica rápida)")
                    .urbanRangeLabel("15.000 km").urbanTriggerKm(15000)
                    .roadRangeLabel("15.000 km").roadTriggerKm(15000)
                    .controlType("ALTERNATOR_INSPECTION")
                    .notes("Medição periódica de carga, escovas e tensão de correia.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("ALIGNMENT").systemName("Alinhamento e Balanceamento")
                    .urbanRangeLabel("20.000 km").urbanTriggerKm(20000)
                    .roadRangeLabel("20.000 km").roadTriggerKm(20000)
                    .controlType("ALIGNMENT")
                    .notes("Checar também folgas de barra de direção e terminais.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("STARTER").systemName("Motor de Arranque (Revisão)")
                    .urbanRangeLabel("20.000 km").urbanTriggerKm(20000)
                    .roadRangeLabel("20.000 km").roadTriggerKm(20000)
                    .controlType("STARTER")
                    .notes("Inspeção visual, limpeza do coletor, checagem de escovas e teste de solenoide.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("PULLEY_BEARING").systemName("Rolamento da Polia (Guia/Esticador)")
                    .urbanRangeLabel("20.000 km").urbanTriggerKm(20000)
                    .roadRangeLabel("20.000 km").roadTriggerKm(20000)
                    .controlType("PULLEY_BEARING")
                    .notes("Checagem de folga radial/axial, ruído e lubrificação.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("AIR_FILTER").systemName("Filtro de ar do motor")
                    .urbanRangeLabel("20.000 – 30.000 km").urbanTriggerKm(20000)
                    .roadRangeLabel("30.000 – 40.000 km").roadTriggerKm(30000)
                    .controlType(null)
                    .notes("Trocar antes se o vacuômetro indicar restrição.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("BRAKE_PADS").systemName("Lonas / Pastilhas de freio")
                    .urbanRangeLabel("30.000 – 50.000 km").urbanTriggerKm(30000)
                    .roadRangeLabel("60.000 – 100.000 km").roadTriggerKm(60000)
                    .controlType(null)
                    .notes("Verificar regulagem e espessura das lonas.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("APU_DRYER").systemName("Filtro secador de ar (APU)")
                    .urbanRangeLabel("50.000 – 60.000 km").urbanTriggerKm(50000)
                    .roadRangeLabel("60.000 – 80.000 km").roadTriggerKm(60000)
                    .controlType(null)
                    .notes("Essencial para evitar umidade no sistema pneumático.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("GEARBOX_DIFF_OIL").systemName("Óleo do câmbio e diferencial")
                    .urbanRangeLabel("60.000 – 80.000 km").urbanTriggerKm(60000)
                    .roadRangeLabel("80.000 – 120.000 km").roadTriggerKm(80000)
                    .controlType(null)
                    .notes("Verificar nível a cada revisão preventiva.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("WHEEL_HUBS").systemName("Cubos de roda (graxa e vedadores)")
                    .urbanRangeLabel("80.000 – 90.000 km").urbanTriggerKm(80000)
                    .roadRangeLabel("90.000 – 100.000 km").roadTriggerKm(90000)
                    .controlType(null)
                    .notes("Limpeza, troca de graxa e ajuste de pré-carga dos rolamentos.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("COOLANT").systemName("Líquido de arrefecimento")
                    .urbanRangeLabel("80.000 km").urbanTriggerKm(80000)
                    .roadRangeLabel("100.000 km").roadTriggerKm(100000)
                    .controlType(null)
                    .notes("Usar proporção correta de aditivo desmineralizado.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("CLUTCH").systemName("Embreagem (disco e platô)")
                    .urbanRangeLabel("80.000 – 120.000 km").urbanTriggerKm(80000)
                    .roadRangeLabel("150.000 – 250.000 km").roadTriggerKm(150000)
                    .controlType(null)
                    .notes("Regulagem do curso do pedal/atuador a cada 20.000 km.")
                    .build(),
            PreventiveScheduleItemDTO.builder()
                    .code("ALTERNATOR_OVERHAUL").systemName("Alternador (Revisão Geral / Preventiva)")
                    .urbanRangeLabel("150.000 km").urbanTriggerKm(150000)
                    .roadRangeLabel("150.000 km").roadTriggerKm(150000)
                    .controlType("ALTERNATOR")
                    .notes("Substituição de rolamentos internos, anéis coletores, retífica do rotor, troca de diodos e regulador de voltagem.")
                    .build()
    );

    public List<PreventiveScheduleItemDTO> getSchedule() {
        return SCHEDULE_MATRIX;
    }

    public static String inferOperationProfile(Vehicle vehicle) {
        if (vehicle == null) return "URBANO";
        if (vehicle.getBusType() != null) {
            Vehicle.BusType bt = vehicle.getBusType();
            if (bt == Vehicle.BusType.RODOVIARIO
                    || bt == Vehicle.BusType.LUXO_TURISMO
                    || bt == Vehicle.BusType.DOUBLE_DECKER
                    || bt == Vehicle.BusType.FRETADO
                    || bt == Vehicle.BusType.INTERMUNICIPAL
                    || bt == Vehicle.BusType.VIP) {
                return "RODOVIARIO";
            }
            if (bt == Vehicle.BusType.URBANO) {
                return "URBANO";
            }
        }
        if (vehicle.getVehicleType() != null) {
            Vehicle.VehicleType vt = vehicle.getVehicleType();
            if (vt == Vehicle.VehicleType.BUS_ROAD
                    || vt == Vehicle.VehicleType.BUS_LUXURY_TOURISM
                    || vt == Vehicle.VehicleType.BUS_INTERCITY) {
                return "RODOVIARIO";
            }
        }
        String joined = String.join(" ",
                vehicle.getOperationName() != null ? vehicle.getOperationName() : "",
                vehicle.getProjectName() != null ? vehicle.getProjectName() : "",
                vehicle.getDepartment() != null ? vehicle.getDepartment() : "",
                vehicle.getModel() != null ? vehicle.getModel() : ""
        ).toUpperCase();
        if (joined.contains("RODOV") || joined.contains("TURISM") || joined.contains("VIAGEM")
                || joined.contains("DOUBLE") || joined.contains("FRETAM")) {
            return "RODOVIARIO";
        }
        return "URBANO";
    }

    @Transactional
    public FleetWorkOrderDTO evaluateAndAutoOpenForVehicle(Vehicle vehicle) {
        if (vehicle == null || vehicle.getId() == null || vehicle.getDeletedAt() != null) return null;
        if (vehicle.getStatus() == Vehicle.VehicleStatus.INACTIVE
                || vehicle.getStatus() == Vehicle.VehicleStatus.SOLD
                || vehicle.getStatus() == Vehicle.VehicleStatus.BAIXADO
                || vehicle.getStatus() == Vehicle.VehicleStatus.OUT_OF_SERVICE) {
            return null;
        }
        int currentKm = vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0;
        if (currentKm <= 0) return null;

        UUID companyId = vehicle.getCompanyId();
        FleetComponentControlConfig cfg = companyId != null
                ? configRepository.findByCompanyId(companyId).orElse(FleetComponentControlConfig.builder().build())
                : FleetComponentControlConfig.builder().build();

        if (Boolean.FALSE.equals(cfg.getAutoOpenPreventiveOs())) {
            return null;
        }

        List<FleetWorkOrder> existingOrders = workOrderRepository.findByVehicleIdAndDeletedAtIsNullOrderByCreatedAtDesc(vehicle.getId());
        boolean hasOpenPreventive = existingOrders.stream().anyMatch(o ->
                o.getMaintenanceType() == FleetWorkOrder.MaintenanceType.PREVENTIVA
                        && o.getStatus() != FleetWorkOrder.WorkOrderStatus.COMPLETED
                        && o.getStatus() != FleetWorkOrder.WorkOrderStatus.CANCELLED
        );
        if (hasOpenPreventive) {
            return null;
        }

        int lastCompletedPreventiveKm = existingOrders.stream()
                .filter(o -> o.getMaintenanceType() == FleetWorkOrder.MaintenanceType.PREVENTIVA
                        && o.getStatus() == FleetWorkOrder.WorkOrderStatus.COMPLETED)
                .map(o -> o.getOdometerOut() != null ? o.getOdometerOut() : (o.getOdometerIn() != null ? o.getOdometerIn() : 0))
                .max(Integer::compareTo)
                .orElse(0);

        Map<String, Integer> latestControlKm = new HashMap<>();
        for (String ct : FleetComponentControlService.ALL_CONTROL_TYPES) {
            List<FleetComponentControl> found = controlRepository.findByVehicleIdAndControlTypeAndIsLatestTrue(vehicle.getId(), ct);
            if (!found.isEmpty() && found.get(0).getServiceKm() != null) {
                latestControlKm.put(ct, found.get(0).getServiceKm());
            }
        }

        String profile = inferOperationProfile(vehicle);
        boolean isRoad = "RODOVIARIO".equals(profile);

        List<String> triggeredDescriptions = new ArrayList<>();
        Set<String> triggeredControlTypes = new LinkedHashSet<>();
        boolean oilTriggered = false;
        boolean fuelFilterTriggered = false;
        boolean airFilterTriggered = false;
        boolean alternatorOverhaulTriggered = false;

        for (PreventiveScheduleItemDTO rule : SCHEDULE_MATRIX) {
            int intervalKm = resolveIntervalForRule(rule, isRoad, cfg);
            int baselineKm = rule.getControlType() != null && latestControlKm.containsKey(rule.getControlType())
                    ? latestControlKm.get(rule.getControlType())
                    : lastCompletedPreventiveKm;

            int nextDueKm = baselineKm + intervalKm;
            if (currentKm >= nextDueKm) {
                int overdueKm = currentKm - nextDueKm;
                triggeredDescriptions.add(String.format("• %s (Previsto: %,d km | Excedido: +%,d km) — %s",
                        rule.getSystemName(), nextDueKm, overdueKm, rule.getNotes()).replace(',', '.'));
                if (rule.getControlType() != null) {
                    triggeredControlTypes.add(rule.getControlType());
                }
                if ("OIL_ENGINE".equals(rule.getCode())) oilTriggered = true;
                if ("FUEL_FILTER".equals(rule.getCode())) fuelFilterTriggered = true;
                if ("AIR_FILTER".equals(rule.getCode())) airFilterTriggered = true;
                if ("ALTERNATOR_OVERHAUL".equals(rule.getCode())) alternatorOverhaulTriggered = true;
            }
        }

        if (triggeredDescriptions.isEmpty()) {
            return null;
        }

        StringBuilder descBuilder = new StringBuilder();
        descBuilder.append(String.format("OS Preventiva Automática (%s) disparada aos %,d km.\n\nItens vencidos para execução:",
                isRoad ? "Operação Rodoviária" : "Operação Urbana", currentKm).replace(',', '.'));
        for (String line : triggeredDescriptions) {
            descBuilder.append("\n").append(line);
        }
        if (alternatorOverhaulTriggered) {
            descBuilder.append("\n\n[INTERVENÇÃO EM BANCADA - ALTERNADOR 150.000 KM]\n")
                    .append("1. Troca de Rolamentos Internos (evita travamento do eixo e rompimento de correia);\n")
                    .append("2. Substituição de Escovas e Anéis Coletores;\n")
                    .append("3. Retífica do Rotor + Placa Retificadora (diodos) e Regulador de Voltagem.");
        }

        String triggeredSummary = String.join("\n", triggeredDescriptions);
        String osNumber = generateOsNumber();
        String modelToUse = cfg.getDefaultPreventiveModel() != null && !cfg.getDefaultPreventiveModel().isBlank()
                ? cfg.getDefaultPreventiveModel()
                : "MODELO_2";

        FleetWorkOrder entity = FleetWorkOrder.builder()
                .osNumber(osNumber)
                .vehicle(vehicle)
                .companyId(companyId)
                .workPost(vehicle.getWorkPostEntity())
                .garage(vehicle.getGarage())
                .clientId(vehicle.getClientId())
                .maintenanceType(FleetWorkOrder.MaintenanceType.PREVENTIVA)
                .preventiveModel(modelToUse)
                .operationProfile(profile)
                .autoGenerated(true)
                .triggeredItemsSummary(triggeredSummary)
                .status(FleetWorkOrder.WorkOrderStatus.OPEN)
                .priority(alternatorOverhaulTriggered
                        ? FleetWorkOrder.WorkOrderPriority.HIGH
                        : FleetWorkOrder.WorkOrderPriority.MEDIUM)
                .laborType(FleetWorkOrder.LaborType.INTERNAL)
                .stopDate(LocalDate.now())
                .stopTime(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .odometerIn(currentKm)
                .stopReason("Preventiva Automática (" + triggeredDescriptions.size() + " item(ns) no KM " + currentKm + ")")
                .anomaliesDescription(descBuilder.toString())
                .preventiveControlTypes(triggeredControlTypes.isEmpty() ? null : String.join(",", triggeredControlTypes))
                .oilFilterChanged(oilTriggered)
                .dieselFilterChanged(fuelFilterTriggered)
                .waterSeparatorFilterChanged(fuelFilterTriggered)
                .airFilterChanged(airFilterTriggered)
                .notes("Abertura automática de OS Preventiva Modelo 2 (Check-List Verificação de Frota).")
                .checklistItems(new ArrayList<>())
                .build();

        List<ChecklistItem> masterItems = checklistItemRepository.findByTemplateModelAndAtivoTrueOrderByOrdemAsc(
                "MODELO_2".equalsIgnoreCase(modelToUse) ? "MODELO_2" : "MODELO_1");
        for (ChecklistItem master : masterItems) {
            entity.getChecklistItems().add(FleetWorkOrderChecklist.builder()
                    .workOrder(entity)
                    .checklistItem(master)
                    .situacao(FleetWorkOrderChecklist.ChecklistStatus.OK)
                    .build());
        }

        FleetWorkOrder saved = workOrderRepository.save(entity);
        notifyAutoCreated(saved, vehicle, triggeredDescriptions.size(), alternatorOverhaulTriggered);
        log.info("🤖 OS Preventiva Automática ({}) criada para veículo {} ({} km): {} item(ns)",
                saved.getOsNumber(), vehicle.getPlate(), currentKm, triggeredDescriptions.size());
        return FleetWorkOrderDTO.fromEntity(saved);
    }

    private int resolveIntervalForRule(PreventiveScheduleItemDTO rule, boolean isRoad, FleetComponentControlConfig cfg) {
        if ("ALTERNATOR".equals(rule.getControlType()) && cfg.getAlternatorIntervalKm() != null) {
            return cfg.getAlternatorIntervalKm();
        }
        if ("ALTERNATOR_INSPECTION".equals(rule.getControlType()) && cfg.getAlternatorQuickCheckIntervalKm() != null) {
            return cfg.getAlternatorQuickCheckIntervalKm();
        }
        if ("ALIGNMENT".equals(rule.getControlType()) && cfg.getAlignmentIntervalKm() != null && !isRoad) {
            return cfg.getAlignmentIntervalKm();
        }
        if ("PULLEY_BEARING".equals(rule.getControlType()) && cfg.getPulleyBearingIntervalKm() != null) {
            return cfg.getPulleyBearingIntervalKm();
        }
        return isRoad ? rule.getRoadTriggerKm() : rule.getUrbanTriggerKm();
    }

    private void notifyAutoCreated(FleetWorkOrder order, Vehicle vehicle, int count, boolean hasAlternator150k) {
        try {
            if (messageService == null || userRepository == null || order.getCompanyId() == null) return;
            List<User> recipients = userRepository.findTireSafetyNotificationRecipients(order.getCompanyId());
            if (recipients == null || recipients.isEmpty()) return;
            Set<UUID> recipientIds = new LinkedHashSet<>();
            for (User r : recipients) {
                if (r.getId() != null) recipientIds.add(r.getId());
            }
            if (recipientIds.isEmpty()) return;
            User sender = userRepository.findSystemMessageSenderCandidates().stream().findFirst().orElse(recipients.get(0));

            String plate = vehicle.getFleetNumber() != null && !vehicle.getFleetNumber().isBlank()
                    ? "Frota " + vehicle.getFleetNumber() + " (" + vehicle.getPlate() + ")"
                    : vehicle.getPlate();
            String title = (hasAlternator150k ? "[ALTERNADOR 150K] " : "") + "OS Preventiva Automática " + order.getOsNumber() + " • " + plate;
            String content = String.format("OS %s gerada automaticamente aos %d km (%d item(ns) no plano %s).\n%s",
                    order.getOsNumber(),
                    order.getOdometerIn() != null ? order.getOdometerIn() : 0,
                    count,
                    order.getOperationProfile(),
                    order.getTriggeredItemsSummary() != null ? order.getTriggeredItemsSummary() : "");

            MessageRequestDTO msgDto = new MessageRequestDTO();
            msgDto.setTitle(title);
            msgDto.setContent(content);
            msgDto.setType(MessageType.INDIVIDUAL);
            msgDto.setPriority(hasAlternator150k ? MessagePriority.URGENT : MessagePriority.NORMAL);
            msgDto.setRecipientIds(recipientIds);
            msgDto.setSendNotification(true);
            msgDto.setSendEmail(false);
            messageService.createMessage(msgDto, sender);
        } catch (Exception e) {
            log.debug("Aviso ao notificar OS Preventiva Automática {}: {}", order.getOsNumber(), e.getMessage());
        }
    }

    @Transactional
    public AutoSweepResultDTO runAutoSweepForCompany(UUID companyId) {
        return runAutoSweepForCompany(companyId, 50);
    }

    @Transactional
    public AutoSweepResultDTO runAutoSweepForCompany(UUID companyId, int maxCreated) {
        List<Vehicle> vehicles = companyId != null
                ? vehicleRepository.findByCompanyId(companyId)
                : vehicleRepository.findAll().stream().filter(v -> v.getDeletedAt() == null).toList();

        int cap = maxCreated > 0 ? maxCreated : 50;
        int checked = 0;
        List<FleetWorkOrderDTO> created = new ArrayList<>();

        for (Vehicle v : vehicles) {
            checked++;
            if (created.size() >= cap) break;
            try {
                FleetWorkOrderDTO dto = evaluateAndAutoOpenForVehicle(v);
                if (dto != null) {
                    created.add(dto);
                }
            } catch (Exception e) {
                log.warn("Falha ao avaliar preventiva automática do veículo {}: {}", v.getPlate(), e.getMessage());
            }
        }
        return AutoSweepResultDTO.builder()
                .checkedVehicles(checked)
                .createdCount(created.size())
                .createdOrders(created)
                .build();
    }

    @Scheduled(cron = "0 0 6 * * ?")
    public void scheduledDailyPreventiveSweep() {
        try {
            List<Company> companies = companyRepository.findAll();
            for (Company c : companies) {
                AutoSweepResultDTO res = runAutoSweepForCompany(c.getId(), 50);
                if (res.getCreatedCount() > 0) {
                    log.info("📅 Varredura diária de OS Preventiva Modelo 2 (Empresa {}): {} OS criadas",
                            c.getName(), res.getCreatedCount());
                }
            }
        } catch (Exception e) {
            log.error("Erro na varredura automática de OS Preventiva: {}", e.getMessage());
        }
    }

    private String generateOsNumber() {
        int currentYear = Year.now().getValue();
        long count = workOrderRepository.count() + 1;
        String osNumber = String.format("OS-%d-%06d", currentYear, count);
        while (workOrderRepository.existsByOsNumber(osNumber)) {
            count++;
            osNumber = String.format("OS-%d-%06d", currentYear, count);
        }
        return osNumber;
    }
}
