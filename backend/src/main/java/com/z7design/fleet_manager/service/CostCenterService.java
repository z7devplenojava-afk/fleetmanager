package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.CostCenter;
import com.z7design.fleet_manager.repository.CostCenterRepository;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CostCenterService {
    
    private final CostCenterRepository costCenterRepository;
    private final InvoiceRepository invoiceRepository;
    
    @Transactional(readOnly = true)
    public List<CostCenterDTO> findAll() {
        log.info("Buscando todos os centros de custo");
        List<CostCenter> costCenters = costCenterRepository.findAll();
        List<CostCenterDTO> dtos = costCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        enrichWithComputedSpent(dtos);
        return dtos;
    }
    
    @Transactional(readOnly = true)
    public Page<CostCenterDTO> findAll(Pageable pageable) {
        log.info("Buscando centros de custo paginados");
        Page<CostCenter> costCenters = costCenterRepository.findAllOrderByName(pageable);
        Page<CostCenterDTO> page = costCenters.map(CostCenterDTO::fromEntity);
        // Enriquecer valores computados
        enrichWithComputedSpent(page.getContent());
        return page;
    }
    
    @Transactional(readOnly = true)
    public List<CostCenterDTO> findByFilters(
            CostCenter.CostCenterStatus status,
            String department,
            String searchTerm) {
        log.info("Buscando centros de custo com filtros - status: {}, department: {}, searchTerm: {}", 
                status, department, searchTerm);
        
        List<CostCenter> costCenters = costCenterRepository.findByFiltersList(status, department, searchTerm);
        List<CostCenterDTO> dtos = costCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        enrichWithComputedSpent(dtos);
        return dtos;
    }
    
    @Transactional(readOnly = true)
    public Page<CostCenterDTO> findByFilters(
            CostCenter.CostCenterStatus status,
            String department,
            String searchTerm,
            Pageable pageable) {
        log.info("Buscando centros de custo com filtros paginados - status: {}, department: {}, searchTerm: {}", 
                status, department, searchTerm);
        
        Page<CostCenter> costCenters = costCenterRepository.findByFilters(status, department, searchTerm, pageable);
        Page<CostCenterDTO> page = costCenters.map(CostCenterDTO::fromEntity);
        enrichWithComputedSpent(page.getContent());
        return page;
    }
    
    @Transactional(readOnly = true)
    public CostCenterDTO findById(UUID id) {
        log.info("Buscando centro de custo por ID: {}", id);
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo nÃ£o encontrado com ID: " + id));
        CostCenterDTO dto = CostCenterDTO.fromEntity(costCenter);
        enrichWithComputedSpent(java.util.List.of(dto));
        return dto;
    }
    
    @Transactional(readOnly = true)
    public CostCenterDTO findByCode(String code) {
        log.info("Buscando centro de custo por cÃ³digo: {}", code);
        CostCenter costCenter = costCenterRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Centro de custo nÃ£o encontrado com cÃ³digo: " + code));
        CostCenterDTO dto = CostCenterDTO.fromEntity(costCenter);
        enrichWithComputedSpent(java.util.List.of(dto));
        return dto;
    }
    
    public CostCenterDTO create(CreateCostCenterDTO dto) {
        log.info("Criando novo centro de custo: {}", dto.getCode());
        
        // Gerar cÃ³digo automaticamente se nÃ£o fornecido
        String code = dto.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateNextCode();
            log.info("CÃ³digo gerado automaticamente: {}", code);
        }
        
        // Verificar se o cÃ³digo jÃ¡ existe
        if (costCenterRepository.existsByCode(code)) {
            throw new RuntimeException("JÃ¡ existe um centro de custo com o cÃ³digo: " + code);
        }
        
        CostCenter costCenter = CostCenter.builder()
                .code(code)
                .name(dto.getName())
                .description(dto.getDescription())
                .responsible(dto.getResponsible())
                .department(dto.getDepartment())
                .budget(dto.getBudget())
                .currentSpent(BigDecimal.ZERO)
                .status(dto.getStatus())
                .createdBy(dto.getCreatedBy())
                .build();
        
        CostCenter savedCostCenter = costCenterRepository.save(costCenter);
        log.info("Centro de custo criado com sucesso: {}", savedCostCenter.getId());
        
        return CostCenterDTO.fromEntity(savedCostCenter);
    }
    
    /**
     * Gera o prÃ³ximo cÃ³digo disponÃ­vel para centro de custo
     * Formato: CC001, CC002, CC003, etc.
     */
    private String generateNextCode() {
        // Buscar o maior cÃ³digo numÃ©rico existente
        String lastCode = costCenterRepository.findLastCodeByPattern("CC%");
        
        int nextNumber = 1;
        if (lastCode != null && lastCode.startsWith("CC")) {
            try {
                String numberPart = lastCode.substring(2);
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Erro ao parsear cÃ³digo existente: {}", lastCode);
                nextNumber = 1;
            }
        }
        
        return String.format("CC%03d", nextNumber);
    }
    
    public CostCenterDTO update(UUID id, UpdateCostCenterDTO dto) {
        log.info("Atualizando centro de custo: {}", id);
        
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo nÃ£o encontrado com ID: " + id));
        
        // Verificar se o cÃ³digo jÃ¡ existe em outro centro de custo
        if (!costCenter.getCode().equals(dto.getCode()) && 
            costCenterRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("JÃ¡ existe um centro de custo com o cÃ³digo: " + dto.getCode());
        }
        
        costCenter.setCode(dto.getCode());
        costCenter.setName(dto.getName());
        costCenter.setDescription(dto.getDescription());
        costCenter.setResponsible(dto.getResponsible());
        costCenter.setDepartment(dto.getDepartment());
        costCenter.setBudget(dto.getBudget());
        costCenter.setCurrentSpent(dto.getCurrentSpent());
        costCenter.setStatus(dto.getStatus());
        costCenter.setUpdatedBy(dto.getUpdatedBy());
        
        CostCenter savedCostCenter = costCenterRepository.save(costCenter);
        log.info("Centro de custo atualizado com sucesso: {}", savedCostCenter.getId());
        
        return CostCenterDTO.fromEntity(savedCostCenter);
    }
    
    public void delete(UUID id) {
        log.info("Excluindo centro de custo: {}", id);
        
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo nÃ£o encontrado com ID: " + id));
        
        costCenterRepository.delete(costCenter);
        log.info("Centro de custo excluÃ­do com sucesso: {}", id);
    }
    
    @Transactional(readOnly = true)
    public List<String> getDistinctDepartments() {
        log.info("Buscando departamentos distintos");
        return costCenterRepository.findDistinctDepartments();
    }
    
    @Transactional(readOnly = true)
    public CostCenterSummaryDTO getSummary() {
        log.info("Gerando resumo dos centros de custo");
        
        Long totalCenters = costCenterRepository.countAllCenters();
        Long activeCenters = costCenterRepository.countByStatus(CostCenter.CostCenterStatus.ATIVO);
        Long inactiveCenters = costCenterRepository.countByStatus(CostCenter.CostCenterStatus.INATIVO);
        Long suspendedCenters = costCenterRepository.countByStatus(CostCenter.CostCenterStatus.SUSPENSO);
        
        BigDecimal totalBudget = costCenterRepository.sumTotalBudget();
        BigDecimal totalSpent = costCenterRepository.sumTotalSpent();
        
        if (totalBudget == null) totalBudget = BigDecimal.ZERO;
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;
        
        BigDecimal totalAvailable = totalBudget.subtract(totalSpent);
        BigDecimal averageUtilization = totalBudget.compareTo(BigDecimal.ZERO) > 0 ? 
                totalSpent.divide(totalBudget, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : 
                BigDecimal.ZERO;
        
        List<CostCenterDTO> topUtilizedCenters = costCenterRepository.findTopUtilizedCenters(Pageable.ofSize(5))
                .stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        
        List<CostCenterDTO> overBudgetCenters = costCenterRepository.findOverBudgetCenters()
                .stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        
        List<CostCenterDTO> nearBudgetLimitCenters = costCenterRepository.findNearBudgetLimitCenters()
                .stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        
        return CostCenterSummaryDTO.builder()
                .totalCenters(totalCenters)
                .activeCenters(activeCenters)
                .inactiveCenters(inactiveCenters)
                .suspendedCenters(suspendedCenters)
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .totalAvailable(totalAvailable)
                .averageUtilization(averageUtilization)
                .topUtilizedCenters(topUtilizedCenters)
                .overBudgetCenters(overBudgetCenters)
                .nearBudgetLimitCenters(nearBudgetLimitCenters)
                .build();
    }
    
    @Transactional(readOnly = true)
    public List<CostCenterDTO> getActiveCenters() {
        log.info("Buscando centros de custo ativos");
        List<CostCenter> activeCenters = costCenterRepository.findActiveCentersOrderByName();
        List<CostCenterDTO> dtos = activeCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
        enrichWithComputedSpent(dtos);
        return dtos;
    }
    
    public CostCenterDTO updateSpentAmount(UUID id, BigDecimal amount) {
        log.info("Atualizando valor gasto do centro de custo: {} para {}", id, amount);
        
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo nÃ£o encontrado com ID: " + id));
        
        costCenter.setCurrentSpent(amount);
        
        CostCenter savedCostCenter = costCenterRepository.save(costCenter);
        log.info("Valor gasto atualizado com sucesso: {}", savedCostCenter.getId());
        
        CostCenterDTO dto = CostCenterDTO.fromEntity(savedCostCenter);
        enrichWithComputedSpent(java.util.List.of(dto));
        return dto;

    }

    private void enrichWithComputedSpent(List<CostCenterDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;
        for (CostCenterDTO dto : dtos) {
            try {
                java.math.BigDecimal computed = invoiceRepository.sumByCentroCustoAndPeriod(dto.getName(), null, null);
                if (computed == null) computed = java.math.BigDecimal.ZERO;
                dto.setCurrentSpent(computed);
                java.math.BigDecimal budget = dto.getBudget() != null ? dto.getBudget() : java.math.BigDecimal.ZERO;
                dto.setAvailableBudget(budget.subtract(computed));
                if (budget.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    dto.setUtilizationPercentage(computed.divide(budget, 4, java.math.RoundingMode.HALF_UP)
                            .multiply(java.math.BigDecimal.valueOf(100)));
                } else {
                    dto.setUtilizationPercentage(java.math.BigDecimal.ZERO);
                }
                dto.setIsOverBudget(budget.compareTo(java.math.BigDecimal.ZERO) > 0 && computed.compareTo(budget) > 0);
                dto.setIsNearBudgetLimit(budget.compareTo(java.math.BigDecimal.ZERO) > 0 &&
                        dto.getUtilizationPercentage().compareTo(java.math.BigDecimal.valueOf(90)) >= 0);
            } catch (Exception e) {
                // MantÃ©m valores originais se houver falha
            }
        }
    }
}
