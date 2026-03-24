package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service para gerenciar banco de horas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BankHoursService {

    private final BankHoursRepository bankHoursRepository;
    private final BankHoursTransactionRepository transactionRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final ContractPayrollConfigService contractPayrollConfigService;

    /**
     * Busca ou cria saldo de banco de horas para um funcionÃ¡rio/contrato
     */
    @Transactional
    public BankHours getOrCreateBankHours(UUID employeeId, UUID contractId) {
        Optional<BankHours> existing = bankHoursRepository.findByEmployeeIdAndContractId(employeeId, contractId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado: " + employeeId));

        BankHours bankHours = new BankHours();
        bankHours.setEmployee(employee);
        if (contractId != null) {
            Contract contract = contractRepository.findById(contractId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contrato nÃ£o encontrado: " + contractId));
            bankHours.setContract(contract);
        }
        bankHours.setBalanceHours(BigDecimal.ZERO);

        BankHours saved = bankHoursRepository.save(bankHours);
        log.info("âœ… Saldo de banco de horas criado - Employee: {}, Contract: {}", employeeId, contractId);
        return saved;
    }

    /**
     * Adiciona horas extras ao banco de horas (CREDIT)
     */
    @Transactional
    public BankHoursTransaction creditHours(
            UUID employeeId,
            UUID contractId,
            BigDecimal hours,
            UUID sourcePayrollClosureId,
            String description,
            UUID createdById) {
        
        log.info("âž• Creditando {} horas no banco de horas - Employee: {}", hours, employeeId);

        BankHours bankHours = getOrCreateBankHours(employeeId, contractId);

        BankHoursTransaction transaction = new BankHoursTransaction();
        transaction.setBankHours(bankHours);
        transaction.setTransactionType(BankHoursTransaction.TransactionType.CREDIT);
        transaction.setHours(hours);
        transaction.setSourceType(BankHoursTransaction.SourceType.OVERTIME);
        if (sourcePayrollClosureId != null) {
            // NÃ£o carregar PayrollClosure para evitar lazy loading, apenas armazenar ID
            PayrollClosure payrollClosure = new PayrollClosure();
            payrollClosure.setId(sourcePayrollClosureId);
            transaction.setSourcePayrollClosure(payrollClosure);
        }
        transaction.setDescription(description != null ? description : "Horas extras acumuladas");
        transaction.setTransactionDate(LocalDate.now());
        transaction.setCreatedById(createdById);

        BankHoursTransaction saved = transactionRepository.save(transaction);
        
        // Atualizar saldo (serÃ¡ feito via trigger, mas garantimos aqui tambÃ©m)
        bankHours.setBalanceHours(bankHours.getBalanceHours().add(hours));
        bankHours.setLastUpdatedAt(LocalDateTime.now());
        bankHoursRepository.save(bankHours);

        log.info("âœ… {} horas creditadas - Saldo atual: {}", hours, bankHours.getBalanceHours());
        return saved;
    }

    /**
     * Usa horas do banco (DEBIT) - compensaÃ§Ã£o ou pagamento
     */
    @Transactional
    public BankHoursTransaction debitHours(
            UUID employeeId,
            UUID contractId,
            BigDecimal hours,
            BankHoursTransaction.SourceType sourceType,
            String description,
            UUID createdById) {
        
        log.info("âž– Debitando {} horas do banco de horas - Employee: {}", hours, employeeId);

        BankHours bankHours = bankHoursRepository.findByEmployeeIdAndContractId(employeeId, contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Banco de horas nÃ£o encontrado"));

        if (bankHours.getBalanceHours().compareTo(hours) < 0) {
            throw new RuntimeException(
                    String.format("Saldo insuficiente. Saldo atual: %s, tentativa de usar: %s", 
                                  bankHours.getBalanceHours(), hours));
        }

        BankHoursTransaction transaction = new BankHoursTransaction();
        transaction.setBankHours(bankHours);
        transaction.setTransactionType(BankHoursTransaction.TransactionType.DEBIT);
        transaction.setHours(hours);
        transaction.setSourceType(sourceType);
        transaction.setDescription(description != null ? description : "Uso de horas do banco");
        transaction.setTransactionDate(LocalDate.now());
        transaction.setCreatedById(createdById);

        BankHoursTransaction saved = transactionRepository.save(transaction);
        
        // Atualizar saldo
        bankHours.setBalanceHours(bankHours.getBalanceHours().subtract(hours));
        bankHours.setLastUpdatedAt(LocalDateTime.now());
        bankHoursRepository.save(bankHours);

        log.info("âœ… {} horas debitadas - Saldo atual: {}", hours, bankHours.getBalanceHours());
        return saved;
    }

    /**
     * Ajuste manual de saldo (CREDIT ou DEBIT)
     */
    @Transactional
    public BankHoursTransaction adjustBalance(
            UUID employeeId,
            UUID contractId,
            BigDecimal hours,
            BankHoursTransaction.TransactionType type,
            String description,
            UUID createdById) {
        
        log.info("âš™ï¸ Ajuste manual de {} horas (tipo: {}) - Employee: {}", hours, type, employeeId);

        BankHours bankHours = getOrCreateBankHours(employeeId, contractId);

        BankHoursTransaction transaction = new BankHoursTransaction();
        transaction.setBankHours(bankHours);
        transaction.setTransactionType(type);
        transaction.setHours(hours);
        transaction.setSourceType(BankHoursTransaction.SourceType.ADJUSTMENT);
        transaction.setDescription(description != null ? description : "Ajuste manual");
        transaction.setTransactionDate(LocalDate.now());
        transaction.setCreatedById(createdById);

        BankHoursTransaction saved = transactionRepository.save(transaction);
        
        // Atualizar saldo
        if (type == BankHoursTransaction.TransactionType.CREDIT) {
            bankHours.setBalanceHours(bankHours.getBalanceHours().add(hours));
        } else {
            bankHours.setBalanceHours(bankHours.getBalanceHours().subtract(hours));
        }
        bankHours.setLastUpdatedAt(LocalDateTime.now());
        bankHoursRepository.save(bankHours);

        log.info("âœ… Ajuste realizado - Saldo atual: {}", bankHours.getBalanceHours());
        return saved;
    }

    /**
     * Processa horas extras do fechamento e adiciona ao banco de horas (se configurado)
     */
    @Transactional
    public void processOvertimeForBankHours(UUID employeeId, UUID contractId, PayrollClosure closure) {
        try {
            // Se contractId for null, buscar configuraÃ§Ã£o padrÃ£o do funcionÃ¡rio
            ContractPayrollConfig config;
            if (contractId != null) {
                config = contractPayrollConfigService.getConfigByContractId(contractId);
            } else {
                config = contractPayrollConfigService.getConfigForEmployee(employeeId);
            }
            
            // Verificar se banco de horas estÃ¡ habilitado
            if (!config.getBankHoursEnabled()) {
                log.debug("Banco de horas nÃ£o habilitado para employee {}, ignorando", employeeId);
                return;
            }

            // Calcular horas extras totais
            BigDecimal totalOvertime = BigDecimal.ZERO;
            if (closure.getOvertime50() != null) {
                totalOvertime = totalOvertime.add(closure.getOvertime50());
            }
            if (closure.getOvertime100() != null) {
                totalOvertime = totalOvertime.add(closure.getOvertime100());
            }
            
            if (totalOvertime.compareTo(BigDecimal.ZERO) > 0) {
                String description = String.format("Horas extras do perÃ­odo %s/%s - Fechamento: %s",
                        closure.getReferenceMonth(), closure.getReferenceYear(), closure.getId());
                
                creditHours(employeeId, contractId, totalOvertime, closure.getId(), 
                           description, closure.getClosedById());
                log.info("âœ… {} horas extras processadas para banco de horas", totalOvertime);
            }
        } catch (Exception e) {
            log.error("Erro ao processar horas extras para banco de horas: {}", e.getMessage(), e);
            // NÃ£o lanÃ§ar exceÃ§Ã£o para nÃ£o quebrar o fechamento
        }
    }

    /**
     * Busca saldo de banco de horas
     */
    public BankHours getBankHours(UUID employeeId, UUID contractId) {
        return bankHoursRepository.findByEmployeeIdAndContractId(employeeId, contractId)
                .orElse(null); // Retorna null se nÃ£o existir (ao invÃ©s de exception)
    }

    /**
     * Lista histÃ³rico de transaÃ§Ãµes
     */
    public List<BankHoursTransaction> getTransactionHistory(UUID employeeId) {
        return transactionRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca transaÃ§Ãµes por perÃ­odo
     */
    public List<BankHoursTransaction> getTransactionsByPeriod(LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByPeriod(startDate, endDate);
    }

    /**
     * Verifica saldos prÃ³ximos ao vencimento
     */
    public List<BankHours> findExpiringBalances(int daysAhead) {
        LocalDate expirationDate = LocalDate.now().plusDays(daysAhead);
        return bankHoursRepository.findExpiringBalances(expirationDate);
    }
}






