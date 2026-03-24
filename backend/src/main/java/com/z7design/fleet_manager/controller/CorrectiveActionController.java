package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CorrectiveActionDTO;
import com.z7design.fleet_manager.dto.CreateCorrectiveActionDTO;
import com.z7design.fleet_manager.model.CorrectiveAction;
import com.z7design.fleet_manager.service.CorrectiveActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para gerenciamento de aÃ§Ãµes corretivas
 */
@RestController
@RequestMapping("/api/sst/corrective-actions")
@RequiredArgsConstructor
@Tag(name = "SST AÃ§Ãµes Corretivas", description = "API para gerenciamento de aÃ§Ãµes corretivas")
public class CorrectiveActionController {

    private final CorrectiveActionService actionService;

    @GetMapping
    @Operation(summary = "Listar aÃ§Ãµes corretivas", description = "Retorna todas as aÃ§Ãµes corretivas")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getAllActions() {
        List<CorrectiveAction> actions = actionService.getAllActions();
        List<CorrectiveActionDTO> dtos = actions.stream()
                .map(actionService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/pending")
    @Operation(summary = "Listar aÃ§Ãµes pendentes", description = "Retorna aÃ§Ãµes corretivas pendentes")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getPendingActions() {
        List<CorrectiveAction> actions = actionService.getPendingActions();
        List<CorrectiveActionDTO> dtos = actions.stream()
                .map(actionService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/overdue")
    @Operation(summary = "Listar aÃ§Ãµes vencidas", description = "Retorna aÃ§Ãµes corretivas vencidas")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<CorrectiveActionDTO>> getOverdueActions() {
        List<CorrectiveAction> actions = actionService.getOverdueActions();
        List<CorrectiveActionDTO> dtos = actions.stream()
                .map(actionService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar aÃ§Ã£o por ID", description = "Retorna uma aÃ§Ã£o corretiva especÃ­fica")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> getActionById(@PathVariable UUID id) {
        CorrectiveAction action = actionService.getActionById(id);
        if (action == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actionService.toDTO(action));
    }

    @PostMapping
    @Operation(summary = "Criar aÃ§Ã£o corretiva", description = "Cria uma nova aÃ§Ã£o corretiva")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> createAction(
            @RequestBody CreateCorrectiveActionDTO dto,
            Authentication authentication) {
        CorrectiveAction created = actionService.createAction(dto, authentication);
        return ResponseEntity.ok(actionService.toDTO(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar aÃ§Ã£o corretiva", description = "Atualiza uma aÃ§Ã£o corretiva existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> updateAction(
            @PathVariable UUID id,
            @RequestBody CreateCorrectiveActionDTO dto) {
        CorrectiveAction updated = actionService.updateAction(id, dto);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actionService.toDTO(updated));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Concluir aÃ§Ã£o corretiva", description = "Marca uma aÃ§Ã£o corretiva como concluÃ­da")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<CorrectiveActionDTO> completeAction(@PathVariable UUID id) {
        CorrectiveAction completed = actionService.completeAction(id);
        if (completed == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actionService.toDTO(completed));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir aÃ§Ã£o corretiva", description = "Exclui uma aÃ§Ã£o corretiva")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteAction(@PathVariable UUID id) {
        actionService.deleteAction(id);
        return ResponseEntity.noContent().build();
    }
}





