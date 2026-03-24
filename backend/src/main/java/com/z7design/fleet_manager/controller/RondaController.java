package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.enums.RondaPrioridade;
import com.z7design.fleet_manager.model.enums.RondaStatus;
import com.z7design.fleet_manager.model.enums.RondaTipo;
import com.z7design.fleet_manager.service.RondaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rondas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class RondaController {
    
    private final RondaService rondaService;
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<RondaDTO>> getAllRondas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "dataInicio") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        try {
            log.info("GET /api/rondas - pÃ¡gina: {}, tamanho: {}", page, size);
            Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") 
                    ? Sort.Direction.ASC 
                    : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            Page<RondaDTO> rondas = rondaService.findAll(pageable);
            log.info("âœ… Rondas retornadas: {} registros", rondas.getTotalElements());
            return ResponseEntity.ok(rondas);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar rondas", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
                log.error("âŒ Tipo da causa: {}", e.getCause().getClass().getName());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<Page<RondaDTO>> searchRondas(
            @RequestParam(required = false) RondaStatus status,
            @RequestParam(required = false) RondaTipo tipo,
            @RequestParam(required = false) RondaPrioridade prioridade,
            @RequestParam(required = false) UUID responsavelId,
            @RequestParam(required = false) UUID localId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("GET /api/rondas/search com filtros - status: {}, tipo: {}, prioridade: {}, searchTerm: {}", 
                    status, tipo, prioridade, searchTerm);
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dataInicio"));
            Page<RondaDTO> rondas = rondaService.search(
                    status, tipo, prioridade, responsavelId, localId,
                    dataInicio, dataFim, searchTerm, pageable);
            log.info("âœ… Rondas encontradas: {} registros", rondas.getTotalElements());
            return ResponseEntity.ok(rondas);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar rondas com filtros", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<RondaDTO> getRondaById(@PathVariable UUID id) {
        try {
            log.info("GET /api/rondas/{}", id);
            RondaDTO ronda = rondaService.findById(id);
            return ResponseEntity.ok(ronda);
        } catch (RuntimeException e) {
            log.error("Ronda nÃ£o encontrada: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('RONDA_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<RondaDTO> createRonda(@RequestBody CreateRondaDTO dto) {
        try {
            log.info("POST /api/rondas - criando ronda: {}", dto.getNome());
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUser = authentication != null ? authentication.getName() : "system";
            RondaDTO created = rondaService.create(dto, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Erro ao criar ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('RONDA_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<RondaDTO> updateRonda(@PathVariable UUID id, @RequestBody CreateRondaDTO dto) {
        try {
            log.info("PUT /api/rondas/{} - atualizando ronda", id);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUser = authentication != null ? authentication.getName() : "system";
            RondaDTO updated = rondaService.update(id, dto, currentUser);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Ronda nÃ£o encontrada: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao atualizar ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('RONDA_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<Void> deleteRonda(@PathVariable UUID id) {
        try {
            log.info("DELETE /api/rondas/{} - excluindo ronda", id);
            rondaService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Ronda nÃ£o encontrada: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erro ao excluir ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{id}/iniciar")
    @PreAuthorize("hasAnyAuthority('RONDA_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<RondaDTO> iniciarRonda(@PathVariable UUID id) {
        try {
            log.info("POST /api/rondas/{}/iniciar", id);
            RondaDTO ronda = rondaService.iniciar(id);
            return ResponseEntity.ok(ronda);
        } catch (RuntimeException e) {
            log.error("Erro ao iniciar ronda: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao iniciar ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{id}/concluir")
    @PreAuthorize("hasAnyAuthority('RONDA_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<RondaDTO> concluirRonda(
            @PathVariable UUID id,
            @RequestBody(required = false) ConcluirRondaRequest request) {
        try {
            log.info("POST /api/rondas/{}/concluir", id);
            String observacoes = request != null ? request.getObservacoes() : null;
            RondaDTO ronda = rondaService.concluir(id, observacoes);
            return ResponseEntity.ok(ronda);
        } catch (RuntimeException e) {
            log.error("Erro ao concluir ronda: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao concluir ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyAuthority('RONDA_WRITE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR')")
    public ResponseEntity<RondaDTO> cancelarRonda(
            @PathVariable UUID id,
            @RequestBody CancelarRondaRequest request) {
        try {
            log.info("POST /api/rondas/{}/cancelar", id);
            RondaDTO ronda = rondaService.cancelar(id, request.getMotivo());
            return ResponseEntity.ok(ronda);
        } catch (RuntimeException e) {
            log.error("Erro ao cancelar ronda: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao cancelar ronda", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<RondaStatsDTO> getStats() {
        try {
            log.info("GET /api/rondas/stats");
            RondaStatsDTO stats = rondaService.getStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erro ao buscar estatÃ­sticas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/enums/status")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<String>> getStatusOptions() {
        try {
            log.info("GET /api/rondas/enums/status");
            List<String> statuses = Arrays.stream(RondaStatus.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(statuses);
        } catch (Exception e) {
            log.error("Erro ao buscar opÃ§Ãµes de status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/enums/tipos")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<String>> getTipoOptions() {
        try {
            log.info("GET /api/rondas/enums/tipos");
            List<String> tipos = Arrays.stream(RondaTipo.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(tipos);
        } catch (Exception e) {
            log.error("Erro ao buscar opÃ§Ãµes de tipos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/enums/prioridades")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<String>> getPrioridadeOptions() {
        try {
            log.info("GET /api/rondas/enums/prioridades");
            List<String> prioridades = Arrays.stream(RondaPrioridade.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(prioridades);
        } catch (Exception e) {
            log.error("Erro ao buscar opÃ§Ãµes de prioridades", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/relatorio")
    @PreAuthorize("hasAnyAuthority('RONDA_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<RondaDTO>> getRondasRelatorio(
            @RequestParam(required = false) RondaStatus status,
            @RequestParam(required = false) RondaTipo tipo,
            @RequestParam(required = false) UUID responsavelId,
            @RequestParam(required = false) UUID localId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        try {
            log.info("GET /api/rondas/relatorio com filtros - status: {}, tipo: {}", status, tipo);
            List<RondaDTO> relatorio = rondaService.getRondasRelatorio(
                    status, tipo, responsavelId, localId, dataInicio, dataFim);
            log.info("âœ… RelatÃ³rio gerado com {} registros", relatorio.size());
            return ResponseEntity.ok(relatorio);
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar relatÃ³rio de rondas", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // DTOs auxiliares para requests
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ConcluirRondaRequest {
        private String observacoes;
    }
    
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CancelarRondaRequest {
        private String motivo;
    }
}


