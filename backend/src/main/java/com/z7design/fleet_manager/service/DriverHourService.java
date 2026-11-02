package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.DriverMonthlyClosingDTO;
import com.z7design.fleet_manager.dto.DriverWorkHourDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverHourService {

    private final DriverWorkHourRepository driverWorkHourRepository;
    private final DriverHourCalculationMemoryRepository calculationMemoryRepository;
    private final TimeRecordRepository timeRecordRepository;
    private final ParteDiariaRepository parteDiariaRepository;
    private final EmployeeRepository employeeRepository;

    private static final LocalTime NIGHT_START = LocalTime.of(22, 0);
    private static final LocalTime NIGHT_END = LocalTime.of(5, 0);
    // CLT art. 73 § 1º: hora noturna é de 52 minutos e 30 segundos (52.5 minutos) -> fator 60 / 52.5 = 1.142857
    private static final double NIGHT_REDUCTION_FACTOR = 60.0 / 52.5;

    @Transactional(readOnly = true)
    public List<DriverWorkHourDTO> findByPeriod(LocalDate start, LocalDate end) {
        if (start == null) start = LocalDate.now().withDayOfMonth(1);
        if (end == null) end = LocalDate.now();

        return driverWorkHourRepository.findByReferenceDateBetweenOrderByReferenceDateDesc(start, end)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DriverWorkHourDTO getJornada(UUID id) {
        DriverWorkHour dwh = driverWorkHourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jornada não encontrada"));
        return toDTO(dwh);
    }

    @Transactional
    public DriverWorkHourDTO saveJornada(DriverWorkHourDTO dto) {
        if (dto.getEmployeeId() == null) {
            throw new IllegalArgumentException("Motorista/Funcionário é obrigatório");
        }

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        DriverWorkHour workHour;
        if (dto.getId() != null) {
            workHour = driverWorkHourRepository.findById(dto.getId())
                    .orElse(DriverWorkHour.builder().build());
        } else if (dto.getReferenceDate() != null) {
            workHour = driverWorkHourRepository.findByEmployeeIdAndReferenceDate(employee.getId(), dto.getReferenceDate())
                    .orElse(DriverWorkHour.builder().build());
        } else {
            workHour = DriverWorkHour.builder().build();
        }

        workHour.setEmployee(employee);
        workHour.setReferenceDate(dto.getReferenceDate() != null ? dto.getReferenceDate() : LocalDate.now());
        workHour.setStartTime(dto.getStartTime());
        workHour.setEndTime(dto.getEndTime());
        workHour.setWaitMinutes(dto.getWaitMinutes() != null ? dto.getWaitMinutes() : 0);
        workHour.setContractDailyMinutes(dto.getContractDailyMinutes() != null ? dto.getContractDailyMinutes() : 480);
        workHour.setNotes(dto.getNotes());
        workHour.setIsClosed(Boolean.TRUE.equals(dto.getIsClosed()));
        workHour.setSource(dto.getSource() != null ? dto.getSource() : "MANUAL");

        // 4 Pegadas
        workHour.setPegada1Start(dto.getPegada1Start());
        workHour.setPegada1End(dto.getPegada1End());
        workHour.setPegada2Start(dto.getPegada2Start());
        workHour.setPegada2End(dto.getPegada2End());
        workHour.setPegada3Start(dto.getPegada3Start());
        workHour.setPegada3End(dto.getPegada3End());
        workHour.setPegada4Start(dto.getPegada4Start());
        workHour.setPegada4End(dto.getPegada4End());

        UUID tenant = TenantContext.get();
        if (tenant != null) {
            workHour.setCompanyId(tenant);
        } else if (employee.getCompanyId() != null) {
            workHour.setCompanyId(employee.getCompanyId());
        }

        calculateHours(workHour);
        DriverWorkHour saved = driverWorkHourRepository.save(workHour);
        saveCalculationMemory(saved);
        return toDTO(saved);
    }

    @Transactional
    public List<DriverWorkHourDTO> syncJornadasFromRecords(LocalDate start, LocalDate end) {
        if (start == null) start = LocalDate.now().withDayOfMonth(1);
        if (end == null) end = LocalDate.now();

        log.info("Iniciando sincronização de jornadas de motoristas no período {} a {}", start, end);

        // Carrega funcionários para lookup ágil
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<UUID, Employee> empById = new HashMap<>();
        Map<String, Employee> empByCleanCpf = new HashMap<>();
        Map<String, Employee> empByName = new HashMap<>();

        for (Employee emp : allEmployees) {
            empById.put(emp.getId(), emp);
            if (emp.getDocument() != null) {
                String cleanCpf = emp.getDocument().replaceAll("[^0-9]", "");
                if (!cleanCpf.isEmpty()) empByCleanCpf.put(cleanCpf, emp);
            }
            if (emp.getName() != null) {
                empByName.put(emp.getName().trim().toLowerCase(), emp);
            }
        }

        // 1. Ponto Eletrônico
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atTime(LocalTime.MAX);
        List<TimeRecord> timeRecords = timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(startDt, endDt);

        Map<UUID, Map<LocalDate, List<TimeRecord>>> punchesByEmpDate = new HashMap<>();
        for (TimeRecord tr : timeRecords) {
            if (tr.getEmployee() == null || tr.getRecordedAt() == null) continue;
            UUID empId = tr.getEmployee().getId();
            LocalDate rDate = tr.getRecordedAt().toLocalDate();
            punchesByEmpDate
                    .computeIfAbsent(empId, k -> new HashMap<>())
                    .computeIfAbsent(rDate, k -> new ArrayList<>())
                    .add(tr);
        }

        // 2. Partes Diárias
        List<ParteDiaria> partes = parteDiariaRepository.findByDateBetween(start, end);
        Map<UUID, Map<LocalDate, List<ParteDiaria>>> partesByEmpDate = new HashMap<>();

        for (ParteDiaria pd : partes) {
            Employee emp = null;
            if (pd.getDriver() != null && pd.getDriver().getCpf() != null) {
                String clean = pd.getDriver().getCpf().replaceAll("[^0-9]", "");
                emp = empByCleanCpf.get(clean);
            }
            if (emp == null && pd.getDriverName() != null) {
                emp = empByName.get(pd.getDriverName().trim().toLowerCase());
            }
            if (emp != null && pd.getDate() != null) {
                partesByEmpDate
                        .computeIfAbsent(emp.getId(), k -> new HashMap<>())
                        .computeIfAbsent(pd.getDate(), k -> new ArrayList<>())
                        .add(pd);
            }
        }

        Set<String> processedKeys = new HashSet<>();
        List<DriverWorkHour> toSave = new ArrayList<>();

        // Processa batidas de ponto
        for (Map.Entry<UUID, Map<LocalDate, List<TimeRecord>>> empEntry : punchesByEmpDate.entrySet()) {
            UUID empId = empEntry.getKey();
            Employee emp = empById.get(empId);
            if (emp == null) continue;

            for (Map.Entry<LocalDate, List<TimeRecord>> dateEntry : empEntry.getValue().entrySet()) {
                LocalDate rDate = dateEntry.getKey();
                List<TimeRecord> punches = dateEntry.getValue();
                punches.sort(Comparator.comparing(TimeRecord::getRecordedAt));

                LocalDateTime startTime = punches.get(0).getRecordedAt();
                LocalDateTime endTime = punches.get(punches.size() - 1).getRecordedAt();

                // Monta as 4 pegadas sequencialmente a partir dos pares de batidas
                LocalDateTime p1Start = punches.size() > 0 ? punches.get(0).getRecordedAt() : null;
                LocalDateTime p1End = punches.size() > 1 ? punches.get(1).getRecordedAt() : null;
                LocalDateTime p2Start = punches.size() > 2 ? punches.get(2).getRecordedAt() : null;
                LocalDateTime p2End = punches.size() > 3 ? punches.get(3).getRecordedAt() : null;
                LocalDateTime p3Start = punches.size() > 4 ? punches.get(4).getRecordedAt() : null;
                LocalDateTime p3End = punches.size() > 5 ? punches.get(5).getRecordedAt() : null;
                LocalDateTime p4Start = punches.size() > 6 ? punches.get(6).getRecordedAt() : null;
                LocalDateTime p4End = punches.size() > 7 ? punches.get(7).getRecordedAt() : null;

                // Verifica se há parte diária no mesmo dia para cruzamento
                List<ParteDiaria> pds = partesByEmpDate.getOrDefault(empId, Collections.emptyMap()).get(rDate);
                String source = "PONTO";
                StringBuilder notes = new StringBuilder("Ponto Eletrônico (" + punches.size() + " batida(s)");

                if (pds != null && !pds.isEmpty()) {
                    source = "HIBRIDO";
                    String plates = pds.stream()
                            .map(ParteDiaria::getVehiclePlate)
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.joining(", "));
                    notes.append(" + Parte Diária: ").append(plates);
                }
                notes.append(")");

                DriverWorkHour workHour = driverWorkHourRepository.findByEmployeeIdAndReferenceDate(empId, rDate)
                        .orElse(DriverWorkHour.builder()
                                .employee(emp)
                                .referenceDate(rDate)
                                .build());

                workHour.setStartTime(startTime);
                workHour.setEndTime(endTime);
                workHour.setPegada1Start(p1Start);
                workHour.setPegada1End(p1End);
                workHour.setPegada2Start(p2Start);
                workHour.setPegada2End(p2End);
                workHour.setPegada3Start(p3Start);
                workHour.setPegada3End(p3End);
                workHour.setPegada4Start(p4Start);
                workHour.setPegada4End(p4End);

                workHour.setWaitMinutes(workHour.getWaitMinutes() != null ? workHour.getWaitMinutes() : 0);
                workHour.setContractDailyMinutes(workHour.getContractDailyMinutes() != null ? workHour.getContractDailyMinutes() : 480);
                workHour.setSource(source);
                workHour.setNotes(notes.toString());
                workHour.setCompanyId(TenantContext.get() != null ? TenantContext.get() : emp.getCompanyId());

                calculateHours(workHour);
                toSave.add(workHour);
                processedKeys.add(empId + "_" + rDate);
            }
        }

        // Processa partes diárias restantes (dias sem ponto)
        for (Map.Entry<UUID, Map<LocalDate, List<ParteDiaria>>> empEntry : partesByEmpDate.entrySet()) {
            UUID empId = empEntry.getKey();
            Employee emp = empById.get(empId);
            if (emp == null) continue;

            for (Map.Entry<LocalDate, List<ParteDiaria>> dateEntry : empEntry.getValue().entrySet()) {
                LocalDate rDate = dateEntry.getKey();
                String key = empId + "_" + rDate;
                if (processedKeys.contains(key)) continue;

                List<ParteDiaria> pds = dateEntry.getValue();
                // Ordena por horário de início da viagem
                pds.sort(Comparator.comparing(p -> parseTimeSafely(p.getStartTime(), LocalTime.of(7, 0))));

                LocalDateTime p1Start = null, p1End = null;
                LocalDateTime p2Start = null, p2End = null;
                LocalDateTime p3Start = null, p3End = null;
                LocalDateTime p4Start = null, p4End = null;

                for (int i = 0; i < pds.size(); i++) {
                    ParteDiaria p = pds.get(i);
                    LocalTime s = parseTimeSafely(p.getStartTime(), LocalTime.of(7, 0));
                    LocalTime e = parseTimeSafely(p.getEndTime(), LocalTime.of(17, 0));
                    LocalDateTime startDtLocal = rDate.atTime(s);
                    LocalDateTime endDtLocal = rDate.atTime(e);
                    if (endDtLocal.isBefore(startDtLocal)) {
                        endDtLocal = endDtLocal.plusDays(1);
                    }

                    if (i == 0) {
                        p1Start = startDtLocal;
                        p1End = endDtLocal;
                    } else if (i == 1) {
                        p2Start = startDtLocal;
                        p2End = endDtLocal;
                    } else if (i == 2) {
                        p3Start = startDtLocal;
                        p3End = endDtLocal;
                    } else if (i == 3) {
                        p4Start = startDtLocal;
                        p4End = endDtLocal;
                    }
                }

                LocalDateTime startTime = p1Start;
                LocalDateTime endTime = p4End != null ? p4End : (p3End != null ? p3End : (p2End != null ? p2End : p1End));

                String plates = pds.stream()
                        .map(ParteDiaria::getVehiclePlate)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.joining(", "));

                DriverWorkHour workHour = driverWorkHourRepository.findByEmployeeIdAndReferenceDate(empId, rDate)
                        .orElse(DriverWorkHour.builder()
                                .employee(emp)
                                .referenceDate(rDate)
                                .build());

                workHour.setStartTime(startTime);
                workHour.setEndTime(endTime);
                workHour.setPegada1Start(p1Start);
                workHour.setPegada1End(p1End);
                workHour.setPegada2Start(p2Start);
                workHour.setPegada2End(p2End);
                workHour.setPegada3Start(p3Start);
                workHour.setPegada3End(p3End);
                workHour.setPegada4Start(p4Start);
                workHour.setPegada4End(p4End);

                workHour.setWaitMinutes(workHour.getWaitMinutes() != null ? workHour.getWaitMinutes() : 0);
                workHour.setContractDailyMinutes(workHour.getContractDailyMinutes() != null ? workHour.getContractDailyMinutes() : 480);
                workHour.setSource("PARTE_DIARIA");
                workHour.setNotes("Integrado via Parte Diária (" + pds.size() + " viagem/viagens) - Veículo(s): " + plates);
                workHour.setCompanyId(TenantContext.get() != null ? TenantContext.get() : emp.getCompanyId());

                calculateHours(workHour);
                toSave.add(workHour);
                processedKeys.add(key);
            }
        }

        // Salva e grava memória de cálculo
        for (DriverWorkHour dwh : toSave) {
            DriverWorkHour saved = driverWorkHourRepository.save(dwh);
            saveCalculationMemory(saved);
        }

        log.info("Sincronização concluída! {} jornadas processadas/salvas.", toSave.size());
        return findByPeriod(start, end);
    }

    private LocalTime parseTimeSafely(String timeStr, LocalTime fallback) {
        if (timeStr == null || timeStr.trim().isEmpty()) return fallback;
        try {
            String clean = timeStr.trim();
            if (clean.length() == 5) {
                return LocalTime.parse(clean);
            } else if (clean.length() == 8) {
                return LocalTime.parse(clean);
            } else {
                String[] parts = clean.split(":");
                if (parts.length >= 2) {
                    int h = Integer.parseInt(parts[0].trim());
                    int m = Integer.parseInt(parts[1].trim());
                    return LocalTime.of(h, m);
                }
            }
        } catch (Exception e) {
            log.warn("Falha ao converter horário '{}': {}", timeStr, e.getMessage());
        }
        return fallback;
    }

    private void calculateHours(DriverWorkHour workHour) {
        // Se temos pegadas detalhadas, calculamos a soma dos trechos fechados
        long workedMinutes = 0;
        int nightMinutes = 0;

        boolean hasPegadas = false;

        // Pegada 1
        if (workHour.getPegada1Start() != null && workHour.getPegada1End() != null) {
            hasPegadas = true;
            workedMinutes += Math.max(0, Duration.between(workHour.getPegada1Start(), workHour.getPegada1End()).toMinutes());
            nightMinutes += calculateNightMinutes(workHour.getPegada1Start(), workHour.getPegada1End());
        }
        // Pegada 2
        if (workHour.getPegada2Start() != null && workHour.getPegada2End() != null) {
            hasPegadas = true;
            workedMinutes += Math.max(0, Duration.between(workHour.getPegada2Start(), workHour.getPegada2End()).toMinutes());
            nightMinutes += calculateNightMinutes(workHour.getPegada2Start(), workHour.getPegada2End());
        }
        // Pegada 3
        if (workHour.getPegada3Start() != null && workHour.getPegada3End() != null) {
            hasPegadas = true;
            workedMinutes += Math.max(0, Duration.between(workHour.getPegada3Start(), workHour.getPegada3End()).toMinutes());
            nightMinutes += calculateNightMinutes(workHour.getPegada3Start(), workHour.getPegada3End());
        }
        // Pegada 4
        if (workHour.getPegada4Start() != null && workHour.getPegada4End() != null) {
            hasPegadas = true;
            workedMinutes += Math.max(0, Duration.between(workHour.getPegada4Start(), workHour.getPegada4End()).toMinutes());
            nightMinutes += calculateNightMinutes(workHour.getPegada4Start(), workHour.getPegada4End());
        }

        // Se não possui pegadas separadas, usa startTime e endTime gerais
        if (!hasPegadas) {
            if (workHour.getStartTime() != null && workHour.getEndTime() != null) {
                workedMinutes = Math.max(0, Duration.between(workHour.getStartTime(), workHour.getEndTime()).toMinutes());
                nightMinutes = calculateNightMinutes(workHour.getStartTime(), workHour.getEndTime());
            }
        } else {
            // Garante que startTime e endTime reflitam os limites das pegadas
            if (workHour.getStartTime() == null && workHour.getPegada1Start() != null) {
                workHour.setStartTime(workHour.getPegada1Start());
            }
            LocalDateTime lastEnd = workHour.getPegada4End() != null ? workHour.getPegada4End()
                    : (workHour.getPegada3End() != null ? workHour.getPegada3End()
                    : (workHour.getPegada2End() != null ? workHour.getPegada2End()
                    : workHour.getPegada1End()));
            if (lastEnd != null) {
                workHour.setEndTime(lastEnd);
            }
        }

        int waitMins = workHour.getWaitMinutes() != null ? workHour.getWaitMinutes() : 0;
        int effectiveWorked = (int) Math.max(0, workedMinutes - waitMins);

        workHour.setTotalMinutes(effectiveWorked);
        workHour.setNightMinutes(nightMinutes);

        // Hora Noturna Reduzida CLT: (minutos noturnos * 60) / 52.5
        int nightReduced = (int) Math.round(nightMinutes * NIGHT_REDUCTION_FACTOR);
        workHour.setNightReducedMinutes(nightReduced);

        int normalDailyMinutes = workHour.getContractDailyMinutes() != null ? workHour.getContractDailyMinutes() : 480;
        workHour.setOvertimeMinutes(Math.max(0, effectiveWorked - normalDailyMinutes));
    }

    private int calculateNightMinutes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !start.isBefore(end)) return 0;

        int nightMinutes = 0;
        LocalDateTime current = start;

        while (current.isBefore(end)) {
            LocalTime time = current.toLocalTime();
            if (isNightTime(time)) {
                nightMinutes++;
            }
            current = current.plusMinutes(1);
        }

        return nightMinutes;
    }

    private boolean isNightTime(LocalTime time) {
        return time.isAfter(NIGHT_START.minusSeconds(1)) || time.isBefore(NIGHT_END.plusSeconds(1));
    }

    private void saveCalculationMemory(DriverWorkHour saved) {
        StringBuilder log = new StringBuilder();
        log.append("Memória de Cálculo - Lei 13.103/2015 & CLT Art. 73\n");
        log.append("ID da Jornada: ").append(saved.getId()).append("\n");
        log.append("Motorista: ").append(saved.getEmployee() != null ? saved.getEmployee().getName() : "-").append("\n");
        log.append("Data de Referência: ").append(saved.getReferenceDate()).append("\n");

        if (saved.getPegada1Start() != null) {
            log.append("1ª Pegada: ").append(saved.getPegada1Start().toLocalTime()).append(" às ").append(saved.getPegada1End() != null ? saved.getPegada1End().toLocalTime() : "--:--").append("\n");
        }
        if (saved.getPegada2Start() != null) {
            log.append("2ª Pegada: ").append(saved.getPegada2Start().toLocalTime()).append(" às ").append(saved.getPegada2End() != null ? saved.getPegada2End().toLocalTime() : "--:--").append("\n");
        }
        if (saved.getPegada3Start() != null) {
            log.append("3ª Pegada: ").append(saved.getPegada3Start().toLocalTime()).append(" às ").append(saved.getPegada3End() != null ? saved.getPegada3End().toLocalTime() : "--:--").append("\n");
        }
        if (saved.getPegada4Start() != null) {
            log.append("4ª Pegada: ").append(saved.getPegada4Start().toLocalTime()).append(" às ").append(saved.getPegada4End() != null ? saved.getPegada4End().toLocalTime() : "--:--").append("\n");
        }

        int totalM = saved.getTotalMinutes() != null ? saved.getTotalMinutes() : 0;
        int nightM = saved.getNightMinutes() != null ? saved.getNightMinutes() : 0;
        int nightRedM = saved.getNightReducedMinutes() != null ? saved.getNightReducedMinutes() : 0;
        int overM = saved.getOvertimeMinutes() != null ? saved.getOvertimeMinutes() : 0;

        log.append("Total Trabalhado: ").append(totalM / 60).append("h ").append(totalM % 60).append("m\n");
        log.append("Horas Noturnas Relógio (22h às 05h): ").append(nightM).append(" min (").append(nightM / 60).append("h ").append(nightM % 60).append("m)\n");
        log.append("Hora Noturna Reduzida CLT (52m30s): ").append(nightRedM).append(" min computados (").append(nightRedM / 60).append("h ").append(nightRedM % 60).append("m)\n");
        log.append("Horas Extras (> ").append(saved.getContractDailyMinutes() != null ? saved.getContractDailyMinutes() / 60 : 8).append("h diárias): ").append(overM).append(" min\n");
        log.append("Origem da Integração: ").append(saved.getSource()).append("\n");
        log.append("Observações: ").append(saved.getNotes() != null ? saved.getNotes() : "-").append("\n");

        DriverHourCalculationMemory memory = calculationMemoryRepository.findByDriverWorkHourId(saved.getId())
                .orElse(DriverHourCalculationMemory.builder().driverWorkHour(saved).build());
        memory.setCalculationLog(log.toString());
        memory.setAppliedRules("Lei 13.103/2015 (Motorista Profissional) + CLT Art. 73 (Hora Noturna Reduzida 52m30s e Adicional de 20%)");
        calculationMemoryRepository.save(memory);
    }

    @Transactional(readOnly = true)
    public DriverHourCalculationMemory getCalculationMemory(UUID workHourId) {
        return calculationMemoryRepository.findByDriverWorkHourId(workHourId)
                .orElse(DriverHourCalculationMemory.builder()
                        .calculationLog("Memória não encontrada para este registro.")
                        .appliedRules("-")
                        .build());
    }

    /**
     * Apuração e Fechamento Mensal por Motorista
     */
    @Transactional(readOnly = true)
    public List<DriverMonthlyClosingDTO> getMonthlyClosing(int year, int month, UUID employeeId) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<DriverWorkHour> hours;
        if (employeeId != null) {
            hours = driverWorkHourRepository.findByEmployeeIdAndReferenceDateBetween(employeeId, start, end);
        } else {
            hours = driverWorkHourRepository.findByReferenceDateBetweenOrderByReferenceDateDesc(start, end);
        }

        // Agrupa por Employee
        Map<UUID, List<DriverWorkHour>> byEmp = hours.stream()
                .filter(h -> h.getEmployee() != null)
                .collect(Collectors.groupingBy(h -> h.getEmployee().getId()));

        List<DriverMonthlyClosingDTO> result = new ArrayList<>();

        for (Map.Entry<UUID, List<DriverWorkHour>> entry : byEmp.entrySet()) {
            UUID empId = entry.getKey();
            List<DriverWorkHour> empHours = entry.getValue();
            empHours.sort(Comparator.comparing(DriverWorkHour::getReferenceDate));

            Employee emp = empHours.get(0).getEmployee();

            int totalWorked = empHours.stream().mapToInt(h -> h.getTotalMinutes() != null ? h.getTotalMinutes() : 0).sum();
            int totalOvertime = empHours.stream().mapToInt(h -> h.getOvertimeMinutes() != null ? h.getOvertimeMinutes() : 0).sum();
            int totalNight = empHours.stream().mapToInt(h -> h.getNightMinutes() != null ? h.getNightMinutes() : 0).sum();
            int totalNightReduced = empHours.stream().mapToInt(h -> h.getNightReducedMinutes() != null ? h.getNightReducedMinutes() : 0).sum();
            int totalWait = empHours.stream().mapToInt(h -> h.getWaitMinutes() != null ? h.getWaitMinutes() : 0).sum();
            int closedCount = (int) empHours.stream().filter(h -> Boolean.TRUE.equals(h.getIsClosed())).count();

            // Carga horária contratual mensal (padrão 220 horas = 13.200 minutos)
            int contractMonthlyMinutes = 220 * 60;
            int balance = totalWorked - contractMonthlyMinutes;

            result.add(DriverMonthlyClosingDTO.builder()
                    .employeeId(empId)
                    .employeeName(emp.getName())
                    .employeeDocument(emp.getDocument())
                    .registrationNumber(emp.getRegistrationNumber())
                    .positionName(emp.getPosition() != null ? emp.getPosition().getName() : "Motorista")
                    .year(year)
                    .month(month)
                    .contractMonthlyMinutes(contractMonthlyMinutes)
                    .totalWorkedMinutes(totalWorked)
                    .totalOvertimeMinutes(totalOvertime)
                    .totalNightMinutes(totalNight)
                    .totalNightReducedMinutes(totalNightReduced)
                    .totalWaitMinutes(totalWait)
                    .balanceMinutes(balance)
                    .daysWorked(empHours.size())
                    .daysClosed(closedCount)
                    .isMonthFullyClosed(closedCount == empHours.size() && !empHours.isEmpty())
                    .dailyRecords(empHours.stream().map(this::toDTO).collect(Collectors.toList()))
                    .build());
        }

        return result;
    }

    /**
     * Efetiva o Fechamento Mensal das Horas
     */
    @Transactional
    public void closeMonth(int year, int month, UUID employeeId) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<DriverWorkHour> hours;
        if (employeeId != null) {
            hours = driverWorkHourRepository.findByEmployeeIdAndReferenceDateBetween(employeeId, start, end);
        } else {
            hours = driverWorkHourRepository.findByReferenceDateBetween(start, end);
        }

        for (DriverWorkHour dwh : hours) {
            dwh.setIsClosed(true);
            driverWorkHourRepository.save(dwh);
        }

        log.info("Fechamento mensal concluído para {}/{} - {} jornadas fechadas.", month, year, hours.size());
    }

    public DriverWorkHourDTO toDTO(DriverWorkHour dwh) {
        if (dwh == null) return null;
        Employee emp = dwh.getEmployee();
        return DriverWorkHourDTO.builder()
                .id(dwh.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(emp != null ? emp.getName() : null)
                .employeeDocument(emp != null ? emp.getDocument() : null)
                .referenceDate(dwh.getReferenceDate())
                .startTime(dwh.getStartTime())
                .endTime(dwh.getEndTime())
                .totalMinutes(dwh.getTotalMinutes())
                .waitMinutes(dwh.getWaitMinutes())
                .nightMinutes(dwh.getNightMinutes())
                .nightReducedMinutes(dwh.getNightReducedMinutes())
                .overtimeMinutes(dwh.getOvertimeMinutes())
                .contractDailyMinutes(dwh.getContractDailyMinutes())
                .pegada1Start(dwh.getPegada1Start())
                .pegada1End(dwh.getPegada1End())
                .pegada2Start(dwh.getPegada2Start())
                .pegada2End(dwh.getPegada2End())
                .pegada3Start(dwh.getPegada3Start())
                .pegada3End(dwh.getPegada3End())
                .pegada4Start(dwh.getPegada4Start())
                .pegada4End(dwh.getPegada4End())
                .source(dwh.getSource())
                .companyId(dwh.getCompanyId())
                .notes(dwh.getNotes())
                .isClosed(dwh.getIsClosed())
                .createdAt(dwh.getCreatedAt())
                .updatedAt(dwh.getUpdatedAt())
                .build();
    }
}
