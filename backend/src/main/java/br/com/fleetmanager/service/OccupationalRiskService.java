package br.com.fleetmanager.service;

import br.com.fleetmanager.model.*;
import br.com.fleetmanager.model.enums.OccupationalRiskCategory;
// import br.com.fleetmanager.model.enums.RiskLevel;
import br.com.fleetmanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para gerenciamento de riscos ocupacionais
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OccupationalRiskService {

    private final OccupationalRiskTypeRepository riskTypeRepository;
    private final PositionRiskRepository positionRiskRepository;
    private final EmployeeRiskRepository employeeRiskRepository;
    // TODO: Implementar RiskRequiredEPIRepository quando necessário

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

    // ========== RISCOS POR POSIÇÃO ==========

    /**
     * Associa risco a uma posição
     */
    public PositionRisk associateRiskToPosition(UUID positionId, UUID riskTypeId, String riskLevel, String description, String preventiveMeasures) {
        log.info("Associando risco {} à posição {}", riskTypeId, positionId);
        
        // TODO: Implementar quando as entidades Position e OccupationalRiskType estiverem disponíveis
        PositionRisk positionRisk = new PositionRisk();
        // positionRisk.setPosition(position);
        // positionRisk.setRiskType(riskType);
        // positionRisk.setRiskLevel(riskLevel); // TODO: Implementar quando RiskLevel estiver disponível
        positionRisk.setDescription(description);
        positionRisk.setPreventiveMeasures(preventiveMeasures);
        positionRisk.setIsActive(true);
        
        return positionRiskRepository.save(positionRisk);
    }

    /**
     * Busca riscos por posição
     */
    @Transactional(readOnly = true)
    public List<PositionRisk> getRisksByPosition(UUID positionId) {
        return positionRiskRepository.findByPositionId(positionId);
    }

    /**
     * Busca riscos ativos por posição
     */
    @Transactional(readOnly = true)
    public List<PositionRisk> getActiveRisksByPosition(UUID positionId) {
        // TODO: Implementar quando o método findByPositionIdAndIsActiveTrue estiver disponível
        return positionRiskRepository.findByPositionId(positionId).stream()
                .filter(risk -> risk.getIsActive())
                .toList();
    }

    /**
     * Remove associação de risco com posição
     */
    public void removeRiskFromPosition(UUID positionId, UUID riskTypeId) {
        log.info("Removendo risco {} da posição {}", riskTypeId, positionId);
        // TODO: Implementar quando o método findByPositionIdAndRiskTypeId estiver disponível
        List<PositionRisk> risks = positionRiskRepository.findByPositionId(positionId);
        risks.stream()
                .filter(risk -> risk.getRiskType().getId().equals(riskTypeId))
                .findFirst()
                .ifPresent(positionRisk -> {
                    positionRisk.setIsActive(false);
                    positionRiskRepository.save(positionRisk);
                });
    }

    // ========== RISCOS POR FUNCIONÁRIO ==========

    /**
     * Associa risco específico a um funcionário
     */
    public EmployeeRisk associateRiskToEmployee(UUID employeeId, UUID riskTypeId, String riskLevel, String description, String preventiveMeasures) {
        log.info("Associando risco {} ao funcionário {}", riskTypeId, employeeId);
        
        // TODO: Implementar quando as entidades Employee e OccupationalRiskType estiverem disponíveis
        EmployeeRisk employeeRisk = new EmployeeRisk();
        // employeeRisk.setEmployee(employee);
        // employeeRisk.setRiskType(riskType);
        // employeeRisk.setRiskLevel(riskLevel); // TODO: Implementar quando RiskLevel estiver disponível
        employeeRisk.setDescription(description);
        employeeRisk.setPreventiveMeasures(preventiveMeasures);
        employeeRisk.setIsActive(true);
        
        return employeeRiskRepository.save(employeeRisk);
    }

    /**
     * Busca riscos por funcionário
     */
    @Transactional(readOnly = true)
    public List<EmployeeRisk> getRisksByEmployee(UUID employeeId) {
        return employeeRiskRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca riscos ativos por funcionário
     */
    @Transactional(readOnly = true)
    public List<EmployeeRisk> getActiveRisksByEmployee(UUID employeeId) {
        // TODO: Implementar quando o método findByEmployeeIdAndIsActiveTrue estiver disponível
        return employeeRiskRepository.findByEmployeeId(employeeId).stream()
                .filter(risk -> risk.getIsActive())
                .toList();
    }

    /**
     * Remove associação de risco com funcionário
     */
    public void removeRiskFromEmployee(UUID employeeId, UUID riskTypeId) {
        log.info("Removendo risco {} do funcionário {}", riskTypeId, employeeId);
        // TODO: Implementar quando o método findByEmployeeIdAndRiskTypeId estiver disponível
        List<EmployeeRisk> risks = employeeRiskRepository.findByEmployeeId(employeeId);
        risks.stream()
                .filter(risk -> risk.getRiskType().getId().equals(riskTypeId))
                .findFirst()
                .ifPresent(employeeRisk -> {
                    employeeRisk.setIsActive(false);
                    employeeRiskRepository.save(employeeRisk);
                });
    }

    // ========== EPIs OBRIGATÓRIOS POR RISCO ==========
    // TODO: Implementar quando RiskRequiredEPIRepository estiver disponível

    /**
     * Associa EPI obrigatório a um tipo de risco
     */
    public void associateEPIToRisk(UUID riskTypeId, UUID epiId, boolean isMandatory, Integer quantity, Integer replacementFrequencyDays) {
        log.info("Associando EPI {} ao risco {}", epiId, riskTypeId);
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponível
    }

    /**
     * Busca EPIs obrigatórios por tipo de risco
     */
    @Transactional(readOnly = true)
    public List<RiskRequiredEPI> getRequiredEPIsByRisk(UUID riskTypeId) {
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponível
        return List.of();
    }

    /**
     * Remove associação de EPI com risco
     */
    public void removeEPIFromRisk(UUID riskTypeId, UUID epiId) {
        log.info("Removendo EPI {} do risco {}", epiId, riskTypeId);
        // TODO: Implementar quando RiskRequiredEPIRepository estiver disponível
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Copia riscos da posição para o funcionário (usado na admissão)
     */
    public void copyPositionRisksToEmployee(UUID positionId, UUID employeeId) {
        log.info("Copiando riscos da posição {} para o funcionário {}", positionId, employeeId);
        
        List<PositionRisk> positionRisks = getActiveRisksByPosition(positionId);
        
        for (PositionRisk positionRisk : positionRisks) {
            // Verifica se o funcionário já não tem este risco específico
            // TODO: Implementar quando existsByEmployeeIdAndRiskTypeId estiver disponível
            if (!employeeRiskRepository.findByEmployeeId(employeeId).stream()
                    .anyMatch(risk -> risk.getRiskType().getId().equals(positionRisk.getRiskType().getId()))) {
                associateRiskToEmployee(
                    employeeId,
                    positionRisk.getRiskType().getId(),
                    "MEDIO", // TODO: Implementar quando RiskLevel estiver disponível
                    positionRisk.getDescription(),
                    positionRisk.getPreventiveMeasures()
                );
            }
        }
    }

    /**
     * Atualiza riscos do funcionário quando há mudança de posição
     */
    public void updateEmployeeRisksForPositionChange(UUID employeeId, UUID newPositionId) {
        log.info("Atualizando riscos do funcionário {} para nova posição {}", employeeId, newPositionId);
        
        // Desativa riscos antigos
        List<EmployeeRisk> currentRisks = getActiveRisksByEmployee(employeeId);
        for (EmployeeRisk risk : currentRisks) {
            risk.setIsActive(false);
            employeeRiskRepository.save(risk);
        }
        
        // Copia novos riscos da posição
        copyPositionRisksToEmployee(newPositionId, employeeId);
    }
}
