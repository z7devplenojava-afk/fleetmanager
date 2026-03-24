package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.OccupationalRiskCategory;
// import com.z7design.fleet_manager.model.enums.RiskLevel;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * ServiÃ§o para gerenciamento de riscos ocupacionais
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OccupationalRiskService {

    private final OccupationalRiskTypeRepository riskTypeRepository;
    private final PositionRiskRepository positionRiskRepository;
    private final EmployeeRiskRepository employeeRiskRepository;
    // TODO: Implementar RiskRequiredEPIRepository quando necessÃ¡rio

    // ========== TIPOS DE RISCO ==========

    /**
     * Cria um novo tipo de risco ocupacional
     */
    public OccupationalRiskType createRiskType(OccupationalRiskType riskType) {
        log.info("Criando tipo de risco: {}", riskType.getName());
        return riskTypeRepository.save(riskType);
    }

    /**
     * Busca todos os tipos de risco
     */
    @Transactional(readOnly = true)
    public List<OccupationalRiskType> getAllRiskTypes() {
        return riskTypeRepository.findAll();
    }

    /**
     * Busca tipos de risco por categoria
     */
    @Transactional(readOnly = true)
    public List<OccupationalRiskType> getRiskTypesByCategory(OccupationalRiskCategory category) {
        return riskTypeRepository.findByCategory(category);
    }

    /**
     * Busca tipos de risco ativos
     */
    @Transactional(readOnly = true)
    public List<OccupationalRiskType> getActiveRiskTypes() {
        return riskTypeRepository.findByIsActiveTrue();
    }

    /**
     * Busca tipo de risco por ID
     */
    @Transactional(readOnly = true)
    public OccupationalRiskType getRiskTypeById(UUID id) {
        return riskTypeRepository.findById(id).orElse(null);
    }

    /**
     * Atualiza tipo de risco
     */
    public OccupationalRiskType updateRiskType(UUID id, OccupationalRiskType riskType) {
        log.info("Atualizando tipo de risco: {}", id);
        return riskTypeRepository.findById(id)
                .map(existing -> {
                    existing.setName(riskType.getName());
                    existing.setDescription(riskType.getDescription());
                    existing.setCategory(riskType.getCategory());
                    existing.setSeverityLevel(riskType.getSeverityLevel());
                    existing.setIsActive(riskType.getIsActive());
                    return riskTypeRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Desativa tipo de risco
     */
    public void deactivateRiskType(UUID id) {
        log.info("Desativando tipo de risco: {}", id);
        riskTypeRepository.findById(id).ifPresent(riskType -> {
            riskType.setIsActive(false);
            riskTypeRepository.save(riskType);
        });
    }

    // ========== RISCOS POR POSIÃ‡ÃƒO ==========

    /**
     * Associa risco a uma posiÃ§Ã£o
     */
    public PositionRisk associateRiskToPosition(UUID positionId, UUID riskTypeId, String riskLevel, String description, String preventiveMeasures) {
        log.info("Associando risco {} Ã  posiÃ§Ã£o {}", riskTypeId, positionId);
        
        // TODO: Implementar quando as entidades Position e OccupationalRiskType estiverem disponÃ­veis
        PositionRisk positionRisk = new PositionRisk();
        // positionRisk.setPosition(position);
        // positionRisk.setRiskType(riskType);
        // positionRisk.setRiskLevel(riskLevel); // TODO: Implementar quando RiskLevel estiver disponÃ­vel
        positionRisk.setDescription(description);
        positionRisk.setPreventiveMeasures(preventiveMeasures);
        positionRisk.setIsActive(true);
        
        return positionRiskRepository.save(positionRisk);
    }

    /**
     * Busca riscos por posiÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public List<PositionRisk> getRisksByPosition(UUID positionId) {
        return positionRiskRepository.findByPositionId(positionId);
    }

    /**
     * Busca riscos ativos por posiÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public List<PositionRisk> getActiveRisksByPosition(UUID positionId) {
        // TODO: Implementar quando o mÃ©todo findByPositionIdAndIsActiveTrue estiver disponÃ­vel
        return positionRiskRepository.findByPositionId(positionId).stream()
                .filter(risk -> risk.getIsActive())
                .toList();
    }

    /**
     * Remove associaÃ§Ã£o de risco com posiÃ§Ã£o
     */
    public void removeRiskFromPosition(UUID positionId, UUID riskTypeId) {
        log.info("Removendo risco {} da posiÃ§Ã£o {}", riskTypeId, positionId);
        // TODO: Implementar quando o mÃ©todo findByPositionIdAndRiskTypeId estiver disponÃ­vel
        List<PositionRisk> risks = positionRiskRepository.findByPositionId(positionId);
        risks.stream()
                .filter(risk -> risk.getRiskType().getId().equals(riskTypeId))
                .findFirst()
                .ifPresent(positionRisk -> {
                    positionRisk.setIsActive(false);
                    positionRiskRepository.save(positionRisk);
                });
    }

    // ========== RISCOS POR FUNCIONÃRIO ==========

    /**
     * Associa risco especÃ­fico a um funcionÃ¡rio
     */
    public EmployeeRisk associateRiskToEmployee(UUID employeeId, UUID riskTypeId, String riskLevel, String description, String preventiveMeasures) {
        log.info("Associando risco {} ao funcionÃ¡rio {}", riskTypeId, employeeId);
        
        // TODO: Implementar quando as entidades Employee e OccupationalRiskType estiverem disponÃ­veis
        EmployeeRisk employeeRisk = new EmployeeRisk();
        // employeeRisk.setEmployee(employee);
        // employeeRisk.setRiskType(riskType);
        // employeeRisk.setRiskLevel(riskLevel); // TODO: Implementar quando RiskLevel estiver disponÃ­vel
        employeeRisk.setDescription(description);
        employeeRisk.setPreventiveMeasures(preventiveMeasures);
        employeeRisk.setIsActive(true);
        
        return employeeRiskRepository.save(employeeRisk);
    }

    /**
     * Busca riscos por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EmployeeRisk> getRisksByEmployee(UUID employeeId) {
        return employeeRiskRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca riscos ativos por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EmployeeRisk> getActiveRisksByEmployee(UUID employeeId) {
        // TODO: Implementar quando o mÃ©todo findByEmployeeIdAndIsActiveTrue estiver disponÃ­vel
        return employeeRiskRepository.findByEmployeeId(employeeId).stream()
                .filter(risk -> risk.getIsActive())
                .toList();
    }

    /**
     * Remove associaÃ§Ã£o de risco com funcionÃ¡rio
     */
    public void removeRiskFromEmployee(UUID employeeId, UUID riskTypeId) {
        log.info("Removendo risco {} do funcionÃ¡rio {}", riskTypeId, employeeId);
        // TODO: Implementar quando o mÃ©todo findByEmployeeIdAndRiskTypeId estiver disponÃ­vel
        List<EmployeeRisk> risks = employeeRiskRepository.findByEmployeeId(employeeId);
        risks.stream()
                .filter(risk -> risk.getRiskType().getId().equals(riskTypeId))
                .findFirst()
                .ifPresent(employeeRisk -> {
                    employeeRisk.setIsActive(false);
                    employeeRiskRepository.save(employeeRisk);
                });
    }

    // ========== EPIs OBRIGATÃ“RIOS POR RISCO ==========
    // TODO: Implementar quando RiskRequiredEPIRepository estiver disponÃ­vel

    /**
     * Associa EPI obrigatÃ³rio a um tipo de risco
     */
    public void associateEPIToRisk(UUID riskTypeId, UUID epiId, boolean isMandatory, Integer quantity, Integer replacementFrequencyDays) {
        log.info("Associando EPI {} ao risco {}", epiId, riskTypeId);
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponÃ­vel
    }

    /**
     * Busca EPIs obrigatÃ³rios por tipo de risco
     */
    @Transactional(readOnly = true)
    public List<RiskRequiredEPI> getRequiredEPIsByRisk(UUID riskTypeId) {
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponÃ­vel
        return List.of();
    }

    /**
     * Remove associaÃ§Ã£o de EPI com risco
     */
    public void removeEPIFromRisk(UUID riskTypeId, UUID epiId) {
        log.info("Removendo EPI {} do risco {}", epiId, riskTypeId);
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponÃ­vel
    }

    // ========== MÃ‰TODOS AUXILIARES ==========

    /**
     * Copia riscos da posiÃ§Ã£o para o funcionÃ¡rio (usado na admissÃ£o)
     */
    public void copyPositionRisksToEmployee(UUID positionId, UUID employeeId) {
        log.info("Copiando riscos da posiÃ§Ã£o {} para o funcionÃ¡rio {}", positionId, employeeId);
        
        List<PositionRisk> positionRisks = getActiveRisksByPosition(positionId);
        
        for (PositionRisk positionRisk : positionRisks) {
            // Verifica se o funcionÃ¡rio jÃ¡ nÃ£o tem este risco especÃ­fico
            // TODO: Implementar quando existsByEmployeeIdAndRiskTypeId estiver disponÃ­vel
            if (!employeeRiskRepository.findByEmployeeId(employeeId).stream()
                    .anyMatch(risk -> risk.getRiskType().getId().equals(positionRisk.getRiskType().getId()))) {
                associateRiskToEmployee(
                    employeeId,
                    positionRisk.getRiskType().getId(),
                    "MEDIO", // TODO: Implementar quando RiskLevel estiver disponÃ­vel
                    positionRisk.getDescription(),
                    positionRisk.getPreventiveMeasures()
                );
            }
        }
    }

    /**
     * Atualiza riscos do funcionÃ¡rio quando hÃ¡ mudanÃ§a de posiÃ§Ã£o
     */
    public void updateEmployeeRisksForPositionChange(UUID employeeId, UUID newPositionId) {
        log.info("Atualizando riscos do funcionÃ¡rio {} para nova posiÃ§Ã£o {}", employeeId, newPositionId);
        
        // Desativa riscos antigos
        List<EmployeeRisk> currentRisks = getActiveRisksByEmployee(employeeId);
        for (EmployeeRisk risk : currentRisks) {
            risk.setIsActive(false);
            employeeRiskRepository.save(risk);
        }
        
        // Copia novos riscos da posiÃ§Ã£o
        copyPositionRisksToEmployee(newPositionId, employeeId);
    }
}

