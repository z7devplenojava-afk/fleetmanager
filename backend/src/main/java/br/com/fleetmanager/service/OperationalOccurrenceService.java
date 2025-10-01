package br.com.fleetmanager.service;

import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.OperationalOccurrence;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.repository.OperationalOccurrenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OperationalOccurrenceService {
    
    private final OperationalOccurrenceRepository occurrenceRepository;
    private final EmployeeRepository employeeRepository;
    
    /**
     * Criar nova ocorrência operacional
     */
    public OperationalOccurrence createOccurrence(OperationalOccurrence occurrence) {
        log.info("Criando nova ocorrência para funcionário: {}", occurrence.getEmployee().getId());
        
        // Validar funcionário
        Employee employee = employeeRepository.findById(occurrence.getEmployee().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado"));
        
        // Validar número de advertência se fornecido
        if (occurrence.getWarningNumber() != null && 
            occurrenceRepository.existsByWarningNumber(occurrence.getWarningNumber())) {
            throw new BusinessException("Número de advertência já existe");
        }
        
        // Definir status inicial
        occurrence.setStatus(OperationalOccurrence.OccurrenceStatus.PENDENTE);
        occurrence.setEmployee(employee);
        occurrence.setDate(LocalDateTime.now());
        
        OperationalOccurrence savedOccurrence = occurrenceRepository.save(occurrence);
        log.info("Ocorrência criada com sucesso: {}", savedOccurrence.getId());
        
        return savedOccurrence;
    }
    
    /**
     * Atualizar ocorrência existente
     */
    public OperationalOccurrence updateOccurrence(UUID id, OperationalOccurrence occurrenceDetails) {
        log.info("Atualizando ocorrência: {}", id);
        
        OperationalOccurrence existingOccurrence = occurrenceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ocorrência não encontrada"));
        
        // Validar funcionário se foi alterado
        if (occurrenceDetails.getEmployee() != null && 
            !occurrenceDetails.getEmployee().getId().equals(existingOccurrence.getEmployee().getId())) {
            Employee employee = employeeRepository.findById(occurrenceDetails.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado"));
            existingOccurrence.setEmployee(employee);
        }
        
        // Validar número de advertência se foi alterado
        if (occurrenceDetails.getWarningNumber() != null && 
            !occurrenceDetails.getWarningNumber().equals(existingOccurrence.getWarningNumber()) &&
            occurrenceRepository.existsByWarningNumber(occurrenceDetails.getWarningNumber())) {
            throw new BusinessException("Número de advertência já existe");
        }
        
        // Atualizar campos
        if (occurrenceDetails.getType() != null) {
            existingOccurrence.setType(occurrenceDetails.getType());
        }
        if (occurrenceDetails.getTitle() != null) {
            existingOccurrence.setTitle(occurrenceDetails.getTitle());
        }
        if (occurrenceDetails.getDescription() != null) {
            existingOccurrence.setDescription(occurrenceDetails.getDescription());
        }
        if (occurrenceDetails.getLocation() != null) {
            existingOccurrence.setLocation(occurrenceDetails.getLocation());
        }
        if (occurrenceDetails.getStatus() != null) {
            existingOccurrence.setStatus(occurrenceDetails.getStatus());
        }
        if (occurrenceDetails.getPriority() != null) {
            existingOccurrence.setPriority(occurrenceDetails.getPriority());
        }
        if (occurrenceDetails.getResponsible() != null) {
            existingOccurrence.setResponsible(occurrenceDetails.getResponsible());
        }
        if (occurrenceDetails.getWarningNumber() != null) {
            existingOccurrence.setWarningNumber(occurrenceDetails.getWarningNumber());
        }
        
        existingOccurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(existingOccurrence);
        log.info("Ocorrência atualizada com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Buscar ocorrência por ID
     */
    @Transactional(readOnly = true)
    public OperationalOccurrence getOccurrenceById(UUID id) {
        return occurrenceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ocorrência não encontrada"));
    }
    
    /**
     * Listar todas as ocorrências
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getAllOccurrences() {
        return occurrenceRepository.findAll();
    }
    
    /**
     * Buscar ocorrências por funcionário
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByEmployee(UUID employeeId) {
        return occurrenceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }
    
    /**
     * Buscar ocorrências por tipo
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByType(OperationalOccurrence.OccurrenceType type) {
        return occurrenceRepository.findByTypeOrderByDateDesc(type);
    }
    
    /**
     * Buscar ocorrências por status
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByStatus(OperationalOccurrence.OccurrenceStatus status) {
        return occurrenceRepository.findByStatusOrderByDateDesc(status);
    }
    
    /**
     * Buscar ocorrências por prioridade
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByPriority(OperationalOccurrence.OccurrencePriority priority) {
        return occurrenceRepository.findByPriorityOrderByDateDesc(priority);
    }
    
    /**
     * Buscar ocorrências por período
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
    }
    
    /**
     * Buscar ocorrências pendentes
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getPendingOccurrences() {
        return occurrenceRepository.findByStatusOrderByPriorityDescDateAsc(OperationalOccurrence.OccurrenceStatus.PENDENTE);
    }
    
    /**
     * Buscar ocorrências não resolvidas por funcionário
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getUnresolvedOccurrencesByEmployee(UUID employeeId) {
        return occurrenceRepository.findUnresolvedByEmployee(employeeId);
    }
    
    /**
     * Buscar ocorrências por responsável
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByResponsible(String responsible) {
        return occurrenceRepository.findByResponsibleOrderByDateDesc(responsible);
    }
    
    /**
     * Buscar ocorrências por local
     */
    @Transactional(readOnly = true)
    public List<OperationalOccurrence> getOccurrencesByLocation(String location) {
        return occurrenceRepository.findByLocationContainingIgnoreCaseOrderByDateDesc(location);
    }
    
    /**
     * Buscar ocorrência por número de advertência
     */
    @Transactional(readOnly = true)
    public OperationalOccurrence getOccurrenceByWarningNumber(Integer warningNumber) {
        return occurrenceRepository.findByWarningNumber(warningNumber);
    }
    
    /**
     * Atualizar status da ocorrência
     */
    public OperationalOccurrence updateOccurrenceStatus(UUID id, OperationalOccurrence.OccurrenceStatus newStatus) {
        log.info("Atualizando status da ocorrência: {} para {}", id, newStatus);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        
        // Validar transição de status
        if (occurrence.getStatus() == OperationalOccurrence.OccurrenceStatus.CONCLUIDO) {
            throw new BusinessException("Não é possível alterar o status de uma ocorrência já concluída");
        }
        
        occurrence.setStatus(newStatus);
        occurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(occurrence);
        log.info("Status da ocorrência atualizado com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Atualizar prioridade da ocorrência
     */
    public OperationalOccurrence updateOccurrencePriority(UUID id, OperationalOccurrence.OccurrencePriority newPriority) {
        log.info("Atualizando prioridade da ocorrência: {} para {}", id, newPriority);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        occurrence.setPriority(newPriority);
        occurrence.setUpdatedAt(LocalDateTime.now());
        
        OperationalOccurrence updatedOccurrence = occurrenceRepository.save(occurrence);
        log.info("Prioridade da ocorrência atualizada com sucesso: {}", updatedOccurrence.getId());
        
        return updatedOccurrence;
    }
    
    /**
     * Deletar ocorrência
     */
    public void deleteOccurrence(UUID id) {
        log.info("Deletando ocorrência: {}", id);
        
        OperationalOccurrence occurrence = getOccurrenceById(id);
        
        if (occurrence.getStatus() == OperationalOccurrence.OccurrenceStatus.CONCLUIDO) {
            throw new BusinessException("Não é possível deletar uma ocorrência já concluída");
        }
        
        occurrenceRepository.delete(occurrence);
        log.info("Ocorrência deletada com sucesso: {}", id);
    }
    
    /**
     * Contar ocorrências por funcionário e período
     */
    @Transactional(readOnly = true)
    public long countOccurrencesByEmployeeAndPeriod(UUID employeeId, LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.countByEmployeeAndPeriod(employeeId, startDate, endDate);
    }
    
    /**
     * Contar ocorrências por tipo e período
     */
    @Transactional(readOnly = true)
    public long countOccurrencesByTypeAndPeriod(OperationalOccurrence.OccurrenceType type, 
                                               LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.countByTypeAndPeriod(type, startDate, endDate);
    }
    
    /**
     * Gerar próximo número de advertência
     */
    @Transactional(readOnly = true)
    public Integer generateNextWarningNumber() {
        // Buscar o maior número de advertência existente
        List<OperationalOccurrence> occurrences = occurrenceRepository.findAll();
        return occurrences.stream()
            .mapToInt(o -> o.getWarningNumber() != null ? o.getWarningNumber() : 0)
            .max()
            .orElse(0) + 1;
    }
}
