package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.CostCenter;
import br.com.fleetmanager.repository.CostCenterRepository;
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
    
    @Transactional(readOnly = true)
    public List<CostCenterDTO> findAll() {
        log.info("Buscando todos os centros de custo");
        List<CostCenter> costCenters = costCenterRepository.findAll();
        return costCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<CostCenterDTO> findAll(Pageable pageable) {
        log.info("Buscando centros de custo paginados");
        Page<CostCenter> costCenters = costCenterRepository.findAllOrderByName(pageable);
        return costCenters.map(CostCenterDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<CostCenterDTO> findByFilters(
            CostCenter.CostCenterStatus status,
            String department,
            String searchTerm) {
        log.info("Buscando centros de custo com filtros - status: {}, department: {}, searchTerm: {}", 
                status, department, searchTerm);
        
        List<CostCenter> costCenters = costCenterRepository.findByFiltersList(status, department, searchTerm);
        return costCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
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
        return costCenters.map(CostCenterDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public CostCenterDTO findById(UUID id) {
        log.info("Buscando centro de custo por ID: {}", id);
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado com ID: " + id));
        return CostCenterDTO.fromEntity(costCenter);
    }
    
    @Transactional(readOnly = true)
    public CostCenterDTO findByCode(String code) {
        log.info("Buscando centro de custo por código: {}", code);
        CostCenter costCenter = costCenterRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado com código: " + code));
        return CostCenterDTO.fromEntity(costCenter);
    }
    
    public CostCenterDTO create(CreateCostCenterDTO dto) {
        log.info("Criando novo centro de custo: {}", dto.getCode());
        
        // Verificar se o código já existe
        if (costCenterRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Já existe um centro de custo com o código: " + dto.getCode());
        }
        
        CostCenter costCenter = CostCenter.builder()
                .code(dto.getCode())
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
    
    public CostCenterDTO update(UUID id, UpdateCostCenterDTO dto) {
        log.info("Atualizando centro de custo: {}", id);
        
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado com ID: " + id));
        
        // Verificar se o código já existe em outro centro de custo
        if (!costCenter.getCode().equals(dto.getCode()) && 
            costCenterRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Já existe um centro de custo com o código: " + dto.getCode());
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
                .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado com ID: " + id));
        
        costCenterRepository.delete(costCenter);
        log.info("Centro de custo excluído com sucesso: {}", id);
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
        return activeCenters.stream()
                .map(CostCenterDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public CostCenterDTO updateSpentAmount(UUID id, BigDecimal amount) {
        log.info("Atualizando valor gasto do centro de custo: {} para {}", id, amount);
        
        CostCenter costCenter = costCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centro de custo não encontrado com ID: " + id));
        
        costCenter.setCurrentSpent(amount);
        
        CostCenter savedCostCenter = costCenterRepository.save(costCenter);
        log.info("Valor gasto atualizado com sucesso: {}", savedCostCenter.getId());
        
        return CostCenterDTO.fromEntity(savedCostCenter);
    }
}