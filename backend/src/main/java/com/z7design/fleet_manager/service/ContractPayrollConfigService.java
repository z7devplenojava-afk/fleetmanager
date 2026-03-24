package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.ContractPayrollConfig;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.ContractPayrollConfigRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service para gerenciar configuraÃ§Ãµes de folha por contrato
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContractPayrollConfigService {

    private final ContractPayrollConfigRepository configRepository;
    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Busca configuraÃ§Ã£o de folha para um funcionÃ¡rio
     * Tenta buscar pelo contrato ativo da empresa/unidade do funcionÃ¡rio
     */
    public ContractPayrollConfig getConfigForEmployee(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado: " + employeeId));

        // Por enquanto, retorna configuraÃ§Ã£o padrÃ£o
        // TODO: Implementar lÃ³gica para buscar contrato ativo da empresa/unidade
        return getDefaultConfig();
    }

    /**
     * Busca configuraÃ§Ã£o de folha por contrato
     */
    public ContractPayrollConfig getConfigByContractId(UUID contractId) {
        return configRepository.findByContractId(contractId)
                .orElseGet(() -> {
                    log.warn("ConfiguraÃ§Ã£o nÃ£o encontrada para contrato {}, usando padrÃ£o", contractId);
                    return getDefaultConfig();
                });
    }

    /**
     * Retorna configuraÃ§Ã£o padrÃ£o (valores CLT bÃ¡sicos)
     */
    public ContractPayrollConfig getDefaultConfig() {
        ContractPayrollConfig defaultConfig = new ContractPayrollConfig();
        defaultConfig.setHourDivisor(BigDecimal.valueOf(220.0));
        defaultConfig.setDailyHours(BigDecimal.valueOf(8.0));
        defaultConfig.setNightShiftStart(LocalTime.of(22, 0));
        defaultConfig.setNightShiftEnd(LocalTime.of(5, 0));
        defaultConfig.setNightShiftPercentage(BigDecimal.valueOf(20.0));
        defaultConfig.setOvertime50Percentage(BigDecimal.valueOf(50.0));
        defaultConfig.setOvertime100Percentage(BigDecimal.valueOf(100.0));
        defaultConfig.setSundayOvertimePercentage(BigDecimal.valueOf(100.0));
        defaultConfig.setHolidayOvertimePercentage(BigDecimal.valueOf(100.0));
        defaultConfig.setDelayToleranceMinutes(10);
        defaultConfig.setBankHoursEnabled(false);
        defaultConfig.setDefaultEntryTime(LocalTime.of(8, 0));
        defaultConfig.setDefaultExitTime(LocalTime.of(17, 0));
        defaultConfig.setLunchDurationMinutes(60);
        return defaultConfig;
    }

    @Transactional
    public ContractPayrollConfig create(ContractPayrollConfig config) {
        log.info("ðŸ“ Criando configuraÃ§Ã£o de folha para contrato: {}", config.getContract().getId());
        
        if (configRepository.existsByContractId(config.getContract().getId())) {
            throw new RuntimeException("JÃ¡ existe configuraÃ§Ã£o para este contrato");
        }
        
        ContractPayrollConfig saved = configRepository.save(config);
        log.info("âœ… ConfiguraÃ§Ã£o criada com sucesso - ID: {}", saved.getId());
        return saved;
    }

    @Transactional
    public ContractPayrollConfig update(UUID id, ContractPayrollConfig config) {
        log.info("ðŸ“ Atualizando configuraÃ§Ã£o de folha: {}", id);
        
        ContractPayrollConfig existing = findById(id);
        config.setId(id);
        config.setCreatedAt(existing.getCreatedAt());
        
        ContractPayrollConfig updated = configRepository.save(config);
        log.info("âœ… ConfiguraÃ§Ã£o atualizada com sucesso - ID: {}", updated.getId());
        return updated;
    }

    public ContractPayrollConfig findById(UUID id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ConfiguraÃ§Ã£o nÃ£o encontrada: " + id));
    }

    @Transactional
    public void delete(UUID id) {
        log.info("ðŸ“ Deletando configuraÃ§Ã£o de folha: {}", id);
        ContractPayrollConfig config = findById(id);
        configRepository.delete(config);
        log.info("âœ… ConfiguraÃ§Ã£o deletada com sucesso - ID: {}", id);
    }
}






