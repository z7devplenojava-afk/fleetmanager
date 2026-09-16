package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CorrectiveActionDTO;
import com.z7design.fleet_manager.dto.CreateCorrectiveActionDTO;
import com.z7design.fleet_manager.model.CorrectiveAction;
import com.z7design.fleet_manager.service.CorrectiveActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para gerenciamento de aÃ§Ãµes corretivas
 */
@RestController
@RequestMapping({"/api/sst/corrective-actions", "/sst/corrective-actions"})
@CrossOrigin(origins = "*")
public class CorrectiveActionController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CorrectiveActionController.class);

    private final CorrectiveActionService actionService;

    @Autowired
    public CorrectiveActionController(CorrectiveActionService actionService) {
        this.actionService = actionService;
    }

    @GetMapping
    @Operation(summary = "Listar ações corretivas", description = "Retorna todas as ações corretivas")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getAllActions() {
        try {
            List<CorrectiveAction> actions = actionService.getAllActions();
            if (actions == null) {
                return ResponseEntity.ok(List.of());
            }
            List<CorrectiveActionDTO> dtos = actions.stream()
                    .map(actionService::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Erro ao listar ações corretivas: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/pending")
    @Operation(summary = "Listar ações pendentes", description = "Retorna ações corretivas pendentes")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getPendingActions() {
        try {
            List<CorrectiveAction> actions = actionService.getPendingActions();
            if (actions == null) {
                return ResponseEntity.ok(List.of());
            }
            List<CorrectiveActionDTO> dtos = actions.stream()
                    .map(actionService::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Erro ao listar ações pendentes: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/overdue")
    @Operation(summary = "Listar ações vencidas", description = "Retorna ações corretivas vencidas")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getOverdueActions() {
        try {
            List<CorrectiveAction> actions = actionService.getOverdueActions();
            if (actions == null) {
                return ResponseEntity.ok(List.of());
            }
            List<CorrectiveActionDTO> dtos = actions.stream()
                    .map(actionService::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Erro ao listar ações vencidas: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar aÃ§Ã£o por ID", description = "Retorna uma aÃ§Ã£o corretiva especÃ­fica")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> getActionById(@PathVariable("id") UUID id) {
        try {
            CorrectiveAction action = actionService.getActionById(id);
            if (action == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(actionService.toDTO(action));
        } catch (Exception e) {
            log.error("Erro ao buscar ação corretiva {}: {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @Operation(summary = "Criar aÃ§Ã£o corretiva", description = "Cria uma nova aÃ§Ã£o corretiva")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> createAction(
            @RequestBody CreateCorrectiveActionDTO dto,
            Authentication authentication) {
        try {
            CorrectiveAction created = actionService.createAction(dto, authentication);
            return ResponseEntity.ok(actionService.toDTO(created));
        } catch (Exception e) {
            log.error("Erro ao criar ação corretiva: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar aÃ§Ã£o corretiva", description = "Atualiza uma aÃ§Ã£o corretiva existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> updateAction(
            @PathVariable("id") UUID id,
            @RequestBody CreateCorrectiveActionDTO dto) {
        try {
            CorrectiveAction updated = actionService.updateAction(id, dto);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(actionService.toDTO(updated));
        } catch (Exception e) {
            log.error("Erro ao atualizar ação corretiva {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Concluir aÃ§Ã£o corretiva", description = "Marca uma aÃ§Ã£o corretiva como concluÃ­da")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> completeAction(@PathVariable("id") UUID id) {
        try {
            CorrectiveAction completed = actionService.completeAction(id);
            if (completed == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(actionService.toDTO(completed));
        } catch (Exception e) {
            log.error("Erro ao concluir ação corretiva {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir aÃ§Ã£o corretiva", description = "Exclui uma aÃ§Ã£o corretiva")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteAction(@PathVariable("id") UUID id) {
        try {
            actionService.deleteAction(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir ação corretiva {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}





