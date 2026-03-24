package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CorrectiveActionDTO;
import com.z7design.fleet_manager.dto.CreateCorrectiveActionDTO;
import com.z7design.fleet_manager.model.CorrectiveAction;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CorrectiveActionRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * ServiÃ§o para gerenciamento de aÃ§Ãµes corretivas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CorrectiveActionService {

    private final CorrectiveActionRepository actionRepository;
    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;

    /**
     * Cria uma nova aÃ§Ã£o corretiva
     */
    public CorrectiveAction createAction(CreateCorrectiveActionDTO dto, Authentication authentication) {
        log.info("Criando aÃ§Ã£o corretiva: {}", dto.getTitle());
        
        User currentUser = authenticationService.getCurrentUser(authentication);
        
        CorrectiveAction action = CorrectiveAction.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .origin(dto.getOrigin())
                .priority(dto.getPriority())
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDENTE")
                .dueDate(dto.getDueDate())
                .department(dto.getDepartment())
                .notes(dto.getNotes())
                .createdByUser(currentUser)
                .build();
        
        // Definir responsÃ¡vel
        if (dto.getResponsibleUserId() != null) {
            User responsible = userRepository.findById(dto.getResponsibleUserId())
                    .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado"));
            action.setResponsibleUser(responsible);
            action.setResponsibleName(responsible.getName());
        } else if (dto.getResponsibleName() != null && !dto.getResponsibleName().trim().isEmpty()) {
            action.setResponsibleName(dto.getResponsibleName());
        }
        
        // Relacionamentos opcionais
        // TODO: Implementar quando as entidades relacionadas estiverem disponÃ­veis
        
        return actionRepository.save(action);
    }

    /**
     * Busca todas as aÃ§Ãµes corretivas
     */
    @Transactional(readOnly = true)
    public List<CorrectiveAction> getAllActions() {
        return actionRepository.findAll();
    }

    /**
     * Busca aÃ§Ã£o por ID
     */
    @Transactional(readOnly = true)
    public CorrectiveAction getActionById(UUID id) {
        return actionRepository.findById(id).orElse(null);
    }

    /**
     * Atualiza aÃ§Ã£o corretiva
     */
    public CorrectiveAction updateAction(UUID id, CreateCorrectiveActionDTO dto) {
        log.info("Atualizando aÃ§Ã£o corretiva: {}", id);
        
        return actionRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(dto.getTitle());
                    existing.setDescription(dto.getDescription());
                    existing.setOrigin(dto.getOrigin());
                    existing.setPriority(dto.getPriority());
                    if (dto.getStatus() != null) {
                        existing.setStatus(dto.getStatus());
                    }
                    existing.setDueDate(dto.getDueDate());
                    existing.setDepartment(dto.getDepartment());
                    existing.setNotes(dto.getNotes());
                    
                    // Atualizar responsÃ¡vel
                    if (dto.getResponsibleUserId() != null) {
                        User responsible = userRepository.findById(dto.getResponsibleUserId())
                                .orElseThrow(() -> new IllegalArgumentException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado"));
                        existing.setResponsibleUser(responsible);
                        existing.setResponsibleName(responsible.getName());
                    } else if (dto.getResponsibleName() != null && !dto.getResponsibleName().trim().isEmpty()) {
                        existing.setResponsibleName(dto.getResponsibleName());
                        existing.setResponsibleUser(null);
                    }
                    
                    return actionRepository.save(existing);
                })
                .orElse(null);
    }

    /**
     * Marca aÃ§Ã£o como concluÃ­da
     */
    public CorrectiveAction completeAction(UUID id) {
        log.info("Concluindo aÃ§Ã£o corretiva: {}", id);
        
        return actionRepository.findById(id)
                .map(action -> {
                    action.setStatus("CONCLUIDA");
                    action.setCompletionDate(LocalDate.now());
                    return actionRepository.save(action);
                })
                .orElse(null);
    }

    /**
     * Exclui aÃ§Ã£o corretiva
     */
    public void deleteAction(UUID id) {
        log.info("Excluindo aÃ§Ã£o corretiva: {}", id);
        actionRepository.deleteById(id);
    }

    /**
     * Busca aÃ§Ãµes pendentes
     */
    @Transactional(readOnly = true)
    public List<CorrectiveAction> getPendingActions() {
        return actionRepository.findPendingActions();
    }

    /**
     * Busca aÃ§Ãµes vencidas
     */
    @Transactional(readOnly = true)
    public List<CorrectiveAction> getOverdueActions() {
        return actionRepository.findOverdueActions(LocalDate.now());
    }

    /**
     * Converte entidade para DTO
     */
    public CorrectiveActionDTO toDTO(CorrectiveAction action) {
        return CorrectiveActionDTO.builder()
                .id(action.getId())
                .title(action.getTitle())
                .description(action.getDescription())
                .origin(action.getOrigin())
                .priority(action.getPriority())
                .status(action.getStatus())
                .responsibleUserId(action.getResponsibleUser() != null ? action.getResponsibleUser().getId() : null)
                .responsibleName(action.getResponsibleName())
                .dueDate(action.getDueDate())
                .completionDate(action.getCompletionDate())
                .department(action.getDepartment())
                .notes(action.getNotes())
                .relatedInspectionId(action.getRelatedInspection() != null ? action.getRelatedInspection().getId() : null)
                .relatedAccidentId(action.getRelatedAccident() != null ? action.getRelatedAccident().getId() : null)
                .relatedNonConformityId(action.getRelatedNonConformity() != null ? action.getRelatedNonConformity().getId() : null)
                .createdByUserId(action.getCreatedByUser() != null ? action.getCreatedByUser().getId() : null)
                .createdAt(action.getCreatedAt())
                .updatedAt(action.getUpdatedAt())
                .build();
    }
}


