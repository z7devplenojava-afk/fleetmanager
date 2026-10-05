package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.CIPAMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller CRUD de membros da CIPA (módulo SST).
 */
@RestController
@RequestMapping("/api/sst/cipa/members")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SST CIPA", description = "API para gerenciamento de membros da CIPA")
public class CIPAMemberController {

    private final CIPAMemberService cipaMemberService;

    @GetMapping
    @Operation(summary = "Listar membros da CIPA", description = "Retorna todos os membros da CIPA (filtro opcional por ano de mandato)")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> findAll(
            @RequestParam(value = "mandateYear", required = false) Integer mandateYear) {
        List<Map<String, Object>> members = mandateYear != null
                ? cipaMemberService.findByMandateYear(mandateYear)
                : cipaMemberService.findAll();
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar membro da CIPA por ID")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(cipaMemberService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Criar membro da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cipaMemberService.create(body));
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação ao criar membro CIPA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar membro da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cipaMemberService.update(id, body));
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação ao atualizar membro CIPA: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover membro da CIPA")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            cipaMemberService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
