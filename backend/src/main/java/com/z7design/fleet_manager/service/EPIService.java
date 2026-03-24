package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.EPI;
import com.z7design.fleet_manager.model.EPIStatus;
import com.z7design.fleet_manager.repository.EPIRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * ServiÃ§o para gerenciamento de EPIs (entidade original)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EPIService {

    private final EPIRepository epiRepository;

    /**
     * Cria um novo EPI
     */
    public EPI create(EPI epi) {
        log.info("Criando EPI: {}", epi.getName());
        return epiRepository.save(epi);
    }

    /**
     * Atualiza um EPI existente
     */
    public EPI update(UUID id, EPI epi) {
        log.info("Atualizando EPI: {}", id);
        return epiRepository.findById(id)
                .map(existing -> {
                    existing.setName(epi.getName());
                    existing.setDescription(epi.getDescription());
                    existing.setIssueDate(epi.getIssueDate());
                    existing.setExpirationDate(epi.getExpirationDate());
                    existing.setStatus(epi.getStatus());
                    existing.setEmployee(epi.getEmployee());
                    existing.setPosition(epi.getPosition());
                    return epiRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Exclui um EPI
     */
    public void delete(UUID id) {
        log.info("Excluindo EPI: {}", id);
        epiRepository.deleteById(id);
    }

    /**
     * Busca EPI por ID
     */
    @Transactional(readOnly = true)
    public EPI findById(UUID id) {
        return epiRepository.findById(id).orElse(null);
    }

    /**
     * Busca EPIs por funcionÃ¡rio
     */
    @Transactional(readOnly = true)
    public List<EPI> findByEmployeeId(UUID employeeId) {
        return epiRepository.findByEmployeeId(employeeId);
    }

    /**
     * Busca EPIs por posiÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public List<EPI> findByPositionId(UUID positionId) {
        return epiRepository.findByPositionId(positionId);
    }

    /**
     * Busca EPIs por status
     */
    @Transactional(readOnly = true)
    public List<EPI> findByStatus(EPIStatus status) {
        return epiRepository.findByStatus(status);
    }

    /**
     * Busca EPIs prÃ³ximos da expiraÃ§Ã£o
     */
    @Transactional(readOnly = true)
    public List<EPI> findExpiringEPIs() {
        // TODO: Implementar lÃ³gica de busca por EPIs prÃ³ximos da expiraÃ§Ã£o
        return epiRepository.findAll();
    }

    /**
     * Busca todos os EPIs
     */
    @Transactional(readOnly = true)
    public List<EPI> findAll() {
        return epiRepository.findAll();
    }
}
