package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.OperationalOccurrenceService;

import br.com.fleetmanager.model.OperationalOccurrence;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operational/occurrences")
@RequiredArgsConstructor
@Slf4j
public class OperationalOccurrenceController {
    
    private final OperationalOccurrenceService occurrenceService;
    
    /**
     * Criar nova ocorrência operacional
     */
    @PostMapping
    public ResponseEntity<OperationalOccurrence> createOccurrence(@RequestBody OperationalOccurrence occurrence) {
        log.info("POST /api/operational/occurrences - Criando nova ocorrência");
        
        try {
            OperationalOccurrence createdOccurrence = occurrenceService.createOccurrence(occurrence);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOccurrence);
        } catch (Exception e) {
            log.error("Erro ao criar ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrência por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OperationalOccurrence> getOccurrenceById(@PathVariable UUID id) {
        log.info("GET /api/operational/occurrences/{} - Buscando ocorrência por ID", id);
        
        try {
            OperationalOccurrence occurrence = occurrenceService.getOccurrenceById(id);
            return ResponseEntity.ok(occurrence);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Listar todas as ocorrências
     */
    @GetMapping
    public ResponseEntity<List<OperationalOccurrence>> getAllOccurrences() {
        log.info("GET /api/operational/occurrences - Listando todas as ocorrências");
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getAllOccurrences();
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao listar ocorrências: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por funcionário
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByEmployee(@PathVariable UUID employeeId) {
        log.info("GET /api/operational/occurrences/employee/{} - Buscando ocorrências por funcionário", employeeId);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByEmployee(employeeId);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por funcionário: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por tipo
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByType(@PathVariable String type) {
        log.info("GET /api/operational/occurrences/type/{} - Buscando ocorrências por tipo", type);
        
        try {
            OperationalOccurrence.OccurrenceType occurrenceType = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByType(occurrenceType);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Tipo inválido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por tipo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByStatus(@PathVariable String status) {
        log.info("GET /api/operational/occurrences/status/{} - Buscando ocorrências por status", status);
        
        try {
            OperationalOccurrence.OccurrenceStatus occurrenceStatus = OperationalOccurrence.OccurrenceStatus.valueOf(status.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByStatus(occurrenceStatus);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Status inválido: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por status: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por prioridade
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByPriority(@PathVariable String priority) {
        log.info("GET /api/operational/occurrences/priority/{} - Buscando ocorrências por prioridade", priority);
        
        try {
            OperationalOccurrence.OccurrencePriority occurrencePriority = OperationalOccurrence.OccurrencePriority.valueOf(priority.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByPriority(occurrencePriority);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade inválida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por prioridade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por período
     */
    @GetMapping("/period")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/period - Buscando ocorrências por período: {} a {}", startDate, endDate);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByPeriod(startDate, endDate);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por período: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências pendentes
     */
    @GetMapping("/pending")
    public ResponseEntity<List<OperationalOccurrence>> getPendingOccurrences() {
        log.info("GET /api/operational/occurrences/pending - Buscando ocorrências pendentes");
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getPendingOccurrences();
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências pendentes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências não resolvidas por funcionário
     */
    @GetMapping("/unresolved/employee/{employeeId}")
    public ResponseEntity<List<OperationalOccurrence>> getUnresolvedOccurrencesByEmployee(@PathVariable UUID employeeId) {
        log.info("GET /api/operational/occurrences/unresolved/employee/{} - Buscando ocorrências não resolvidas", employeeId);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getUnresolvedOccurrencesByEmployee(employeeId);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências não resolvidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por responsável
     */
    @GetMapping("/responsible")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByResponsible(@RequestParam String responsible) {
        log.info("GET /api/operational/occurrences/responsible - Buscando ocorrências por responsável: {}", responsible);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByResponsible(responsible);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por responsável: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrências por local
     */
    @GetMapping("/location")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByLocation(@RequestParam String location) {
        log.info("GET /api/operational/occurrences/location - Buscando ocorrências por local: {}", location);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByLocation(location);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrências por local: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrência por número de advertência
     */
    @GetMapping("/warning/{warningNumber}")
    public ResponseEntity<OperationalOccurrence> getOccurrenceByWarningNumber(@PathVariable Integer warningNumber) {
        log.info("GET /api/operational/occurrences/warning/{} - Buscando ocorrência por número de advertência", warningNumber);
        
        try {
            OperationalOccurrence occurrence = occurrenceService.getOccurrenceByWarningNumber(warningNumber);
            return ResponseEntity.ok(occurrence);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrência por número de advertência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar ocorrência existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<OperationalOccurrence> updateOccurrence(@PathVariable UUID id, 
                                                                @RequestBody OperationalOccurrence occurrenceDetails) {
        log.info("PUT /api/operational/occurrences/{} - Atualizando ocorrência", id);
        
        try {
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrence(id, occurrenceDetails);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (Exception e) {
            log.error("Erro ao atualizar ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar status da ocorrência
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OperationalOccurrence> updateOccurrenceStatus(@PathVariable UUID id, 
                                                                      @RequestParam String newStatus) {
        log.info("PATCH /api/operational/occurrences/{}/status - Atualizando status da ocorrência para {}", id, newStatus);
        
        try {
            OperationalOccurrence.OccurrenceStatus occurrenceStatus = OperationalOccurrence.OccurrenceStatus.valueOf(newStatus.toUpperCase());
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrenceStatus(id, occurrenceStatus);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (IllegalArgumentException e) {
            log.error("Status inválido: {}", newStatus);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao atualizar status da ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar prioridade da ocorrência
     */
    @PatchMapping("/{id}/priority")
    public ResponseEntity<OperationalOccurrence> updateOccurrencePriority(@PathVariable UUID id, 
                                                                        @RequestParam String newPriority) {
        log.info("PATCH /api/operational/occurrences/{}/priority - Atualizando prioridade da ocorrência para {}", id, newPriority);
        
        try {
            OperationalOccurrence.OccurrencePriority occurrencePriority = OperationalOccurrence.OccurrencePriority.valueOf(newPriority.toUpperCase());
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrencePriority(id, occurrencePriority);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade inválida: {}", newPriority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao atualizar prioridade da ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar ocorrência
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOccurrence(@PathVariable UUID id) {
        log.info("DELETE /api/operational/occurrences/{} - Deletando ocorrência", id);
        
        try {
            occurrenceService.deleteOccurrence(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar ocorrência: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar ocorrências por funcionário e período
     */
    @GetMapping("/count/employee/{employeeId}")
    public ResponseEntity<Long> countOccurrencesByEmployeeAndPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/count/employee/{} - Contando ocorrências por funcionário e período", employeeId);
        
        try {
            long count = occurrenceService.countOccurrencesByEmployeeAndPeriod(employeeId, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar ocorrências: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar ocorrências por tipo e período
     */
    @GetMapping("/count/type/{type}")
    public ResponseEntity<Long> countOccurrencesByTypeAndPeriod(
            @PathVariable String type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/count/type/{} - Contando ocorrências por tipo e período", type);
        
        try {
            OperationalOccurrence.OccurrenceType occurrenceType = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
            long count = occurrenceService.countOccurrencesByTypeAndPeriod(occurrenceType, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            log.error("Tipo inválido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao contar ocorrências: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Gerar próximo número de advertência
     */
    @GetMapping("/next-warning-number")
    public ResponseEntity<Integer> generateNextWarningNumber() {
        log.info("GET /api/operational/occurrences/next-warning-number - Gerando próximo número de advertência");
        
        try {
            Integer nextNumber = occurrenceService.generateNextWarningNumber();
            return ResponseEntity.ok(nextNumber);
        } catch (Exception e) {
            log.error("Erro ao gerar próximo número de advertência: {}", e.getMessage(), e);
            throw e;
        }
    }
}
