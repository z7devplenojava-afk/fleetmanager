package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.dto.WorkedHoursReportDTO;
import com.z7design.fleet_manager.dto.DailyWorkedHoursDTO;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeRecordService {

    @PersistenceContext
    private EntityManager entityManager;

    private final TimeRecordRepository timeRecordRepository;
    private final QRCodeWorkPostRepository qrCodeWorkPostRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final CompanyRepository companyRepository;
    private final WorkJourneyConfigService workJourneyConfigService;

    @Transactional
    public TimeRecord registerTimeRecord(UUID employeeId, TimeRecord.RecordType recordType,
            String qrCode, String location, Double latitude,
            Double longitude, String ipAddress, String userAgent) {

        log.info("📝 Registrando ponto - Employee: {}, Tipo: {}, QRCode: {}",
                employeeId, recordType, qrCode);

        // Buscar funcionário
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        // Validar QR Code se fornecido
        WorkPost workPost = null;
        if (qrCode != null && !qrCode.isEmpty()) {
            QRCodeWorkPost qrCodeWorkPost = qrCodeWorkPostRepository
                    .findValidQRCode(qrCode, LocalDateTime.now())
                    .orElseThrow(() -> new RuntimeException("QR Code inválido ou expirado"));

            workPost = qrCodeWorkPost.getWorkPost();
            log.info("✅ QR Code válido para posto: {}", workPost.getName());

            // Validar geolocalização se configurado
            if (qrCodeWorkPost.getLatitude() != null && qrCodeWorkPost.getLongitude() != null) {
                if (latitude == null || longitude == null) {
                    throw new RuntimeException("Geolocalização obrigatória para este posto");
                }

                double distance = calculateDistance(
                        qrCodeWorkPost.getLatitude(), qrCodeWorkPost.getLongitude(),
                        latitude, longitude);

                if (distance > qrCodeWorkPost.getRadiusMeters()) {
                    log.warn("⚠️ Distância excedida: {} metros (limite: {})",
                            distance, qrCodeWorkPost.getRadiusMeters());
                    throw new RuntimeException("Você está fora da área permitida para registro");
                }
            }
        }

        // Validar sequência de registros
        validateRecordSequence(employeeId, recordType);

        // Criar registro
        TimeRecord record = new TimeRecord();
        record.setEmployee(employee);
        record.setWorkPost(workPost);
        record.setRecordType(recordType);
        record.setRecordedAt(LocalDateTime.now());
        record.setLocation(location);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setIpAddress(ipAddress);
        record.setUserAgent(userAgent);
        record.setQrCodeUsed(qrCode);
        record.setIsManual(false);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);

        // Multi-tenant: set company_id from TenantContext (extracted from JWT)
        UUID tenantCompanyId = TenantContext.get();
        if (tenantCompanyId != null) {
            record.setCompanyId(tenantCompanyId);
        } else if (employee.getCompanyId() != null) {
            record.setCompanyId(employee.getCompanyId());
        } else {
            log.warn("⚠️ TenantContext está vazio e employee não tem companyId - registro sem empresa");
        }

        TimeRecord saved = timeRecordRepository.save(record);
        log.info("✅ Ponto registrado com sucesso - ID: {}", saved.getId());

        return saved;
    }

    private void validateRecordSequence(UUID employeeId, TimeRecord.RecordType newRecordType) {
        List<TimeRecord> todayRecords = timeRecordRepository.findTodayRecordsByEmployeeId(employeeId);

        if (todayRecords.isEmpty() && newRecordType != TimeRecord.RecordType.ENTRADA) {
            throw new RuntimeException("Primeiro registro do dia deve ser ENTRADA");
        }

        if (!todayRecords.isEmpty()) {
            TimeRecord lastRecord = todayRecords.get(0);

            // Validar sequência lógica
            switch (lastRecord.getRecordType()) {
                case ENTRADA:
                    if (newRecordType == TimeRecord.RecordType.ENTRADA) {
                        throw new RuntimeException("Já existe uma entrada registrada");
                    }
                    break;
                case SAIDA_ALMOCO:
                    if (newRecordType != TimeRecord.RecordType.RETORNO_ALMOCO) {
                        throw new RuntimeException("Após saída para almoço, deve registrar retorno");
                    }
                    break;
                case RETORNO_ALMOCO:
                    if (newRecordType == TimeRecord.RecordType.RETORNO_ALMOCO) {
                        throw new RuntimeException("Retorno do almoço já registrado");
                    }
                    break;
                case SAIDA:
                    throw new RuntimeException("Jornada já foi encerrada hoje");
            }
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Raio da Terra em metros
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<TimeRecord> getTodayRecords(UUID employeeId) {
        return timeRecordRepository.findTodayRecordsByEmployeeId(employeeId);
    }

    public List<TimeRecord> getRecordsByPeriod(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return timeRecordRepository.findByEmployeeIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                employeeId, start, end);
    }

    public Page<TimeRecord> getRecordsByEmployee(UUID employeeId, Pageable pageable) {
        return timeRecordRepository.findByEmployeeIdOrderByRecordedAtDesc(employeeId, pageable);
    }

    public Page<TimeRecord> getPendingRecords(Pageable pageable) {
        return timeRecordRepository.findByStatusOrderByRecordedAtDesc(
                TimeRecord.RecordStatus.PENDING, pageable);
    }

    @Transactional
    public TimeRecord approveRecord(UUID recordId, UUID approverId) {
        TimeRecord record = timeRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setApprovedById(approverId);
        record.setApprovedAt(LocalDateTime.now());

        return timeRecordRepository.save(record);
    }

    @Transactional
    public TimeRecord rejectRecord(UUID recordId, UUID approverId, String reason) {
        TimeRecord record = timeRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        record.setStatus(TimeRecord.RecordStatus.REJECTED);
        record.setApprovedById(approverId);
        record.setApprovedAt(LocalDateTime.now());
        record.setJustification(reason);

        return timeRecordRepository.save(record);
    }

    public WorkedHoursReportDTO getWorkedHoursReport(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        List<TimeRecord> records = getRecordsByPeriod(employeeId, startDate, endDate);

        java.util.Map<LocalDate, DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder> dailyMap = new java.util.HashMap<>();

        // Fill dates
        startDate.datesUntil(endDate.plusDays(1)).forEach(date -> {
            dailyMap.put(date, DailyWorkedHoursDTO.builder().date(date).status("ABSENCE"));
        });

        for (TimeRecord record : records) {
            LocalDate date = record.getRecordedAt().toLocalDate();
            DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder builder = dailyMap.get(date);
            if (builder == null)
                continue;

            String time = record.getRecordedAt().toLocalTime().toString();
            switch (record.getRecordType()) {
                case ENTRADA -> builder.entry(time).status("NORMAL");
                case SAIDA_ALMOCO -> builder.exitLunch(time);
                case RETORNO_ALMOCO -> builder.returnLunch(time);
                case SAIDA -> builder.exit(time);
            }
        }

        List<DailyWorkedHoursDTO> dailyList = dailyMap.values().stream()
                .map(DailyWorkedHoursDTO.DailyWorkedHoursDTOBuilder::build)
                .sorted(java.util.Comparator.comparing(DailyWorkedHoursDTO::getDate))
                .toList();

        return WorkedHoursReportDTO.builder()
                .employeeName(employee.getName())
                .period(startDate + " a " + endDate)
                .days(dailyList)
                .totalHours("Calculado no frontend") // Simplification for now
                .build();
    }

    public TimeRecord.RecordType getNextRecordType(UUID employeeId) {
        List<TimeRecord> todayRecords = timeRecordRepository.findTodayRecordsByEmployeeId(employeeId);

        if (todayRecords.isEmpty()) {
            return TimeRecord.RecordType.ENTRADA;
        }

        // Get the most recent record (first in the list since it's ordered desc)
        TimeRecord lastRecord = todayRecords.get(0);

        switch (lastRecord.getRecordType()) {
            case ENTRADA:
                return TimeRecord.RecordType.SAIDA_ALMOCO;
            case SAIDA_ALMOCO:
                return TimeRecord.RecordType.RETORNO_ALMOCO;
            case RETORNO_ALMOCO:
                return TimeRecord.RecordType.SAIDA;
            case SAIDA:
                return TimeRecord.RecordType.ENTRADA; // Jornada encerrada, nova jornada amanhã
            default:
                return TimeRecord.RecordType.ENTRADA;
        }
    }

    @Transactional
    public TimeRecord registerPunch(UUID employeeId, TimeRecord.RecordType punchType,
            Double latitude, Double longitude, String photoBase64) {
        return registerTimeRecord(employeeId, punchType, null, "Portal do Colaborador", latitude, longitude, null, null);
    }

    /**
     * Get detailed indicators for dashboards (overtime, lateness, absenteeism).
     */
    public Map<String, Object> getIndicators(LocalDate startDate, LocalDate endDate, String department) {
        Map<String, Object> indicators = new java.util.HashMap<>();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        // All records in period (filtered by tenant via @Filter)
        List<TimeRecord> allRecords = department != null && !department.isEmpty()
                ? timeRecordRepository.findByEmployeeDepartmentAndPeriod(department, start, end)
                : timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(start, end);

        // Group records by employee and date
        Map<UUID, Map<LocalDate, List<TimeRecord>>> grouped = new java.util.HashMap<>();
        for (TimeRecord rec : allRecords) {
            UUID empId = rec.getEmployee().getId();
            LocalDate date = rec.getRecordedAt().toLocalDate();
            grouped.computeIfAbsent(empId, k -> new java.util.HashMap<>())
                   .computeIfAbsent(date, k -> new java.util.ArrayList<>())
                   .add(rec);
        }

        long totalEmployees = employeeRepository.count();
        long employeesWithRecords = allRecords.stream()
                .map(r -> r.getEmployee().getId()).distinct().count();

        // Calculate indicators
        double totalOvertimeHours = 0;
        int latenessCount = 0;
        Set<String> employeesWithOvertime = new java.util.HashSet<>();
        Set<String> employeesWithLateness = new java.util.HashSet<>();
        Set<String> employeesPresent = new java.util.HashSet<>();

        // Per-day records tracking for overtime breakdown
        Map<LocalDate, Double> overtimeByDay = new java.util.TreeMap<>();
        Map<LocalDate, Integer> latenessByDay = new java.util.TreeMap<>();
        Map<String, Map<String, Object>> overtimeByDepartment = new java.util.TreeMap<>();
        Map<String, Map<String, Object>> latenessByDepartment = new java.util.TreeMap<>();

        // Load work journey config for the current tenant company
        UUID tenantCompanyId = TenantContext.get();
        double standardHoursPerDay = 8.0;
        int latenessToleranceMin = 10;
        int startHour = 8;
        if (tenantCompanyId != null) {
            try {
                var cfg = workJourneyConfigService.findActiveByCompanyId(tenantCompanyId);
                if (cfg != null) {
                    standardHoursPerDay = cfg.getCargaHorariaDiaria().doubleValue();
                    latenessToleranceMin = cfg.getToleranciaAtrasoMin();
                    log.debug("Usando config de jornada da empresa {}: {}h/dia, {}min tolerância",
                            tenantCompanyId, standardHoursPerDay, latenessToleranceMin);
                }
            } catch (Exception e) {
                log.warn("Erro ao carregar config de jornada, usando padrões: {}", e.getMessage());
            }
        }

        for (Map.Entry<UUID, Map<LocalDate, List<TimeRecord>>> empEntry : grouped.entrySet()) {
            String empName = "";
            String empDept = "";

            for (Map.Entry<LocalDate, List<TimeRecord>> dateEntry : empEntry.getValue().entrySet()) {
                List<TimeRecord> dayRecords = dateEntry.getValue();
                LocalDate date = dateEntry.getKey();

                // Get employee info from first record
                TimeRecord first = dayRecords.get(0);
                empName = first.getEmployee().getName();
                empDept = first.getEmployee().getDepartment() != null ? first.getEmployee().getDepartment().getName() : "Sem departamento";
                employeesPresent.add(empName);

                // Find ENTRADA and SAIDA records
                TimeRecord entrada = null;
                TimeRecord saida = null;
                TimeRecord saidaAlmoco = null;
                TimeRecord retornoAlmoco = null;

                for (TimeRecord r : dayRecords) {
                    switch (r.getRecordType()) {
                        case ENTRADA -> entrada = r;
                        case SAIDA -> saida = r;
                        case SAIDA_ALMOCO -> saidaAlmoco = r;
                        case RETORNO_ALMOCO -> retornoAlmoco = r;
                    }
                }

                // Calculate overtime: configurable per company
                if (entrada != null && saida != null) {
                    long workedMs = java.time.Duration.between(entrada.getRecordedAt(), saida.getRecordedAt()).toMillis();

                    // Subtract lunch time if present
                    if (saidaAlmoco != null && retornoAlmoco != null) {
                        long lunchMs = java.time.Duration.between(saidaAlmoco.getRecordedAt(), retornoAlmoco.getRecordedAt()).toMillis();
                        workedMs -= lunchMs;
                    }

                    double workedHours = workedMs / (1000.0 * 60 * 60);
                    double overtime = Math.max(0, workedHours - standardHoursPerDay);
                    if (overtime > 0) {
                        totalOvertimeHours += overtime;
                        employeesWithOvertime.add(empName);
                        overtimeByDay.merge(date, overtime, Double::sum);
                    }
                }

                // Calculate lateness: configurable per company
                if (entrada != null) {
                    int hour = entrada.getRecordedAt().getHour();
                    int minute = entrada.getRecordedAt().getMinute();
                    // Use configured start hour and tolerance
                    if (hour > startHour || (hour == startHour && minute > latenessToleranceMin)) {
                        latenessCount++;
                        employeesWithLateness.add(empName);
                        latenessByDay.merge(date, 1, Integer::sum);
                    }
                }
            }

            // Department breakdown
            overtimeByDepartment.putIfAbsent(empDept,
                    new java.util.HashMap<>(Map.of("hours", 0.0, "employees", new java.util.HashSet<String>())));
            latenessByDepartment.putIfAbsent(empDept,
                    new java.util.HashMap<>(Map.of("count", 0, "employees", new java.util.HashSet<String>())));
        }

        // Calculate absenteeism rate (employees without ANY record in period / total)
        double absenteeismRate = totalEmployees > 0
                ? ((double) Math.max(0, totalEmployees - employeesWithRecords) / totalEmployees) * 100
                : 0;

        // Format overtime by day for chart
        List<Map<String, Object>> overtimeChartData = new java.util.ArrayList<>();
        for (Map.Entry<LocalDate, Double> entry : overtimeByDay.entrySet()) {
            overtimeChartData.add(Map.of(
                    "date", entry.getKey().toString(),
                    "horas", Math.round(entry.getValue() * 100.0) / 100.0
            ));
        }

        // Format lateness by day for chart
        List<Map<String, Object>> latenessChartData = new java.util.ArrayList<>();
        for (Map.Entry<LocalDate, Integer> entry : latenessByDay.entrySet()) {
            latenessChartData.add(Map.of(
                    "date", entry.getKey().toString(),
                    "ocorrencias", entry.getValue()
            ));
        }

        // Format department breakdown for charts
        List<Map<String, Object>> deptOvertimeData = new java.util.ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> entry : overtimeByDepartment.entrySet()) {
            deptOvertimeData.add(Map.of(
                    "departamento", entry.getKey(),
                    "horas", Math.round(((Double) entry.getValue().getOrDefault("hours", 0.0)) * 100.0) / 100.0
            ));
        }

        List<Map<String, Object>> deptLatenessData = new java.util.ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> entry : latenessByDepartment.entrySet()) {
            deptLatenessData.add(Map.of(
                    "departamento", entry.getKey(),
                    "ocorrencias", entry.getValue().getOrDefault("count", 0)
            ));
        }

        indicators.put("totalOvertimeHours", Math.round(totalOvertimeHours * 100.0) / 100.0);
        indicators.put("latenessCount", latenessCount);
        indicators.put("absenteeismRate", Math.round(absenteeismRate * 100.0) / 100.0);
        indicators.put("totalEmployees", totalEmployees);
        indicators.put("employeesWithRecords", employeesWithRecords);
        indicators.put("employeesWithOvertime", employeesWithOvertime.size());
        indicators.put("employeesWithLateness", employeesWithLateness.size());
        indicators.put("periodStart", startDate.toString());
        indicators.put("periodEnd", endDate.toString());
        indicators.put("overtimeByDay", overtimeChartData);
        indicators.put("latenessByDay", latenessChartData);
        indicators.put("overtimeByDepartment", deptOvertimeData);
        indicators.put("latenessByDepartment", deptLatenessData);

        return indicators;
    }

    /**
     * Get consolidated indicators across ALL companies (SUPER_ADMIN only).
     * Temporarily disables tenant filter to query all data.
     */
    public Map<String, Object> getConsolidatedIndicators(LocalDate startDate, LocalDate endDate) {
        // Temporarily disable tenant filter to query ALL companies
        Session session = entityManager.unwrap(Session.class);
        boolean wasEnabled = session.getEnabledFilter("tenantFilter") != null;
        if (wasEnabled) {
            session.disableFilter("tenantFilter");
            log.info("🔓 TenantFilter desabilitado para consulta consolidada (SUPER_ADMIN)");
        }

        try {
            Map<String, Object> result = new java.util.HashMap<>();

            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = endDate.atTime(LocalTime.MAX);

            List<TimeRecord> allRecords = timeRecordRepository
                    .findByRecordedAtBetweenOrderByRecordedAtDesc(start, end);

            // Group records by company
            Map<UUID, List<TimeRecord>> byCompany = allRecords.stream()
                    .collect(Collectors.groupingBy(
                            r -> r.getCompanyId() != null ? r.getCompanyId() : UUID.randomUUID()));

            // Get company info
            List<Company> companies = companyRepository.findAll();
            Map<UUID, String> companyNames = companies.stream()
                    .collect(Collectors.toMap(Company::getId, Company::getName));

            // Calculate totals
            long totalRecords = allRecords.size();
            long pendingRecords = allRecords.stream().filter(r -> r.getStatus() == TimeRecord.RecordStatus.PENDING).count();
            long approvedRecords = allRecords.stream().filter(r -> r.getStatus() == TimeRecord.RecordStatus.APPROVED).count();
            long rejectedRecords = allRecords.stream().filter(r -> r.getStatus() == TimeRecord.RecordStatus.REJECTED).count();
            long distinctEmployees = allRecords.stream().map(r -> r.getEmployee().getId()).distinct().count();

            // Load configs for ALL companies
            Map<UUID, Map<String, Object>> companyConfigs = new java.util.HashMap<>();
            for (Company company : companies) {
                try {
                    var cfg = workJourneyConfigService.findActiveByCompanyId(company.getId());
                    if (cfg != null) {
                        companyConfigs.put(company.getId(), Map.of(
                                "cargaHorariaDiaria", cfg.getCargaHorariaDiaria().doubleValue(),
                                "toleranciaAtrasoMin", cfg.getToleranciaAtrasoMin()
                        ));
                    }
                } catch (Exception e) {
                    log.warn("Erro ao carregar config da empresa {}: {}", company.getId(), e.getMessage());
                }
            }

            // Per-company breakdown
            List<Map<String, Object>> companyBreakdown = new java.util.ArrayList<>();
            Map<String, Integer> overtimeByCompany = new java.util.TreeMap<>();
            Map<String, Integer> latenessByCompany = new java.util.TreeMap<>();

            for (Map.Entry<UUID, List<TimeRecord>> entry : byCompany.entrySet()) {
                UUID companyId = entry.getKey();
                String companyName = companyNames.getOrDefault(companyId, "Desconhecida");
                List<TimeRecord> companyRecords = entry.getValue();

                // Get per-company config or use defaults
                Map<String, Object> companyCfg = companyConfigs.getOrDefault(companyId, Map.of(
                        "cargaHorariaDiaria", 8.0,
                        "toleranciaAtrasoMin", 10
                ));
                double cfgCargaHoraria = ((Number) companyCfg.getOrDefault("cargaHorariaDiaria", 8.0)).doubleValue();
                int cfgTolerancia = ((Number) companyCfg.getOrDefault("toleranciaAtrasoMin", 10)).intValue();

                long compTotal = companyRecords.size();
                long compPending = companyRecords.stream().filter(r -> r.getStatus() == TimeRecord.RecordStatus.PENDING).count();
                long compEmployees = companyRecords.stream().map(r -> r.getEmployee().getId()).distinct().count();
                long compOvertime = 0;
                long compLateness = 0;

                // Calculate overtime and lateness per employee per day
                Map<UUID, Map<LocalDate, List<TimeRecord>>> grouped = companyRecords.stream()
                        .collect(Collectors.groupingBy(r -> r.getEmployee().getId(),
                                Collectors.groupingBy(r -> r.getRecordedAt().toLocalDate())));

                for (Map.Entry<UUID, Map<LocalDate, List<TimeRecord>>> empEntry : grouped.entrySet()) {
                    for (Map.Entry<LocalDate, List<TimeRecord>> dateEntry : empEntry.getValue().entrySet()) {
                        List<TimeRecord> dayRecords = dateEntry.getValue();
                        TimeRecord entrada = null, saida = null, saidaAlmoco = null, retornoAlmoco = null;

                        for (TimeRecord r : dayRecords) {
                            switch (r.getRecordType()) {
                                case ENTRADA -> entrada = r;
                                case SAIDA -> saida = r;
                                case SAIDA_ALMOCO -> saidaAlmoco = r;
                                case RETORNO_ALMOCO -> retornoAlmoco = r;
                            }
                        }

                        if (entrada != null && saida != null) {
                            long workedMs = java.time.Duration.between(entrada.getRecordedAt(), saida.getRecordedAt()).toMillis();
                            if (saidaAlmoco != null && retornoAlmoco != null) {
                                long lunchMs = java.time.Duration.between(saidaAlmoco.getRecordedAt(), retornoAlmoco.getRecordedAt()).toMillis();
                                workedMs -= lunchMs;
                            }
                            double workedHours = workedMs / (1000.0 * 60 * 60);
                            if (workedHours > cfgCargaHoraria) compOvertime++;
                        }

                        if (entrada != null) {
                            int hour = entrada.getRecordedAt().getHour();
                            int minute = entrada.getRecordedAt().getMinute();
                            if (hour > 8 || (hour == 8 && minute > cfgTolerancia)) compLateness++;
                        }
                    }
                }

                companyBreakdown.add(Map.of(
                        "companyId", entry.getKey().toString(),
                        "companyName", companyName,
                        "totalRecords", compTotal,
                        "pendingRecords", compPending,
                        "employees", compEmployees,
                        "overtime", compOvertime,
                        "lateness", compLateness
                ));

                overtimeByCompany.put(companyName, (int) compOvertime);
                latenessByCompany.put(companyName, (int) compLateness);
            }

            // Format for charts
            List<Map<String, Object>> overtimeChartData = overtimeByCompany.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> m = new java.util.HashMap<>();
                        m.put("empresa", e.getKey());
                        m.put("horas", e.getValue());
                        return m;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> latenessChartData = latenessByCompany.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> m = new java.util.HashMap<>();
                        m.put("empresa", e.getKey());
                        m.put("ocorrencias", e.getValue());
                        return m;
                    })
                    .collect(Collectors.toList());

            result.put("totalRecords", totalRecords);
            result.put("totalPending", pendingRecords);
            result.put("totalApproved", approvedRecords);
            result.put("totalRejected", rejectedRecords);
            result.put("totalEmployees", distinctEmployees);
            result.put("totalCompanies", byCompany.size());
            result.put("periodStart", startDate.toString());
            result.put("periodEnd", endDate.toString());
            result.put("companyBreakdown", companyBreakdown);
            result.put("overtimeByCompany", overtimeChartData);
            result.put("latenessByCompany", latenessChartData);

            return result;
        } finally {
            // Restore tenant filter
            if (wasEnabled) {
                session.enableFilter("tenantFilter");
                log.info("🔒 TenantFilter reabilitado após consulta consolidada");
            }
        }
    }

    private long countBusinessDays(LocalDate start, LocalDate end) {
        long count = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            if (current.getDayOfWeek().getValue() <= 5) { // Monday-Friday
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }

    /**
     * Get dashboard statistics for the current tenant (company).
     */
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new java.util.HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        long totalToday = timeRecordRepository.countByRecordedAtBetween(startOfDay, endOfDay);
        long pendingRecords = timeRecordRepository.countByStatus(TimeRecord.RecordStatus.PENDING);
        long approvedToday = timeRecordRepository.countByStatusAndRecordedAtBetween(
                TimeRecord.RecordStatus.APPROVED, startOfDay, endOfDay);
        long employeesWithRecords = timeRecordRepository.countDistinctEmployeeIdsByRecordedAtBetween(startOfDay, endOfDay);
        long employeesWithoutRecords = employeeRepository.count() - employeesWithRecords;

        stats.put("totalRegistrosHoje", totalToday);
        stats.put("registrosPendentes", pendingRecords);
        stats.put("aprovadosHoje", approvedToday);
        stats.put("funcionariosComRegistro", employeesWithRecords);
        stats.put("funcionariosSemRegistro", Math.max(0, employeesWithoutRecords));
        stats.put("data", today.toString());

        return stats;
    }

    /**
     * Get all time records for admin view with optional filters.
     */
    public List<TimeRecord> getAdminRecords(
            UUID employeeId, LocalDate startDate, LocalDate endDate,
            TimeRecord.RecordStatus status, String department) {

        if (employeeId != null && startDate != null && endDate != null) {
            return getRecordsByPeriod(employeeId, startDate, endDate);
        }

        if (status != null) {
            return timeRecordRepository.findListByStatus(status);
        }

        // Default: last 7 days
        if (startDate == null) startDate = LocalDate.now().minusDays(7);
        if (endDate == null) endDate = LocalDate.now();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        if (department != null && !department.isEmpty()) {
            return timeRecordRepository.findByEmployeeDepartmentAndPeriod(department, start, end);
        }

        return timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(start, end);
    }

    /**
     * Approve multiple records at once (batch approval).
     */
    @Transactional
    public List<TimeRecord> batchApproveRecords(List<UUID> recordIds, UUID approverId) {
        List<TimeRecord> records = timeRecordRepository.findAllById(recordIds);
        LocalDateTime now = LocalDateTime.now();

        for (TimeRecord record : records) {
            record.setStatus(TimeRecord.RecordStatus.APPROVED);
            record.setApprovedById(approverId);
            record.setApprovedAt(now);
        }

        return timeRecordRepository.saveAll(records);
    }

    /**
     * Reject multiple records at once (batch rejection).
     */
    @Transactional
    public List<TimeRecord> batchRejectRecords(List<UUID> recordIds, UUID approverId, String reason) {
        List<TimeRecord> records = timeRecordRepository.findAllById(recordIds);
        LocalDateTime now = LocalDateTime.now();

        for (TimeRecord record : records) {
            record.setStatus(TimeRecord.RecordStatus.REJECTED);
            record.setApprovedById(approverId);
            record.setApprovedAt(now);
            record.setJustification(reason);
        }

        return timeRecordRepository.saveAll(records);
    }

    /**
     * Submit a justification for an existing time record.
     */
    @Transactional
    public TimeRecord submitJustification(UUID recordId, String justification, UUID employeeId) {
        TimeRecord record = timeRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Registro não encontrado"));

        // Security: verify the employee owns this record
        if (!record.getEmployee().getId().equals(employeeId)) {
            throw new RuntimeException("Você não pode justificar registros de outro funcionário");
        }

        record.setJustification(justification);
        record.setStatus(TimeRecord.RecordStatus.PENDING);
        record.setProcessingNotes("Aguardando aprovação - justificativa enviada em " + LocalDateTime.now());

        return timeRecordRepository.save(record);
    }

    public com.z7design.fleet_manager.dto.TimeBalanceDTO calculateBalance(UUID employeeId) {
        UUID resolvedId = resolveEmployeeId(employeeId);
        YearMonth currentMonth = YearMonth.now();
        LocalDate startDate = currentMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();

        List<TimeRecord> records = getRecordsByPeriod(resolvedId, startDate, endDate);

        long totalWorkedMinutes = 0;
        int lateArrivals = 0;
        int earlyDepartures = 0;

        for (TimeRecord record : records) {
            if (record.getRecordType() == TimeRecord.RecordType.SAIDA && record.getRecordedAt() != null) {
                // Simple calculation: count minutes for ENTRADA to SAIDA pairs
            }
        }

        long entries = records.stream().filter(r -> r.getRecordType() == TimeRecord.RecordType.ENTRADA).count();
        long exits = records.stream().filter(r -> r.getRecordType() == TimeRecord.RecordType.SAIDA).count();

        com.z7design.fleet_manager.dto.TimeBalanceDTO balance = new com.z7design.fleet_manager.dto.TimeBalanceDTO();
        balance.setTotalWorked(java.time.Duration.ofMinutes(totalWorkedMinutes));
        balance.setTotalExpected(java.time.Duration.ofHours(8).multipliedBy(currentMonth.lengthOfMonth()));
        balance.setBalance(java.time.Duration.ofMinutes(totalWorkedMinutes - 8 * 22 * 60));
        balance.setOvertimeHours(0);
        balance.setAbsentDays(Math.max(0, currentMonth.lengthOfMonth() - (int) entries));
        balance.setLateArrivals(lateArrivals);
        balance.setEarlyDepartures(earlyDepartures);
        balance.setCurrentMonth(currentMonth.getMonth().toString() + " " + currentMonth.getYear());
        balance.setOvertimeValue(0.0);
        balance.setTotalOvertimeValue(0.0);

        return balance;
    }
}
