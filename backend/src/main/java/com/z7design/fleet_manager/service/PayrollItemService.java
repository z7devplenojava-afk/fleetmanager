package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.PayrollItemRepository;
import com.z7design.fleet_manager.repository.PayrollClosureRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service para gerenciar itens de folha gerados a partir de fechamentos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollItemService {

    private final PayrollItemRepository payrollItemRepository;
    private final PayrollClosureRepository payrollClosureRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractPayrollConfigService contractPayrollConfigService;
    private final ObjectMapper objectMapper;
    private final PayrollRepository payrollRepository;

    /**
     * Gera itens de folha a partir de um PayrollClosure
     * Calcula valores baseados em horas e regras configuradas
     * Se hourlyRate for zero/null, calcula automaticamente
     */
    @Transactional
    public List<PayrollItem> generateItemsFromClosure(UUID payrollClosureId, BigDecimal hourlyRate) {
        log.info("ðŸ“‹ Gerando itens de folha para fechamento: {}", payrollClosureId);

        PayrollClosure closure = payrollClosureRepository.findById(payrollClosureId)
                .orElseThrow(() -> new RuntimeException("Fechamento nÃ£o encontrado: " + payrollClosureId));

        // Buscar configuraÃ§Ã£o
        ContractPayrollConfig config = contractPayrollConfigService.getConfigForEmployee(closure.getEmployee().getId());

        // Se hourlyRate nÃ£o fornecido ou zero, calcular a partir do salÃ¡rio
        if (hourlyRate == null || hourlyRate.compareTo(BigDecimal.ZERO) <= 0) {
            Employee employee = closure.getEmployee();
            BigDecimal salary = employee.getSalario();
            if (salary != null && salary.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal hourDivisor = config.getHourDivisor() != null ? 
                        config.getHourDivisor() : BigDecimal.valueOf(220.0);
                hourlyRate = salary.divide(hourDivisor, 4, RoundingMode.HALF_UP);
                log.info("ðŸ’° Valor por hora calculado: {} (salÃ¡rio: {}, divisor: {})", hourlyRate, salary, hourDivisor);
            } else {
                log.warn("âš ï¸ SalÃ¡rio nÃ£o encontrado, usando valor padrÃ£o 0 para cÃ¡lculos");
                hourlyRate = BigDecimal.ZERO;
            }
        }

        // Remover itens anteriores deste fechamento (para reprocessamento)
        payrollItemRepository.deleteByPayrollClosureId(payrollClosureId);

        List<PayrollItem> items = new ArrayList<>();

        // 1. Horas normais
        if (closure.getRegularHours() != null && closure.getRegularHours().compareTo(BigDecimal.ZERO) > 0) {
            PayrollItem regularItem = createItem(
                    closure, 
                    "Horas normais trabalhadas",
                    PayrollItem.ItemType.REGULAR_HOURS,
                    PayrollItem.ItemCategory.EARNINGS,
                    closure.getRegularHours(),
                    hourlyRate,
                    closure.getRegularHours().multiply(hourlyRate)
            );
            items.add(regularItem);
        }

        // 2. Horas extras 50%
        if (closure.getOvertime50() != null && closure.getOvertime50().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal overtime50Rate = hourlyRate.multiply(
                    BigDecimal.ONE.add(config.getOvertime50Percentage().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
            );
            PayrollItem overtime50Item = createItem(
                    closure,
                    "Horas extras 50%",
                    PayrollItem.ItemType.OVERTIME_50,
                    PayrollItem.ItemCategory.EARNINGS,
                    closure.getOvertime50(),
                    overtime50Rate,
                    closure.getOvertime50().multiply(overtime50Rate)
            );
            items.add(overtime50Item);
        }

        // 3. Horas extras 100%
        if (closure.getOvertime100() != null && closure.getOvertime100().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal overtime100Rate = hourlyRate.multiply(
                    BigDecimal.ONE.add(config.getOvertime100Percentage().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
            );
            PayrollItem overtime100Item = createItem(
                    closure,
                    "Horas extras 100%",
                    PayrollItem.ItemType.OVERTIME_100,
                    PayrollItem.ItemCategory.EARNINGS,
                    closure.getOvertime100(),
                    overtime100Rate,
                    closure.getOvertime100().multiply(overtime100Rate)
            );
            items.add(overtime100Item);
        }

        // 4. Adicional noturno
        if (closure.getNightShiftHours() != null && closure.getNightShiftHours().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal nightShiftRate = hourlyRate.multiply(
                    config.getNightShiftPercentage().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            );
            PayrollItem nightShiftItem = createItem(
                    closure,
                    "Adicional noturno",
                    PayrollItem.ItemType.NIGHT_SHIFT,
                    PayrollItem.ItemCategory.EARNINGS,
                    closure.getNightShiftHours(),
                    nightShiftRate,
                    closure.getNightShiftHours().multiply(nightShiftRate)
            );
            items.add(nightShiftItem);
        }

        // 5. Faltas (desconto)
        if (closure.getTotalAbsencesDays() != null && closure.getTotalAbsencesDays() > 0) {
            BigDecimal dailyRate = hourlyRate.multiply(config.getDailyHours());
            BigDecimal absenceAmount = dailyRate.multiply(BigDecimal.valueOf(closure.getTotalAbsencesDays()));
            PayrollItem absenceItem = createItem(
                    closure,
                    String.format("Faltas (%d dias)", closure.getTotalAbsencesDays()),
                    PayrollItem.ItemType.ABSENCE,
                    PayrollItem.ItemCategory.DEDUCTIONS,
                    BigDecimal.valueOf(closure.getTotalAbsencesDays()).multiply(config.getDailyHours()),
                    dailyRate,
                    absenceAmount.negate() // Desconto (valor negativo)
            );
            items.add(absenceItem);
        }

        // 6. Atrasos (desconto proporcional)
        if (closure.getTotalDelaysMinutes() != null && closure.getTotalDelaysMinutes() > 0) {
            BigDecimal delayHours = BigDecimal.valueOf(closure.getTotalDelaysMinutes())
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            BigDecimal delayAmount = delayHours.multiply(hourlyRate).negate(); // Desconto
            PayrollItem delayItem = createItem(
                    closure,
                    String.format("Atrasos (%d minutos)", closure.getTotalDelaysMinutes()),
                    PayrollItem.ItemType.DELAY,
                    PayrollItem.ItemCategory.DEDUCTIONS,
                    delayHours,
                    hourlyRate,
                    delayAmount
            );
            items.add(delayItem);
        }

        // Salvar todos os itens
        List<PayrollItem> saved = payrollItemRepository.saveAll(items);
        log.info("âœ… {} itens de folha gerados para fechamento {}", saved.size(), payrollClosureId);

        return saved;
    }

    /**
     * Busca ou cria um Payroll para o funcionÃ¡rio no perÃ­odo (necessÃ¡rio para payroll_id)
     */
    private Payroll getOrCreatePayroll(PayrollClosure closure) {
        String referenceMonth = String.format("%04d-%02d", closure.getReferenceYear(), closure.getReferenceMonth());
        
        // Buscar Payroll existente do funcionÃ¡rio para o perÃ­odo
        List<Payroll> existing = payrollRepository.findByEmployeeId(closure.getEmployee().getId());
        Payroll payroll = existing.stream()
                .filter(p -> referenceMonth.equals(p.getReferenceMonth()))
                .findFirst()
                .orElse(null);
        
        if (payroll == null) {
            // Criar um Payroll temporÃ¡rio (serÃ¡ preenchido quando a folha for gerada)
            log.warn("âš ï¸ Payroll nÃ£o encontrado para funcionÃ¡rio {} no perÃ­odo {}, criando temporÃ¡rio", 
                    closure.getEmployee().getId(), referenceMonth);
            payroll = new Payroll();
            payroll.setEmployee(closure.getEmployee());
            payroll.setUnit(closure.getEmployee().getUnit());
            payroll.setReferenceMonth(referenceMonth);
            payroll.setBaseSalary(closure.getEmployee().getSalario() != null ? 
                    closure.getEmployee().getSalario().doubleValue() : 0.0);
            payroll.setGrossSalary(0.0);
            payroll.setNetSalary(0.0);
            payroll.setOvertimeHours(0.0);
            payroll.setOvertimeValue(0.0);
            payroll.setBenefitsValue(0.0);
            payroll.setDeductionsValue(0.0);
            payroll.setDocumentUrl("");
            payroll = payrollRepository.save(payroll);
        }
        
        return payroll;
    }

    /**
     * Cria um item de folha
     */
    private PayrollItem createItem(
            PayrollClosure closure,
            String description,
            PayrollItem.ItemType type,
            PayrollItem.ItemCategory category,
            BigDecimal hours,
            BigDecimal unitValue,
            BigDecimal totalAmount) {
        
        // Buscar ou criar Payroll para este perÃ­odo (necessÃ¡rio devido Ã  constraint NOT NULL)
        Payroll payroll = getOrCreatePayroll(closure);
        
        PayrollItem item = new PayrollItem();
        item.setPayroll(payroll);
        item.setPayrollClosure(closure);
        item.setEmployee(closure.getEmployee());
        item.setDescription(description);
        item.setType(type);
        item.setCategory(category);
        item.setHours(hours);
        item.setUnitValue(unitValue);
        item.setAmount(totalAmount.setScale(2, RoundingMode.HALF_UP));

        // Adicionar metadados em JSON
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("referenceMonth", closure.getReferenceMonth());
            metadata.put("referenceYear", closure.getReferenceYear());
            metadata.put("periodStart", closure.getStartDate().toString());
            metadata.put("periodEnd", closure.getEndDate().toString());
            item.setReferenceData(objectMapper.writeValueAsString(metadata));
        } catch (JsonProcessingException e) {
            log.warn("Erro ao serializar metadados: {}", e.getMessage());
        }

        return item;
    }

    /**
     * Busca itens de um fechamento
     */
    public List<PayrollItem> getItemsByClosure(UUID payrollClosureId) {
        return payrollItemRepository.findByPayrollClosureId(payrollClosureId);
    }

    /**
     * Busca itens de um funcionÃ¡rio
     */
    public List<PayrollItem> getItemsByEmployee(UUID employeeId) {
        return payrollItemRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    /**
     * Calcula total de proventos de um fechamento
     */
    public BigDecimal calculateTotalEarnings(UUID payrollClosureId) {
        List<PayrollItem> items = payrollItemRepository.findByPayrollClosureIdAndCategory(
                payrollClosureId, PayrollItem.ItemCategory.EARNINGS);
        return items.stream()
                .map(PayrollItem::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula total de descontos de um fechamento
     */
    public BigDecimal calculateTotalDeductions(UUID payrollClosureId) {
        List<PayrollItem> items = payrollItemRepository.findByPayrollClosureIdAndCategory(
                payrollClosureId, PayrollItem.ItemCategory.DEDUCTIONS);
        return items.stream()
                .map(PayrollItem::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Marca itens como reemitidos (para reprocessamento)
     */
    @Transactional
    public void markItemsAsReissued(UUID payrollClosureId, UUID reissuedById) {
        List<PayrollItem> items = payrollItemRepository.findByPayrollClosureId(payrollClosureId);
        for (PayrollItem item : items) {
            item.setReissuedById(reissuedById);
            item.setReissuedAt(LocalDateTime.now());
        }
        payrollItemRepository.saveAll(items);
        log.info("âœ… {} itens marcados como reemitidos", items.size());
    }
}


