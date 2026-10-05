package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.CIPAMeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller CRUD de reuniões da CIPA (módulo SST).
 */
@RestController
@RequestMapping("/api/sst/cipa/meetings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SST CIPA - Reuniões", description = "API para gerenciamento de reuniões da CIPA")
public class CIPAMeetingController {

    private final CIPAMeetingService cipaMeetingService;
    private final AuthenticationService authenticationService;

    @GetMapping
    @Operation(summary = "Listar reuniões da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> findAll() {
        return ResponseEntity.ok(cipaMeetingService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar reunião da CIPA por ID")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(cipaMeetingService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Criar reunião da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body, Authentication authentication) {
        try {
            UUID userId = resolveUserId(authentication);
            return ResponseEntity.ok(cipaMeetingService.create(body, userId));
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação ao criar reunião CIPA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar reunião da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cipaMeetingService.update(id, body));
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação ao atualizar reunião CIPA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir reunião da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            cipaMeetingService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private UUID resolveUserId(Authentication authentication) {
        try {
            User user = authenticationService.getCurrentUser(authentication);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            log.warn("Não foi possível resolver usuário autenticado: {}", e.getMessage());
            return null;
        }
    }
}
