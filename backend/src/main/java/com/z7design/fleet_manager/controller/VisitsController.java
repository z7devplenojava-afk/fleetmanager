package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateVisitDTO;
import com.z7design.fleet_manager.dto.VisitDTO;
import com.z7design.fleet_manager.service.VisitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/visits")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class VisitsController {

    private final VisitService visitService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<VisitDTO>> getAllVisits(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sortBy", defaultValue = "visitDate") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "DESC") String sortDirection) {
        try {
            log.info("ðŸ” GET /api/visits - pÃ¡gina: {}, tamanho: {}, ordenar por: {}", page, size, sortBy);

            Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC")
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;

            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<VisitDTO> visits = visitService.findAll(pageable);

            log.info("âœ… Visitas encontradas: {} registros", visits.getTotalElements());
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar visitas", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<VisitDTO> getVisitById(@PathVariable(name = "id") UUID id) {
        try {
            VisitDTO visit = visitService.findById(id);
            return ResponseEntity.ok(visit);
        } catch (RuntimeException e) {
            log.error("Erro ao buscar visita por ID: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao buscar visita por ID", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('VISITS_CREATE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<?> createVisit(@RequestBody CreateVisitDTO createVisitDTO) {
        try {
            log.info("Criando nova visita para supervisor: {}", createVisitDTO.getSupervisorId());
            log.debug("Dados da visita: {}", createVisitDTO);

            // Obter email do usuÃ¡rio atual
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication != null ? authentication.getName() : "system";

            VisitDTO savedVisit = visitService.create(createVisitDTO, currentUserEmail);
            return ResponseEntity.status(201).body(savedVisit);
        } catch (RuntimeException e) {
            log.error("Erro ao criar visita: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", "Erro ao criar visita",
                    "message", e.getMessage(),
                    "details", e.getClass().getSimpleName()));
        } catch (Exception e) {
            log.error("Erro inesperado ao criar visita", e);
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", "Erro inesperado ao criar visita",
                    "message", e.getMessage(),
                    "details", e.getClass().getSimpleName()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('VISITS_UPDATE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<VisitDTO> updateVisit(@PathVariable(name = "id") UUID id,
            @RequestBody CreateVisitDTO updateDTO) {
        try {
            log.info("Atualizando visita: {}", id);

            // Obter email do usuÃ¡rio atual
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication != null ? authentication.getName() : "system";

            VisitDTO updatedVisit = visitService.update(id, updateDTO, currentUserEmail);
            return ResponseEntity.ok(updatedVisit);
        } catch (Exception e) {
            log.error("Erro ao atualizar visita", e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('VISITS_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Void> deleteVisit(@PathVariable(name = "id") UUID id) {
        try {
            visitService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erro ao deletar visita: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao deletar visita", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/supervisor/{supervisorId}")
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<VisitDTO>> getVisitsBySupervisor(
            @PathVariable(name = "supervisorId") UUID supervisorId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        try {
            log.info("Buscando visitas do supervisor: {}", supervisorId);
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "visitDate"));
            Page<VisitDTO> visits = visitService.findBySupervisorId(supervisorId, pageable);
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            log.error("Erro ao buscar visitas do supervisor", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<VisitDTO>> getVisitsByDateRange(
            @RequestParam(name = "startDate") String startDate,
            @RequestParam(name = "endDate") String endDate,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        try {
            log.info("Buscando visitas entre {} e {}", startDate, endDate);
            Pageable pageable = PageRequest.of(page, size);
            java.time.LocalDate start = java.time.LocalDate.parse(startDate);
            java.time.LocalDate end = java.time.LocalDate.parse(endDate);
            Page<VisitDTO> visits = visitService.findByVisitDateBetween(start, end, pageable);
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            log.error("Erro ao buscar visitas por data", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/today/scheduled")
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<VisitDTO>> getTodayScheduledVisits() {
        try {
            log.info("Buscando visitas agendadas para hoje");
            List<VisitDTO> visits = visitService.findScheduledVisitsForToday();
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            log.error("Erro ao buscar visitas de hoje", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/today/supervisor/{supervisorId}")
    @PreAuthorize("hasAnyAuthority('VISITS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<VisitDTO>> getTodayVisitsBySupervisor(
            @PathVariable(name = "supervisorId") UUID supervisorId) {
        try {
            log.info("Buscando visitas de hoje do supervisor: {}", supervisorId);
            List<VisitDTO> visits = visitService.findSupervisorVisitsForToday(supervisorId);
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            log.error("Erro ao buscar visitas de hoje do supervisor", e);
            return ResponseEntity.status(500).build();
        }
    }
}
