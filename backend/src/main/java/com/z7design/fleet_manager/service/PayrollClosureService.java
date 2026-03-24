package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.ContractPayrollConfig;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.PayPeriod;
import com.z7design.fleet_manager.model.PayrollClosure;
import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PayrollClosureRepository;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollClosureService {

    private final PayrollClosureRepository payrollClosureRepository;
    private final EmployeeRepository employeeRepository;
    private final TimeRecordService timeRecordService;
    private final ContractPayrollConfigService contractPayrollConfigService;
    private final PayPeriodService payPeriodService;
    private final BankHoursService bankHoursService;
    private final PayrollItemService payrollItemService;

    /**
     * Gera fechamento para um perÃ­odo mensal (compatibilidade com cÃ³digo existente)
     */
    @Transactional
    public PayrollClosure generateClosure(UUID employeeId, int month, int year, UUID closedById) {
        // Buscar ou criar perÃ­odo mensal
        PayPeriod period = payPeriodService.getOrCreateMonthlyPeriod(year, month);
        return generateClosureForPeriod(employeeId, period.getId(), closedById);
    }

    /**
     * Gera fechamento para um perÃ­odo especÃ­fico (mensal, quinzenal, customizado)
     */
    @Transactional
    public PayrollClosure generateClosureForPeriod(UUID employeeId, UUID payPeriodId, UUID closedById) {
        log.info("ðŸ“Š Gerando fechamento - Employee: {}, PayPeriod: {}", employeeId, payPeriodId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado"));

        PayPeriod payPeriod = payPeriodService.findById(payPeriodId);

        // Verificar se jÃ¡ existe fechamento para este perÃ­odo
        payrollClosureRepository.findByEmployeeIdAndPayPeriodId(employeeId, payPeriodId)
                .ifPresent(existing -> {
                    throw new RuntimeException("JÃ¡ existe fechamento para este perÃ­odo");
                });

        // Usar datas do perÃ­odo
        LocalDate startDate = payPeriod.getStartDate();
        LocalDate endDate = payPeriod.getEndDate();
        int month = payPeriod.getReferenceMonth() != null ? payPeriod.getReferenceMonth() : startDate.getMonthValue();
        int year = payPeriod.getReferenceYear() != null ? payPeriod.getReferenceYear() : startDate.getYear();

        // Buscar registros do perÃ­odo
        List<TimeRecord> records = timeRecordService.getRecordsByPeriod(employeeId, startDate, endDate);

        // Buscar configuraÃ§Ã£o de folha para o funcionÃ¡rio
        ContractPayrollConfig config = contractPayrollConfigService.getConfigForEmployee(employeeId);

        // Calcular mÃ©tricas usando configuraÃ§Ãµes
        Map<String, Object> metrics = calculateMetrics(records, startDate, endDate, config);

        // Criar fechamento
        PayrollClosure closure = new PayrollClosure();
        closure.setEmployee(employee);
        closure.setPayPeriod(payPeriod);
        closure.setReferenceMonth(month);
        closure.setReferenceYear(year);
        closure.setStartDate(startDate);
        closure.setEndDate(endDate);
        
        closure.setTotalHoursWorked((BigDecimal) metrics.get("totalHours"));
        closure.setRegularHours((BigDecimal) metrics.get("regularHours"));
        closure.setOvertime50((BigDecimal) metrics.get("overtime50"));
        closure.setOvertime100((BigDecimal) metrics.get("overtime100"));
        closure.setNightShiftHours((BigDecimal) metrics.get("nightShiftHours"));
        closure.setTotalDelaysMinutes((Integer) metrics.get("totalDelays"));
        closure.setTotalAbsencesDays((Integer) metrics.get("totalAbsences"));
        closure.setWorkedDays((Integer) metrics.get("workedDays"));
        closure.setExpectedDays((Integer) metrics.get("expectedDays"));
        
        closure.setStatus(PayrollClosure.ClosureStatus.DRAFT);
        closure.setClosedById(closedById);

        PayrollClosure saved = payrollClosureRepository.save(closure);
        log.info("âœ… Fechamento gerado - ID: {}", saved.getId());

        // Processar banco de horas se habilitado (apÃ³s salvar o fechamento)
        // Por enquanto, contractId serÃ¡ null (serÃ¡ melhorado quando houver relaÃ§Ã£o Employee-Contract)
        try {
            UUID contractId = null; // TODO: Buscar contrato do funcionÃ¡rio quando houver relaÃ§Ã£o
            bankHoursService.processOvertimeForBankHours(employeeId, contractId, saved);
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao processar banco de horas (nÃ£o crÃ­tico): {}", e.getMessage());
            // NÃ£o falha o fechamento se houver erro no banco de horas
        }

        // Gerar itens de folha (PayrollItems) a partir do fechamento
        try {
            // Calcular valor por hora: salÃ¡rio / divisor de horas
            BigDecimal hourlyRate = calculateHourlyRate(employee, config);
            payrollItemService.generateItemsFromClosure(saved.getId(), hourlyRate);
            log.info("âœ… Itens de folha gerados para fechamento {}", saved.getId());
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao gerar itens de folha (nÃ£o crÃ­tico): {}", e.getMessage());
            // NÃ£o falha o fechamento se houver erro na geraÃ§Ã£o de itens
        }

        return saved;
    }

    private Map<String, Object> calculateMetrics(List<TimeRecord> records, LocalDate startDate, LocalDate endDate, ContractPayrollConfig config) {
        Map<String, Object> metrics = new HashMap<>();

        // Agrupar registros por dia
        Map<LocalDate, List<TimeRecord>> recordsByDay = new HashMap<>();
        for (TimeRecord record : records) {
            LocalDate date = record.getRecordedAt().toLocalDate();
            recordsByDay.computeIfAbsent(date, k -> new ArrayList<>()).add(record);
        }

        BigDecimal totalHours = BigDecimal.ZERO;
        BigDecimal regularHours = BigDecimal.ZERO;
        BigDecimal overtime50 = BigDecimal.ZERO;
        BigDecimal overtime100 = BigDecimal.ZERO;
        BigDecimal nightShiftHours = BigDecimal.ZERO;
        int totalDelays = 0;
        int workedDays = recordsByDay.size();

        // Processar cada dia
        for (Map.Entry<LocalDate, List<TimeRecord>> entry : recordsByDay.entrySet()) {
            List<TimeRecord> dayRecords = entry.getValue();
            dayRecords.sort((a, b) -> a.getRecordedAt().compareTo(b.getRecordedAt()));

            LocalDateTime entrada = null;
            LocalDateTime saidaAlmoco = null;
            LocalDateTime retornoAlmoco = null;
            LocalDateTime saida = null;

            for (TimeRecord record : dayRecords) {
                switch (record.getRecordType()) {
                    case ENTRADA:
                        entrada = record.getRecordedAt();
                        break;
                    case SAIDA_ALMOCO:
                        saidaAlmoco = record.getRecordedAt();
                        break;
                    case RETORNO_ALMOCO:
                        retornoAlmoco = record.getRecordedAt();
                        break;
                    case SAIDA:
                        saida = record.getRecordedAt();
                        break;
                }
            }

            if (entrada != null && saida != null) {
                // Calcular horas trabalhadas
                long totalMinutes = Duration.between(entrada, saida).toMinutes();
                
                // Subtrair tempo de almoÃ§o
                if (saidaAlmoco != null && retornoAlmoco != null) {
                    long lunchMinutes = Duration.between(saidaAlmoco, retornoAlmoco).toMinutes();
                    totalMinutes -= lunchMinutes;
                }

                BigDecimal hoursWorked = BigDecimal.valueOf(totalMinutes)
                        .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
                
                totalHours = totalHours.add(hoursWorked);

                // Calcular horas regulares e extras usando configuraÃ§Ã£o
                BigDecimal regularDailyHours = config.getDailyHours();
                if (hoursWorked.compareTo(regularDailyHours) <= 0) {
                    regularHours = regularHours.add(hoursWorked);
                } else {
                    regularHours = regularHours.add(regularDailyHours);
                    BigDecimal extraHours = hoursWorked.subtract(regularDailyHours);
                    
                    // Primeiras 2h extras = 50%, restante = 100% (configurÃ¡vel)
                    BigDecimal firstTwoHours = extraHours.min(BigDecimal.valueOf(2));
                    overtime50 = overtime50.add(firstTwoHours);
                    
                    if (extraHours.compareTo(BigDecimal.valueOf(2)) > 0) {
                        BigDecimal remainingHours = extraHours.subtract(BigDecimal.valueOf(2));
                        overtime100 = overtime100.add(remainingHours);
                    }
                }

                // Calcular adicional noturno usando configuraÃ§Ã£o
                BigDecimal nightHours = calculateNightShiftHours(entrada, saida, config);
                nightShiftHours = nightShiftHours.add(nightHours);

                // Calcular atrasos usando tolerÃ¢ncia configurÃ¡vel
                LocalTime expectedStart = config.getDefaultEntryTime();
                LocalTime actualStart = entrada.toLocalTime();
                int toleranceMinutes = config.getDelayToleranceMinutes();
                
                if (actualStart.isAfter(expectedStart.plusMinutes(toleranceMinutes))) {
                    long delayMinutes = Duration.between(expectedStart, actualStart).toMinutes();
                    totalDelays += delayMinutes;
                }
            }
        }

        // Calcular dias Ãºteis esperados no mÃªs
        int expectedDays = calculateWorkingDays(startDate, endDate);
        int totalAbsences = expectedDays - workedDays;

        metrics.put("totalHours", totalHours);
        metrics.put("regularHours", regularHours);
        metrics.put("overtime50", overtime50);
        metrics.put("overtime100", overtime100);
        metrics.put("nightShiftHours", nightShiftHours);
        metrics.put("totalDelays", totalDelays);
        metrics.put("totalAbsences", Math.max(0, totalAbsences));
        metrics.put("workedDays", workedDays);
        metrics.put("expectedDays", expectedDays);

        return metrics;
    }

    private BigDecimal calculateNightShiftHours(LocalDateTime start, LocalDateTime end, ContractPayrollConfig config) {
        // PerÃ­odo noturno configurÃ¡vel
        LocalTime nightStart = config.getNightShiftStart();
        LocalTime nightEnd = config.getNightShiftEnd();
        
        BigDecimal nightHours = BigDecimal.ZERO;
        LocalDateTime current = start;

        while (current.isBefore(end)) {
            LocalTime currentTime = current.toLocalTime();
            LocalDateTime nextHour = current.plusHours(1).withMinute(0).withSecond(0);
            if (nextHour.isAfter(end)) {
                nextHour = end;
            }

            // Verificar se estÃ¡ no perÃ­odo noturno (considera perÃ­odo que atravessa meia-noite)
            boolean isNightTime = false;
            if (nightStart.isAfter(nightEnd)) {
                // PerÃ­odo atravessa meia-noite (ex: 22h Ã s 5h)
                isNightTime = currentTime.isAfter(nightStart) || currentTime.isBefore(nightEnd);
            } else {
                // PerÃ­odo normal (ex: 20h Ã s 22h)
                isNightTime = currentTime.isAfter(nightStart) && currentTime.isBefore(nightEnd);
            }

            if (isNightTime) {
                long minutes = Duration.between(current, nextHour).toMinutes();
                nightHours = nightHours.add(BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
            }

            current = nextHour;
        }

        return nightHours;
    }

    private int calculateWorkingDays(LocalDate start, LocalDate end) {
        int workingDays = 0;
        LocalDate current = start;

        while (!current.isAfter(end)) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plusDays(1);
        }

        return workingDays;
    }

    /**
     * Calcula valor por hora baseado no salÃ¡rio e divisor de horas
     */
    private BigDecimal calculateHourlyRate(Employee employee, ContractPayrollConfig config) {
        // Buscar salÃ¡rio do funcionÃ¡rio (pode ser null)
        BigDecimal salary = employee.getSalario();
        if (salary == null || salary.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("SalÃ¡rio nÃ£o encontrado para funcionÃ¡rio {}, usando valor padrÃ£o 0", employee.getId());
            return BigDecimal.ZERO;
        }

        // Calcular valor por hora: salÃ¡rio / divisor de horas
        BigDecimal hourDivisor = config.getHourDivisor();
        if (hourDivisor == null || hourDivisor.compareTo(BigDecimal.ZERO) <= 0) {
            hourDivisor = BigDecimal.valueOf(220.0); // PadrÃ£o CLT
        }

        return salary.divide(hourDivisor, 4, RoundingMode.HALF_UP);
    }

    @Transactional
    public PayrollClosure closeClosure(UUID closureId, UUID closedById) {
        PayrollClosure closure = payrollClosureRepository.findById(closureId)
                .orElseThrow(() -> new RuntimeException("Fechamento nÃ£o encontrado"));

        if (closure.getStatus() != PayrollClosure.ClosureStatus.DRAFT) {
            throw new RuntimeException("Fechamento jÃ¡ foi finalizado");
        }

        closure.setStatus(PayrollClosure.ClosureStatus.CLOSED);
        closure.setClosedAt(LocalDateTime.now());
        closure.setClosedById(closedById);

        return payrollClosureRepository.save(closure);
    }

    public PayrollClosure getClosureById(UUID closureId) {
        return payrollClosureRepository.findById(closureId)
                .orElseThrow(() -> new RuntimeException("Fechamento nÃ£o encontrado: " + closureId));
    }

    public Page<PayrollClosure> getClosuresByEmployee(UUID employeeId, Pageable pageable) {
        return payrollClosureRepository.findByEmployeeIdOrderByReferenceYearDescReferenceMonthDesc(
                employeeId, pageable);
    }

    public List<PayrollClosure> getClosuresByPeriod(int month, int year) {
        return payrollClosureRepository.findByReferenceMonthAndReferenceYearOrderByEmployeeNameAsc(
                month, year);
    }

    @Transactional
    public List<PayrollClosure> generateBatchClosures(int month, int year, UUID closedById) {
        log.info("ðŸ“Š Gerando fechamentos em lote - PerÃ­odo: {}/{}", month, year);

        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(employee -> EmploymentStatus.ACTIVE.equals(employee.getStatus()))
                .collect(Collectors.toList());
        List<PayrollClosure> closures = new ArrayList<>();

        for (Employee employee : activeEmployees) {
            try {
                PayrollClosure closure = generateClosure(employee.getId(), month, year, closedById);
                closures.add(closure);
                log.info("âœ… Fechamento gerado para: {}", employee.getName());
            } catch (Exception e) {
                log.error("âŒ Erro ao gerar fechamento para {}: {}", employee.getName(), e.getMessage());
                // Continua processando os outros funcionÃ¡rios mesmo se um falhar
            }
        }

        log.info("âœ… Fechamentos em lote concluÃ­dos: {} de {}", closures.size(), activeEmployees.size());
        return closures;
    }
}


