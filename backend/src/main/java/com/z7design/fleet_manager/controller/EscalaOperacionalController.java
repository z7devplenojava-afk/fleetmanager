package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EscalaOperacionalDTO;
import com.z7design.fleet_manager.model.EscalaOperacional;
import com.z7design.fleet_manager.service.EscalaOperacionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Escalas operacionais: agenda diaria de partidas por linha (PRD Viasao Sao Silvestre - Fase 2).
 */
@RestController
@RequestMapping("/api/escalas")
@RequiredArgsConstructor
public class EscalaOperacionalController {

    private static final String READ_AUTH =
            "hasAnyAuthority('TRAFFIC_MANAGEMENT_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', "
                    + "'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')";
    private static final String WRITE_AUTH =
            "hasAnyAuthority('TRAFFIC_MANAGEMENT_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', "
                    + "'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')";

    private final EscalaOperacionalService escalaService;

    @GetMapping
    @PreAuthorize(READ_AUTH)
    public ResponseEntity<List<EscalaOperacionalDTO>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(escalaService.findAll(date));
    }

    @GetMapping("/{id}")
    @PreAuthorize(READ_AUTH)
    public ResponseEntity<EscalaOperacionalDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(escalaService.findById(id));
    }

    @PostMapping
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<EscalaOperacionalDTO> create(@RequestBody EscalaOperacional escala) {
        return ResponseEntity.ok(escalaService.create(escala));
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<EscalaOperacionalDTO> update(@PathVariable UUID id,
                                                       @RequestBody EscalaOperacional escala) {
        return ResponseEntity.ok(escalaService.update(id, escala));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        escalaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Dry-run: retorna {violacoes, alertas} sem gravar. */
    @PostMapping("/validate")
    @PreAuthorize(READ_AUTH)
    public ResponseEntity<Map<String, List<String>>> validate(@RequestBody EscalaOperacional escala) {
        return ResponseEntity.ok(escalaService.validate(escala));
    }

    /** Gera as escalas do dia a partir dos horarios ativos. */
    @PostMapping("/generate/{date}")
    @PreAuthorize(WRITE_AUTH)
    public ResponseEntity<Map<String, Object>> generate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(escalaService.generate(date));
    }
}
