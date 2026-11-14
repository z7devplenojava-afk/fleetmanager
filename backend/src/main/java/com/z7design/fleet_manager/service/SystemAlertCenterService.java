package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.SystemAlertCenterResponseDTO;
import com.z7design.fleet_manager.dto.SystemAlertItemDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import com.z7design.fleet_manager.model.enums.TireStatus;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemAlertCenterService {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int ALERT_WINDOW_DAYS = 30;

    private final VehicleRepository vehicleRepository;
    private final MaintenancePlanRepository maintenancePlanRepository;
    private final VehicleMaintenanceRepository vehicleMaintenanceRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final TireRepository tireRepository;
    private final TireService tireService;
    private final FleetComponentControlService fleetComponentControlService;
    private final DriverRepository driverRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentRepository documentRepository;
    private final CfmeDocumentRepository cfmeDocumentRepository;
    private final ContractRepository contractRepository;
    private final ScheduleRepository scheduleRepository;
    private final CompanyRepository companyRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountsReceivableRepository accountsReceivableRepository;

    @Transactional(readOnly = true)
    public SystemAlertCenterResponseDTO getAlertsForUser(User user) {
        return getAlertsForUser(user, null);
    }

    @Transactional(readOnly = true)
    public SystemAlertCenterResponseDTO getAlertsForUser(User user, String moduleFilter) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        ScopeContext scope = resolveScope(user);

        List<SystemAlertItemDTO> collected = new ArrayList<>();
        Set<String> dedupKeys = new HashSet<>();
        LocalDate today = LocalDate.now();

        if (scope.includeVehicles) {
            collectVehicleAlerts(companyId, today, scope, collected, dedupKeys);
        }
        if (scope.includeDrivers) {
            collectDriverAlerts(companyId, today, scope, collected, dedupKeys);
        }
        if (scope.includeRh) {
            collectRhAlerts(companyId, today, scope, collected, dedupKeys);
        }
        if (scope.includeFinancial) {
            collectFinancialAlerts(companyId, today, collected, dedupKeys);
        }
        if (scope.includeCompany) {
            collectCompanyAlerts(companyId, today, collected, dedupKeys);
        }

        int critical = 0, high = 0, medium = 0, low = 0;
        int vehicleCount = 0, driverCount = 0, companyCount = 0, financialCount = 0, rhCount = 0;
        for (SystemAlertItemDTO a : collected) {
            switch (a.getPriority()) {
                case "CRITICAL" -> critical++;
                case "HIGH" -> high++;
                case "MEDIUM" -> medium++;
                default -> low++;
            }
            if ("FINANCEIRO".equalsIgnoreCase(a.getModule()) || "FINANCIAL".equalsIgnoreCase(a.getEntityType())) {
                financialCount++;
            } else if ("RH".equalsIgnoreCase(a.getModule()) || "EMPLOYEE".equalsIgnoreCase(a.getEntityType())) {
                rhCount++;
            }
            switch (a.getEntityType()) {
                case "VEHICLE" -> vehicleCount++;
                case "DRIVER" -> driverCount++;
                case "COMPANY" -> companyCount++;
                default -> { }
            }
        }

        // Filtro contextual por módulo
        List<SystemAlertItemDTO> resultAlerts = collected;
        if (moduleFilter != null && !moduleFilter.isBlank() && !"ALL".equalsIgnoreCase(moduleFilter)) {
            String target = moduleFilter.trim().toUpperCase();
            resultAlerts = collected.stream()
                    .filter(a -> target.equalsIgnoreCase(a.getModule()) || target.equalsIgnoreCase(a.getEntityType()))
                    .toList();
        }

        resultAlerts = new ArrayList<>(resultAlerts);
        resultAlerts.sort(Comparator
                .comparing(SystemAlertItemDTO::getPriorityRank)
                .thenComparing(SystemAlertItemDTO::getDaysRemaining, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(SystemAlertItemDTO::getKmRemaining, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(SystemAlertItemDTO::getSubjectTitle));

        List<String> scopes = new ArrayList<>();
        if (scope.includeVehicles) scopes.add("VEHICLE");
        if (scope.includeDrivers) scopes.add("DRIVER");
        if (scope.includeRh) scopes.add("RH");
        if (scope.includeFinancial) scopes.add("FINANCIAL");
        if (scope.includeCompany) scopes.add("COMPANY");

        return SystemAlertCenterResponseDTO.builder()
                .totalCount(resultAlerts.size())
                .criticalCount(critical)
                .highCount(high)
                .mediumCount(medium)
                .lowCount(low)
                .vehicleCount(vehicleCount)
                .driverCount(driverCount)
                .companyCount(companyCount)
                .financialCount(financialCount)
                .rhCount(rhCount)
                .visibleScopes(scopes)
                .alerts(resultAlerts)
                .build();
    }

    private void collectVehicleAlerts(
            UUID companyId,
            LocalDate today,
            ScopeContext scope,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {

        List<Vehicle> vehicles = companyId != null
                ? vehicleRepository.findByCompanyId(companyId)
                : vehicleRepository.findAll().stream().filter(v -> v.getDeletedAt() == null).toList();

        if (scope.driverOnlySelf) {
            vehicles = filterVehiclesForDriver(vehicles, scope);
        }

        Map<UUID, Vehicle> vehicleMap = new HashMap<>();
        for (Vehicle v : vehicles) {
            vehicleMap.put(v.getId(), v);
        }
        if (vehicleMap.isEmpty()) return;

        // 1. Planos de Manutenção (Preventiva e Troca de Óleo de Motor)
        Set<UUID> vehiclesWithPlanAlert = new HashSet<>();
        List<MaintenancePlan> plans = maintenancePlanRepository.findActiveWithVehicleByCompany(companyId);
        for (MaintenancePlan plan : plans) {
            Vehicle v = plan.getVehicle();
            if (v == null || !vehicleMap.containsKey(v.getId())) continue;

            boolean isOil = isOilRelatedText(plan.getTaskName());
            String category = isOil ? "OIL_CHANGE" : "PREVENTIVE";
            String label = isOil ? "Troca de Óleo de Motor" : "Vencimento de Preventiva";

            Long daysRem = plan.getNextDueDate() != null ? ChronoUnit.DAYS.between(today, plan.getNextDueDate()) : null;
            Integer kmRem = (plan.getNextDueKm() != null && v.getCurrentMileage() != null)
                    ? plan.getNextDueKm() - v.getCurrentMileage()
                    : null;

            boolean dueByDate = daysRem != null && daysRem <= ALERT_WINDOW_DAYS;
            boolean dueByKm = kmRem != null && kmRem <= 2000;
            if (!dueByDate && !dueByKm) continue;

            String priority = worsePriority(
                    dueByDate ? classifyByDays(daysRem) : null,
                    dueByKm ? classifyByKm(kmRem) : null
            );

            String statusText = buildDateOrKmText(plan.getNextDueDate(), daysRem, kmRem);
            String dedup = "VEH-" + v.getId() + "-" + category + "-" + plan.getId();
            if (dedupKeys.add(dedup)) {
                vehiclesWithPlanAlert.add(v.getId());
                out.add(SystemAlertItemDTO.builder()
                        .id(dedup)
                        .entityType("VEHICLE")
                        .category(category)
                        .categoryLabel(label + " • " + plan.getTaskName())
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle(formatVehicleTitle(v))
                        .subjectSubtitle((v.getBrand() != null ? v.getBrand() + " " : "") + (v.getModel() != null ? v.getModel() : ""))
                        .dueDate(plan.getNextDueDate())
                        .daysRemaining(daysRem)
                        .kmRemaining(kmRem)
                        .statusText(statusText)
                        .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/manutencao")
                        .build());
            }
        }

        // 2. Próxima manutenção direta no cadastro do veículo
        for (Vehicle v : vehicles) {
            if (v.getNextMaintenanceDate() != null && !vehiclesWithPlanAlert.contains(v.getId())) {
                long daysRem = ChronoUnit.DAYS.between(today, v.getNextMaintenanceDate());
                if (daysRem <= ALERT_WINDOW_DAYS) {
                    String priority = classifyByDays(daysRem);
                    String dedup = "VEH-" + v.getId() + "-NEXT-MAINT-" + v.getNextMaintenanceDate();
                    if (dedupKeys.add(dedup)) {
                        out.add(SystemAlertItemDTO.builder()
                                .id(dedup)
                                .entityType("VEHICLE")
                                .category("PREVENTIVE")
                                .categoryLabel("Vencimento de Preventiva")
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle(formatVehicleTitle(v))
                                .subjectSubtitle((v.getBrand() != null ? v.getBrand() + " " : "") + (v.getModel() != null ? v.getModel() : ""))
                                .dueDate(v.getNextMaintenanceDate())
                                .daysRemaining(daysRem)
                                .statusText(formatDueDateText(v.getNextMaintenanceDate(), daysRem))
                                .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/manutencao")
                                .build());
                    }
                }
            }

            // Documentos diretos no veículo (Seguro, Documentação CRLV/Licenciamento)
            addVehicleFieldExpiryAlert(v, v.getDocumentationExpiryDate(), "Documentação do Veículo (CRLV/Lic.)", today, scope, out, dedupKeys);
            addVehicleFieldExpiryAlert(v, v.getInsuranceExpiryDate(), "Seguro do Veículo", today, scope, out, dedupKeys);
            addVehicleFieldExpiryAlert(v, v.getInsuranceSecondExpiryDate(), "Apólice / Seguro Complementar", today, scope, out, dedupKeys);
        }

        // 3. Manutenções agendadas próximas
        try {
            List<VehicleMaintenance> scheduled = vehicleMaintenanceRepository.findByStatusOrderByDateDesc(VehicleMaintenance.MaintenanceStatus.SCHEDULED);
            for (VehicleMaintenance vm : scheduled) {
                if (vm.getVehicle() == null || !vehicleMap.containsKey(vm.getVehicle().getId()) || vm.getDate() == null) continue;
                long daysRem = ChronoUnit.DAYS.between(today, vm.getDate());
                if (daysRem > ALERT_WINDOW_DAYS) continue;

                boolean isOil = isOilRelatedText(vm.getDescription());
                String category = isOil ? "OIL_CHANGE" : "PREVENTIVE";
                String label = isOil ? "Troca de Óleo de Motor" : "Manutenção Preventiva Agendada";
                String priority = classifyByDays(daysRem);
                String dedup = "VEH-" + vm.getVehicle().getId() + "-VM-" + vm.getId();
                if (dedupKeys.add(dedup)) {
                    out.add(SystemAlertItemDTO.builder()
                            .id(dedup)
                            .entityType("VEHICLE")
                            .category(category)
                            .categoryLabel(label)
                            .priority(priority)
                            .priorityRank(priorityRank(priority))
                            .subjectTitle(formatVehicleTitle(vm.getVehicle()))
                            .subjectSubtitle(vm.getDescription())
                            .dueDate(vm.getDate())
                            .daysRemaining(daysRem)
                            .statusText(formatDueDateText(vm.getDate(), daysRem))
                            .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/manutencao")
                            .build());
                }
            }
        } catch (Exception e) {
            log.debug("Ignorando falha ao consultar manutenções agendadas: {}", e.getMessage());
        }

        // 4. Documentos cadastrados em vehicle_documents
        List<VehicleDocument> vDocs = vehicleDocumentRepository.findWithExpiryAndVehicleByCompany(companyId);
        for (VehicleDocument doc : vDocs) {
            Vehicle v = doc.getVehicle();
            if (v == null || !vehicleMap.containsKey(v.getId()) || doc.getExpiryDate() == null) continue;
            long daysRem = ChronoUnit.DAYS.between(today, doc.getExpiryDate());
            if (daysRem > ALERT_WINDOW_DAYS) continue;
            String docName = doc.getTitle() != null && !doc.getTitle().isBlank()
                    ? doc.getTitle()
                    : (doc.getDocType() != null ? doc.getDocType().getDescription() : "Documento");
            String priority = classifyByDays(daysRem);
            String dedup = "VEH-" + v.getId() + "-VDOC-" + doc.getId();
            if (dedupKeys.add(dedup)) {
                out.add(SystemAlertItemDTO.builder()
                        .id(dedup)
                        .entityType("VEHICLE")
                        .category("VEHICLE_DOCUMENT")
                        .categoryLabel("Vencimento de Documentos do Veículo • " + docName)
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle(formatVehicleTitle(v))
                        .subjectSubtitle(doc.getDocumentNumber() != null ? "Doc Nº " + doc.getDocumentNumber() : docName)
                        .dueDate(doc.getExpiryDate())
                        .daysRemaining(daysRem)
                        .statusText(formatDueDateText(doc.getExpiryDate(), daysRem))
                        .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/frota")
                        .build());
            }
        }

        // 5. Pneus (TWI/Sulco, DOT 5 anos, Ciclo de KM, Recapado no Eixo Dianteiro)
        TireLifecycleConfig cfg = tireService.getLifecycleConfig(companyId);
        List<Tire> companyTires = companyId != null ? tireRepository.findByCompanyId(companyId) : tireRepository.findAll();
        for (Tire tire : companyTires) {
            if (tire.getStatus() != TireStatus.IN_USE || tire.getVehicleId() == null) continue;
            Vehicle v = vehicleMap.get(tire.getVehicleId());
            if (v == null) continue;

            int recaps = tire.getRecapCount() != null ? tire.getRecapCount() : 0;
            String tireIdLabel = tire.getFireNumber() != null && !tire.getFireNumber().isBlank()
                    ? tire.getFireNumber()
                    : tire.getSerialNumber();
            int installKm = tire.getInstallKm() != null ? tire.getInstallKm() : 0;
            int currVehKm = v.getCurrentMileage() != null ? v.getCurrentMileage() : installKm;
            int mountedCycleKm = Math.max(0, currVehKm - installKm);
            int currentLifeKm = (tire.getCurrentLifeMileage() != null ? tire.getCurrentLifeMileage() : 0) + mountedCycleKm;
            int maxCycleKm = resolveCycleMaxKm(recaps, tire.getLineType(), cfg);
            int kmRemaining = maxCycleKm - currentLifeKm;

            String priority = null;
            String reason = null;
            if (tire.getAxleNumber() != null && tire.getAxleNumber() == 1 && recaps > 0) {
                priority = "CRITICAL";
                reason = "Pneu recapado no Eixo Dianteiro (Exceção de Segurança)";
            } else if (tire.getCurrentTreadDepth() != null && tire.getCurrentTreadDepth().compareTo(cfg.getMinTreadDepthTwi()) <= 0) {
                priority = "CRITICAL";
                reason = "Sulco no limite TWI (" + tire.getCurrentTreadDepth() + " mm)";
            } else if (tire.getCurrentTreadDepth() != null && tire.getCurrentTreadDepth().compareTo(cfg.getAlertTreadDepthMm()) <= 0) {
                priority = "HIGH";
                reason = "Sulco baixo para troca (" + tire.getCurrentTreadDepth() + " mm)";
            } else if (isDotExpired(tire.getDot(), cfg.getDotMaxAgeYears())) {
                priority = "HIGH";
                reason = "Validade da borracha vencida (DOT " + tire.getDot() + " > " + cfg.getDotMaxAgeYears() + " anos)";
            } else if (kmRemaining <= 5000) {
                priority = kmRemaining <= 500 ? "CRITICAL" : (kmRemaining <= 2000 ? "HIGH" : "MEDIUM");
                reason = kmRemaining <= 0
                        ? "Ciclo de quilometragem atingido (" + currentLifeKm + " km)"
                        : "Troca preventiva de pneu próxima (restam " + kmRemaining + " km)";
            }

            if (priority != null) {
                String dedup = "VEH-" + v.getId() + "-TIRE-" + tire.getId();
                if (dedupKeys.add(dedup)) {
                    out.add(SystemAlertItemDTO.builder()
                            .id(dedup)
                            .entityType("VEHICLE")
                            .category("TIRE_CHANGE")
                            .categoryLabel("Vencimento de Troca de Pneu • Pneu " + tireIdLabel)
                            .priority(priority)
                            .priorityRank(priorityRank(priority))
                            .subjectTitle(formatVehicleTitle(v))
                            .subjectSubtitle(reason + " • " + tire.getBrand() + " " + tire.getModel())
                            .kmRemaining(kmRemaining)
                            .statusText(reason)
                            .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/pneus")
                            .build());
                }
            }
        }

        // 6. Controles Preventivos de Componentes (Alinhamento, Óleo, Polia, Arranque, Alternador)
        try {
            var compDash = fleetComponentControlService.getDashboard(companyId, null, null, null);
            if (compDash != null && compDash.getExpiringAlerts() != null) {
                for (var item : compDash.getExpiringAlerts()) {
                    if (!vehicleMap.containsKey(item.getVehicleId())) continue;
                    int kmRem = item.getKmRemaining() != null ? item.getKmRemaining() : 0;
                    String category = "ENGINE_OIL".equals(item.getControlType()) ? "OIL_CHANGE" : "PREVENTIVE";
                    String priority = kmRem <= 500 ? "CRITICAL" : (kmRem <= 2000 ? "HIGH" : "MEDIUM");
                    String dedup = "VEH-" + item.getVehicleId() + "-COMP-" + item.getControlType();
                    if (dedupKeys.add(dedup)) {
                        String statusMsg = kmRem <= 0
                                ? "KM vencido há " + Math.abs(kmRem) + " km (Próx: " + item.getNextDueKm() + " km)"
                                : "Faltam " + kmRem + " km (Próx: " + item.getNextDueKm() + " km)";
                        Vehicle v = vehicleMap.get(item.getVehicleId());
                        out.add(SystemAlertItemDTO.builder()
                                .id(dedup)
                                .entityType("VEHICLE")
                                .category(category)
                                .categoryLabel(item.getControlLabel())
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle(formatVehicleTitle(v))
                                .subjectSubtitle((v.getBrand() != null ? v.getBrand() + " " : "") + (v.getModel() != null ? v.getModel() : ""))
                                .kmRemaining(kmRem)
                                .statusText(statusMsg)
                                .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/manutencao?tab=componentes")
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Ignorando falha ao consultar controles de componentes: {}", e.getMessage());
        }
    }

    private void collectDriverAlerts(
            UUID companyId,
            LocalDate today,
            ScopeContext scope,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {

        List<Driver> drivers = driverRepository.findWithCnhExpirationByCompany(companyId);
        for (Driver d : drivers) {
            if (scope.driverOnlySelf && !matchesDriverSelf(d, scope)) continue;
            if (d.getCnhExpiration() == null) continue;
            long daysRem = ChronoUnit.DAYS.between(today, d.getCnhExpiration());
            if (daysRem > ALERT_WINDOW_DAYS) continue;

            String priority = classifyByDays(daysRem);
            String dedup = "DRV-CNH-" + normalizeName(d.getName()) + "-" + d.getCnhExpiration();
            if (dedupKeys.add(dedup)) {
                out.add(SystemAlertItemDTO.builder()
                        .id("DRV-" + d.getId() + "-CNH")
                        .entityType("DRIVER")
                        .category("DRIVER_DOCUMENT")
                        .categoryLabel("Vencimento de Documentos do Motorista • CNH" + (d.getCnhCategory() != null ? " (" + d.getCnhCategory() + ")" : ""))
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle("Motorista: " + d.getName())
                        .subjectSubtitle("CNH nº " + (d.getLicenseNumber() != null ? d.getLicenseNumber() : "N/I"))
                        .dueDate(d.getCnhExpiration())
                        .daysRemaining(daysRem)
                        .statusText(formatDueDateText(d.getCnhExpiration(), daysRem))
                        .routeTo(scope.driverOnlySelf ? "/driver-dashboard" : "/rh/funcionarios")
                        .build());
            }
        }

        List<Employee> employees = employeeRepository.findWithDocumentExpirationsByCompany(companyId);
        for (Employee e : employees) {
            if (scope.driverOnlySelf && !matchesEmployeeSelf(e, scope)) continue;

            if (e.getCnhExpirationDate() != null) {
                long daysRem = ChronoUnit.DAYS.between(today, e.getCnhExpirationDate());
                if (daysRem <= ALERT_WINDOW_DAYS) {
                    String priority = classifyByDays(daysRem);
                    String dedup = "DRV-CNH-" + normalizeName(e.getName()) + "-" + e.getCnhExpirationDate();
                    if (dedupKeys.add(dedup)) {
                        out.add(SystemAlertItemDTO.builder()
                                .id("EMP-" + e.getId() + "-CNH")
                                .entityType("DRIVER")
                                .category("DRIVER_DOCUMENT")
                                .categoryLabel("Vencimento de Documentos do Motorista • CNH")
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle("Motorista: " + e.getName())
                                .subjectSubtitle("CNH nº " + (e.getCnhNumber() != null ? e.getCnhNumber() : "N/I"))
                                .dueDate(e.getCnhExpirationDate())
                                .daysRemaining(daysRem)
                                .statusText(formatDueDateText(e.getCnhExpirationDate(), daysRem))
                                .routeTo(scope.driverOnlySelf ? "/driver-dashboard" : "/rh/funcionarios")
                                .build());
                    }
                }
            }

            if (e.getNextExameMedico() != null) {
                long daysRem = ChronoUnit.DAYS.between(today, e.getNextExameMedico());
                if (daysRem <= ALERT_WINDOW_DAYS) {
                    String priority = classifyByDays(daysRem);
                    String dedup = "EMP-" + e.getId() + "-ASO-" + e.getNextExameMedico();
                    if (dedupKeys.add(dedup)) {
                        out.add(SystemAlertItemDTO.builder()
                                .id(dedup)
                                .entityType("DRIVER")
                                .category("DRIVER_DOCUMENT")
                                .categoryLabel("Vencimento de Documentos do Motorista • Exame Médico (ASO)")
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle("Motorista: " + e.getName())
                                .subjectSubtitle("Exame Periódico / ASO")
                                .dueDate(e.getNextExameMedico())
                                .daysRemaining(daysRem)
                                .statusText(formatDueDateText(e.getNextExameMedico(), daysRem))
                                .routeTo(scope.driverOnlySelf ? "/driver-dashboard" : "/sst")
                                .build());
                    }
                }
            }
        }

        List<Document> empDocs = documentRepository.findWithExpirationByCompany(companyId);
        for (Document doc : empDocs) {
            if (doc.getExpirationDate() == null || doc.getEmployee() == null) continue;
            if (scope.driverOnlySelf && !matchesEmployeeSelf(doc.getEmployee(), scope)) continue;

            LocalDate expDate = doc.getExpirationDate().toLocalDate();
            long daysRem = ChronoUnit.DAYS.between(today, expDate);
            if (daysRem > ALERT_WINDOW_DAYS) continue;

            String priority = classifyByDays(daysRem);
            String dedup = "DOC-" + doc.getId();
            if (dedupKeys.add(dedup)) {
                String docTypeLabel = doc.getType() != null ? doc.getType().name() : "Documento";
                out.add(SystemAlertItemDTO.builder()
                        .id(dedup)
                        .entityType("DRIVER")
                        .category("DRIVER_DOCUMENT")
                        .categoryLabel("Vencimento de Documentos do Motorista • " + docTypeLabel)
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle("Motorista: " + doc.getEmployee().getName())
                        .subjectSubtitle(doc.getDescription() != null ? doc.getDescription() : "Doc " + doc.getNumber())
                        .dueDate(expDate)
                        .daysRemaining(daysRem)
                        .statusText(formatDueDateText(expDate, daysRem))
                        .routeTo(scope.driverOnlySelf ? "/driver-dashboard" : "/rh/funcionarios")
                        .build());
            }
        }
    }

    private void collectCompanyAlerts(
            UUID companyId,
            LocalDate today,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {

        String companyName = "Empresa";
        if (companyId != null) {
            companyName = companyRepository.findById(companyId).map(Company::getName).orElse("Empresa");
        }

        // Documentos CFME / Certidões / Alvarás / Licenças regulatórias da Empresa
        List<CfmeDocument> cfmeDocs = cfmeDocumentRepository.findWithExpiryByCompany(companyId);
        for (CfmeDocument doc : cfmeDocs) {
            if (doc.getExpiryDate() == null) continue;
            long daysRem = ChronoUnit.DAYS.between(today, doc.getExpiryDate());
            if (daysRem > ALERT_WINDOW_DAYS) continue;

            String priority = classifyByDays(daysRem);
            String dedup = "CFME-" + doc.getId();
            if (dedupKeys.add(dedup)) {
                String catName = doc.getCategory() != null ? doc.getCategory().getDescription() : "Documento";
                out.add(SystemAlertItemDTO.builder()
                        .id(dedup)
                        .entityType("COMPANY")
                        .category("COMPANY_DOCUMENT")
                        .categoryLabel("Documentos / Certidões da Empresa • " + catName)
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle("Empresa: " + companyName)
                        .subjectSubtitle((doc.getTitle() != null ? doc.getTitle() : catName) + (doc.getIssuer() != null ? " • " + doc.getIssuer() : ""))
                        .dueDate(doc.getExpiryDate())
                        .daysRemaining(daysRem)
                        .statusText(formatDueDateText(doc.getExpiryDate(), daysRem))
                        .routeTo("/manutencao/certificacoes-cfme")
                        .build());
            }
        }

        // Contratos de Clientes ativos próximos do vencimento
        List<Contract> contracts = contractRepository.findActiveWithEndDateByCompany(companyId);
        for (Contract c : contracts) {
            if (c.getEndDate() == null) continue;
            long daysRem = ChronoUnit.DAYS.between(today, c.getEndDate());
            if (daysRem > ALERT_WINDOW_DAYS) continue;

            String priority = classifyByDays(daysRem);
            String dedup = "CONTRACT-" + c.getId();
            if (dedupKeys.add(dedup)) {
                String clientName = c.getClient() != null ? c.getClient().getName() : companyName;
                out.add(SystemAlertItemDTO.builder()
                        .id(dedup)
                        .entityType("COMPANY")
                        .category("COMPANY_DOCUMENT")
                        .categoryLabel("Vencimento de Contrato da Empresa")
                        .priority(priority)
                        .priorityRank(priorityRank(priority))
                        .subjectTitle("Empresa / Cliente: " + clientName)
                        .subjectSubtitle("Contrato " + c.getContractNumber() + " — " + c.getDescription())
                        .dueDate(c.getEndDate())
                        .daysRemaining(daysRem)
                        .statusText(formatDueDateText(c.getEndDate(), daysRem))
                        .routeTo("/contratos")
                        .build());
            }
        }
    }

    private void collectFinancialAlerts(
            UUID companyId,
            LocalDate today,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {

        // 1. Contas a Pagar (Invoices) não pagas vencidas ou vencendo em até 30 dias
        try {
            LocalDate maxDate = today.plusDays(ALERT_WINDOW_DAYS);
            List<Invoice> payableList = invoiceRepository.findByDueDateBetween(today.minusDays(180), maxDate);
            for (Invoice inv : payableList) {
                if (companyId != null && inv.getCompanyId() != null && !companyId.equals(inv.getCompanyId())) {
                    continue;
                }
                if (inv.getStatus() == ExpenseStatus.PAGA || inv.getStatus() == ExpenseStatus.CANCELADA) {
                    continue;
                }
                if (inv.getDueDate() == null) continue;

                long daysRem = ChronoUnit.DAYS.between(today, inv.getDueDate());
                String priority = classifyByDays(daysRem);
                String dedup = "FIN-PAYABLE-" + inv.getId();
                if (dedupKeys.add(dedup)) {
                    String title = inv.getDescription() != null && !inv.getDescription().isBlank()
                            ? inv.getDescription()
                            : ("Conta a Pagar nº " + (inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : inv.getId().toString().substring(0, 8)));
                    String valFormatted = inv.getAmount() != null ? String.format("R$ %,.2f", inv.getAmount()) : "Valor N/I";
                    String sub = "Valor: " + valFormatted + (inv.getCategory() != null ? " • " + inv.getCategory() : "");

                    out.add(SystemAlertItemDTO.builder()
                            .id(dedup)
                            .module("FINANCEIRO")
                            .entityType("FINANCIAL")
                            .category("FINANCIAL_PAYABLE")
                            .categoryLabel("Contas a Pagar • " + (daysRem < 0 ? "VENCIDO" : "A Vencer"))
                            .priority(priority)
                            .priorityRank(priorityRank(priority))
                            .subjectTitle(title)
                            .subjectSubtitle(sub)
                            .dueDate(inv.getDueDate())
                            .daysRemaining(daysRem)
                            .statusText(formatDueDateText(inv.getDueDate(), daysRem))
                            .routeTo("/financeiro/contas-a-pagar")
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao coletar alertas de contas a pagar: {}", e.getMessage());
        }

        // 2. Contas a Receber (AccountsReceivable) pendentes vencidas ou vencendo em até 30 dias
        try {
            LocalDate maxDate = today.plusDays(ALERT_WINDOW_DAYS);
            List<AccountsReceivable> receivableList = accountsReceivableRepository.findByDueDateBetween(today.minusDays(180), maxDate);
            for (AccountsReceivable ar : receivableList) {
                if (companyId != null && ar.getCompanyId() != null && !companyId.equals(ar.getCompanyId())) {
                    continue;
                }
                if (ar.getStatus() == ReceivableStatus.PAID || ar.getStatus() == ReceivableStatus.CANCELLED) {
                    continue;
                }
                if (ar.getDueDate() == null) continue;

                long daysRem = ChronoUnit.DAYS.between(today, ar.getDueDate());
                String priority = classifyByDays(daysRem);
                String dedup = "FIN-RECEIVABLE-" + ar.getId();
                if (dedupKeys.add(dedup)) {
                    String clientName = ar.getClient() != null ? ar.getClient().getName() : "Cliente N/I";
                    String title = "Conta a Receber: " + clientName;
                    String valFormatted = ar.getAmount() != null ? String.format("R$ %,.2f", ar.getAmount()) : "Valor N/I";
                    String docInfo = ar.getInvoiceNumber() != null ? ("Fatura nº " + ar.getInvoiceNumber()) : ("Título " + ar.getId().toString().substring(0, 8));
                    String sub = docInfo + " • " + valFormatted;

                    out.add(SystemAlertItemDTO.builder()
                            .id(dedup)
                            .module("FINANCEIRO")
                            .entityType("FINANCIAL")
                            .category("FINANCIAL_RECEIVABLE")
                            .categoryLabel("Contas a Receber • " + (daysRem < 0 ? "VENCIDO" : "A Receber"))
                            .priority(priority)
                            .priorityRank(priorityRank(priority))
                            .subjectTitle(title)
                            .subjectSubtitle(sub)
                            .dueDate(ar.getDueDate())
                            .daysRemaining(daysRem)
                            .statusText(formatDueDateText(ar.getDueDate(), daysRem))
                            .routeTo("/financeiro/contas-a-receber")
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao coletar alertas de contas a receber: {}", e.getMessage());
        }
    }

    private void collectRhAlerts(
            UUID companyId,
            LocalDate today,
            ScopeContext scope,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {

        List<Employee> employees = employeeRepository.findWithDocumentExpirationsByCompany(companyId);
        for (Employee e : employees) {
            if (scope.driverOnlySelf && !matchesEmployeeSelf(e, scope)) continue;

            // 1. Limite concessivo de férias (para funcionários com mais de 12 meses de admissão)
            if (e.getHireDate() != null) {
                long monthsSinceAdmission = ChronoUnit.MONTHS.between(e.getHireDate(), today);
                if (monthsSinceAdmission >= 12) {
                    long cycleYears = monthsSinceAdmission / 12;
                    LocalDate limitDate = e.getHireDate().plusYears(cycleYears).plusMonths(11);
                    long daysRem = ChronoUnit.DAYS.between(today, limitDate);
                    if (daysRem <= 60) {
                        String priority = classifyByDays(daysRem);
                        String dedup = "RH-VACATION-LIMIT-" + e.getId() + "-" + limitDate.getYear();
                        if (dedupKeys.add(dedup)) {
                            out.add(SystemAlertItemDTO.builder()
                                    .id(dedup)
                                    .module("RH")
                                    .entityType("EMPLOYEE")
                                    .category("RH_VACATION")
                                    .categoryLabel("Férias • Limite Concessivo (Vencimento em Dobro)")
                                    .priority(priority)
                                    .priorityRank(priorityRank(priority))
                                    .subjectTitle("Funcionário: " + e.getName())
                                    .subjectSubtitle("Admissão: " + e.getHireDate().format(BR_DATE) + " — Limite concessivo: " + limitDate.format(BR_DATE))
                                    .dueDate(limitDate)
                                    .daysRemaining(daysRem)
                                    .statusText(formatDueDateText(limitDate, daysRem))
                                    .routeTo("/rh/ferias")
                                    .build());
                        }
                    }
                }
            }

            // 2. Fim do período de experiência / contrato de experiência
            if (e.getProbationEndDate() != null) {
                long daysRem = ChronoUnit.DAYS.between(today, e.getProbationEndDate());
                if (daysRem <= 30) {
                    String priority = classifyByDays(daysRem);
                    String dedup = "RH-PROBATION-" + e.getId();
                    if (dedupKeys.add(dedup)) {
                        out.add(SystemAlertItemDTO.builder()
                                .id(dedup)
                                .module("RH")
                                .entityType("EMPLOYEE")
                                .category("RH_PROBATION")
                                .categoryLabel("RH • Término de Contrato de Experiência")
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle("Funcionário: " + e.getName())
                                .subjectSubtitle("Término do período de experiência em " + e.getProbationEndDate().format(BR_DATE))
                                .dueDate(e.getProbationEndDate())
                                .daysRemaining(daysRem)
                                .statusText(formatDueDateText(e.getProbationEndDate(), daysRem))
                                .routeTo("/rh/funcionarios")
                                .build());
                    }
                }
            }

            // 3. Exames Médicos / Laudo Psicológico
            if (e.getNextLaudoPsicologico() != null) {
                long daysRem = ChronoUnit.DAYS.between(today, e.getNextLaudoPsicologico());
                if (daysRem <= ALERT_WINDOW_DAYS) {
                    String priority = classifyByDays(daysRem);
                    String dedup = "RH-PSICO-" + e.getId() + "-" + e.getNextLaudoPsicologico();
                    if (dedupKeys.add(dedup)) {
                        out.add(SystemAlertItemDTO.builder()
                                .id(dedup)
                                .module("RH")
                                .entityType("EMPLOYEE")
                                .category("RH_EXAM")
                                .categoryLabel("RH / SST • Validade de Laudo Psicológico")
                                .priority(priority)
                                .priorityRank(priorityRank(priority))
                                .subjectTitle("Funcionário: " + e.getName())
                                .subjectSubtitle("Laudo Psicológico Periódico")
                                .dueDate(e.getNextLaudoPsicologico())
                                .daysRemaining(daysRem)
                                .statusText(formatDueDateText(e.getNextLaudoPsicologico(), daysRem))
                                .routeTo("/sst")
                                .build());
                    }
                }
            }
        }
    }

    // ==================== ROLE SCOPE & HELPERS ====================

    private ScopeContext resolveScope(User user) {
        ScopeContext ctx = new ScopeContext();
        if (user == null) {
            return ctx;
        }
        ctx.userId = user.getId();
        ctx.userName = user.getName();

        Set<String> roleNames = new HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(r -> {
                if (r.getName() != null) roleNames.add(r.getName().toUpperCase());
            });
        }

        boolean isAdminOrBoard = roleNames.stream().anyMatch(rn ->
                rn.contains("ADMIN") || rn.contains("DIRETOR") || rn.equals("GESTOR"));
        boolean isMaintenance = roleNames.stream().anyMatch(rn ->
                rn.contains("MANUTENCAO") || rn.contains("MECANICO"));
        boolean isTrafficOrOps = roleNames.stream().anyMatch(rn ->
                rn.contains("TRAFEGO") || rn.contains("TRANSPORTE") || rn.contains("OPERAC") || rn.equals("SUPERVISOR"));
        boolean isRhOrSst = roleNames.stream().anyMatch(rn ->
                rn.equals("RH") || rn.contains("RH") || rn.contains("DEPARTAMENTO_PESSOAL") || rn.contains("SST") || rn.contains("SEGURANCA"));
        boolean isFinancial = roleNames.stream().anyMatch(rn ->
                rn.contains("FINANC") || rn.contains("CONTAB") || rn.contains("FISCAL") || rn.contains("FATUR"));
        boolean isDriver = roleNames.stream().anyMatch(rn -> rn.contains("MOTORISTA"));

        if (isAdminOrBoard) {
            ctx.includeVehicles = true;
            ctx.includeDrivers = true;
            ctx.includeCompany = true;
            ctx.includeFinancial = true;
            ctx.includeRh = true;
            return ctx;
        }

        if (isMaintenance) ctx.includeVehicles = true;
        if (isTrafficOrOps) {
            ctx.includeVehicles = true;
            ctx.includeDrivers = true;
        }
        if (isRhOrSst) {
            ctx.includeRh = true;
            ctx.includeDrivers = true;
            ctx.includeCompany = true;
        }
        if (isFinancial) {
            ctx.includeFinancial = true;
            ctx.includeCompany = true;
        }

        if (isDriver && !ctx.includeVehicles && !ctx.includeDrivers && !ctx.includeCompany) {
            ctx.includeVehicles = true;
            ctx.includeDrivers = true;
            ctx.driverOnlySelf = true;
            ctx.selfEmployee = employeeRepository.findByUserIdGlobal(user.getId()).orElse(null);
            ctx.selfDriver = driverRepository.findByUserIdGlobal(user.getId()).orElse(null);
            if (ctx.selfEmployee != null) {
                try {
                    List<Schedule> schedules = scheduleRepository.findByEmployeeIdsOrNameWithRelations(
                            List.of(ctx.selfEmployee.getId()),
                            ctx.selfEmployee.getName() != null ? ctx.selfEmployee.getName() : "");
                    for (Schedule s : schedules) {
                        if (s.getVehicle() != null && s.getVehicle().getId() != null) {
                            ctx.driverVehicleIds.add(s.getVehicle().getId());
                        }
                    }
                } catch (Exception ignored) { }
            }
        }

        if (!ctx.includeVehicles && !ctx.includeDrivers && !ctx.includeCompany) {
            // Perfis administrativos/financeiros/comerciais recebem alertas de Empresa por padrão
            ctx.includeCompany = true;
        }

        return ctx;
    }

    private List<Vehicle> filterVehiclesForDriver(List<Vehicle> vehicles, ScopeContext scope) {
        String normUser = normalizeName(scope.userName);
        String normEmp = scope.selfEmployee != null ? normalizeName(scope.selfEmployee.getName()) : "";
        UUID empId = scope.selfEmployee != null ? scope.selfEmployee.getId() : null;

        return vehicles.stream().filter(v -> {
            if (scope.driverVehicleIds.contains(v.getId())) return true;
            if (empId != null && empId.equals(v.getResponsibleEmployeeId())) return true;
            String assigned = normalizeName(v.getAssignedDriver());
            return !assigned.isEmpty() && (assigned.equals(normUser) || (!normEmp.isEmpty() && assigned.equals(normEmp)));
        }).toList();
    }

    private boolean matchesDriverSelf(Driver d, ScopeContext scope) {
        if (d.getUser() != null && Objects.equals(d.getUser().getId(), scope.userId)) return true;
        if (scope.selfDriver != null && Objects.equals(d.getId(), scope.selfDriver.getId())) return true;
        return !normalizeName(scope.userName).isEmpty() && normalizeName(d.getName()).equals(normalizeName(scope.userName));
    }

    private boolean matchesEmployeeSelf(Employee e, ScopeContext scope) {
        if (scope.selfEmployee != null && Objects.equals(e.getId(), scope.selfEmployee.getId())) return true;
        if (e.getUser() != null && Objects.equals(e.getUser().getId(), scope.userId)) return true;
        return !normalizeName(scope.userName).isEmpty() && normalizeName(e.getName()).equals(normalizeName(scope.userName));
    }

    private void addVehicleFieldExpiryAlert(
            Vehicle v,
            LocalDate expiryDate,
            String docName,
            LocalDate today,
            ScopeContext scope,
            List<SystemAlertItemDTO> out,
            Set<String> dedupKeys) {
        if (expiryDate == null) return;
        long daysRem = ChronoUnit.DAYS.between(today, expiryDate);
        if (daysRem > ALERT_WINDOW_DAYS) return;

        String priority = classifyByDays(daysRem);
        String dedup = "VEH-" + v.getId() + "-FIELD-" + docName + "-" + expiryDate;
        if (dedupKeys.add(dedup)) {
            out.add(SystemAlertItemDTO.builder()
                    .id(dedup)
                    .entityType("VEHICLE")
                    .category("VEHICLE_DOCUMENT")
                    .categoryLabel("Vencimento de Documentos do Veículo • " + docName)
                    .priority(priority)
                    .priorityRank(priorityRank(priority))
                    .subjectTitle(formatVehicleTitle(v))
                    .subjectSubtitle((v.getBrand() != null ? v.getBrand() + " " : "") + (v.getModel() != null ? v.getModel() : ""))
                    .dueDate(expiryDate)
                    .daysRemaining(daysRem)
                    .statusText(formatDueDateText(expiryDate, daysRem))
                    .routeTo(scope.driverOnlySelf ? "/driver/checklist" : "/frota")
                    .build());
        }
    }

    private boolean isOilRelatedText(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("oleo") || lower.contains("óleo") || lower.contains("lubrific");
    }

    private String classifyByDays(long days) {
        if (days <= 3) return "CRITICAL";
        if (days <= 10) return "HIGH";
        if (days <= 20) return "MEDIUM";
        return "LOW";
    }

    private String classifyByKm(int km) {
        if (km <= 500) return "CRITICAL";
        if (km <= 2000) return "HIGH";
        if (km <= 5000) return "MEDIUM";
        return "LOW";
    }

    private String worsePriority(String p1, String p2) {
        if (p1 == null) return p2 != null ? p2 : "LOW";
        if (p2 == null) return p1;
        return priorityRank(p1) <= priorityRank(p2) ? p1 : p2;
    }

    private int priorityRank(String p) {
        return switch (p) {
            case "CRITICAL" -> 1;
            case "HIGH" -> 2;
            case "MEDIUM" -> 3;
            default -> 4;
        };
    }

    private String formatDueDateText(LocalDate date, long daysRem) {
        String dStr = date.format(BR_DATE);
        if (daysRem < 0) return "Vencido há " + Math.abs(daysRem) + " dia(s) (" + dStr + ")";
        if (daysRem == 0) return "Vence hoje (" + dStr + ")";
        if (daysRem == 1) return "Vence em: 1 dia (" + dStr + ")";
        return "Vence em: " + daysRem + " dias (" + dStr + ")";
    }

    private String buildDateOrKmText(LocalDate date, Long daysRem, Integer kmRem) {
        if (date != null && daysRem != null) {
            String base = formatDueDateText(date, daysRem);
            return kmRem != null ? base + " • " + kmRem + " km" : base;
        }
        if (kmRem != null) {
            return kmRem <= 0 ? "KM vencido (excedeu em " + Math.abs(kmRem) + " km)" : "Restam " + kmRem + " km";
        }
        return "Verificar manutenção";
    }

    private String formatVehicleTitle(Vehicle v) {
        String prefix = v.getFleetNumber() != null && !v.getFleetNumber().isBlank() ? " • Frota " + v.getFleetNumber() : "";
        return "Veículo: " + v.getPlate() + prefix;
    }

    private String normalizeName(String s) {
        return s != null ? s.trim().toUpperCase() : "";
    }

    private int resolveCycleMaxKm(int recapCount, String lineType, TireLifecycleConfig cfg) {
        int baseMax = recapCount == 0 ? cfg.getFirstLifeMaxKm() : (recapCount == 1 ? cfg.getSecondLifeMaxKm() : cfg.getThirdLifeMaxKm());
        BigDecimal factor = cfg.getUrbanCalibrationFactor();
        if ("RODOVIARIA".equalsIgnoreCase(lineType)) factor = cfg.getRoadCalibrationFactor();
        else if ("METROPOLITANA".equalsIgnoreCase(lineType)) factor = cfg.getMetropolitanCalibrationFactor();
        return BigDecimal.valueOf(baseMax).multiply(factor != null ? factor : BigDecimal.ONE).intValue();
    }

    private boolean isDotExpired(String dot, Integer maxYears) {
        if (dot == null) return false;
        String digits = dot.replaceAll("\\D", "");
        if (digits.length() != 4) return false;
        int week = Integer.parseInt(digits.substring(0, 2));
        int year = 2000 + Integer.parseInt(digits.substring(2, 4));
        if (week < 1 || week > 53) return false;
        LocalDate now = LocalDate.now();
        int currWeek = now.get(WeekFields.ISO.weekOfWeekBasedYear());
        double age = (now.getYear() - year) + (currWeek - week) / 52.0;
        return age >= (maxYears != null ? maxYears : 5);
    }

    private static final class ScopeContext {
        UUID userId;
        String userName;
        boolean includeVehicles;
        boolean includeDrivers;
        boolean includeCompany;
        boolean includeFinancial;
        boolean includeRh;
        boolean driverOnlySelf;
        Employee selfEmployee;
        Driver selfDriver;
        Set<UUID> driverVehicleIds = new HashSet<>();
    }
}

