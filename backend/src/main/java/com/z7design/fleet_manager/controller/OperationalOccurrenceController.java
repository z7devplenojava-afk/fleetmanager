package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.OperationalOccurrence;
import com.z7design.fleet_manager.service.OperationalOccurrenceService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operational/occurrences")
@RequiredArgsConstructor
@Slf4j
public class OperationalOccurrenceController {
    
    private final OperationalOccurrenceService occurrenceService;
    
    /**
     * Criar nova ocorrÃªncia operacional
     */
    @PostMapping
    public ResponseEntity<OperationalOccurrence> createOccurrence(@RequestBody OperationalOccurrence occurrence) {
        log.info("POST /api/operational/occurrences - Criando nova ocorrÃªncia");
        
        try {
            OperationalOccurrence createdOccurrence = occurrenceService.createOccurrence(occurrence);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOccurrence);
        } catch (Exception e) {
            log.error("Erro ao criar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncia por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OperationalOccurrence> getOccurrenceById(@PathVariable("id") UUID id) {
        log.info("GET /api/operational/occurrences/{} - Buscando ocorrÃªncia por ID", id);
        
        try {
            OperationalOccurrence occurrence = occurrenceService.getOccurrenceById(id);
            return ResponseEntity.ok(occurrence);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Listar todas as ocorrÃªncias
     */
    @GetMapping
    public ResponseEntity<List<OperationalOccurrence>> getAllOccurrences() {
        log.info("GET /api/operational/occurrences - Listando todas as ocorrÃªncias");
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getAllOccurrences();
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao listar ocorrÃªncias: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por funcionÃ¡rio
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByEmployee(@PathVariable("employeeId") UUID employeeId) {
        log.info("GET /api/operational/occurrences/employee/{} - Buscando ocorrÃªncias por funcionÃ¡rio", employeeId);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByEmployee(employeeId);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por funcionÃ¡rio: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por tipo
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByType(@PathVariable("type") String type) {
        log.info("GET /api/operational/occurrences/type/{} - Buscando ocorrÃªncias por tipo", type);
        
        try {
            OperationalOccurrence.OccurrenceType occurrenceType = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByType(occurrenceType);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Tipo invÃ¡lido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por tipo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByStatus(@PathVariable("status") String status) {
        log.info("GET /api/operational/occurrences/status/{} - Buscando ocorrÃªncias por status", status);
        
        try {
            OperationalOccurrence.OccurrenceStatus occurrenceStatus = OperationalOccurrence.OccurrenceStatus.valueOf(status.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByStatus(occurrenceStatus);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Status invÃ¡lido: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por status: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por prioridade
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByPriority(@PathVariable("priority") String priority) {
        log.info("GET /api/operational/occurrences/priority/{} - Buscando ocorrÃªncias por prioridade", priority);
        
        try {
            OperationalOccurrence.OccurrencePriority occurrencePriority = OperationalOccurrence.OccurrencePriority.valueOf(priority.toUpperCase());
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByPriority(occurrencePriority);
            return ResponseEntity.ok(occurrences);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade invÃ¡lida: {}", priority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por prioridade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por perÃ­odo
     */
    @GetMapping("/period")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByPeriod(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/period - Buscando ocorrÃªncias por perÃ­odo: {} a {}", startDate, endDate);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByPeriod(startDate, endDate);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por perÃ­odo: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias pendentes
     */
    @GetMapping("/pending")
    public ResponseEntity<List<OperationalOccurrence>> getPendingOccurrences() {
        log.info("GET /api/operational/occurrences/pending - Buscando ocorrÃªncias pendentes");
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getPendingOccurrences();
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias pendentes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias nÃ£o resolvidas por funcionÃ¡rio
     */
    @GetMapping("/unresolved/employee/{employeeId}")
    public ResponseEntity<List<OperationalOccurrence>> getUnresolvedOccurrencesByEmployee(@PathVariable("employeeId") UUID employeeId) {
        log.info("GET /api/operational/occurrences/unresolved/employee/{} - Buscando ocorrÃªncias nÃ£o resolvidas", employeeId);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getUnresolvedOccurrencesByEmployee(employeeId);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias nÃ£o resolvidas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por responsÃ¡vel
     */
    @GetMapping("/responsible")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByResponsible(@RequestParam(value = "responsible") String responsible) {
        log.info("GET /api/operational/occurrences/responsible - Buscando ocorrÃªncias por responsÃ¡vel: {}", responsible);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByResponsible(responsible);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por responsÃ¡vel: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncias por local
     */
    @GetMapping("/location")
    public ResponseEntity<List<OperationalOccurrence>> getOccurrencesByLocation(@RequestParam(value = "location") String location) {
        log.info("GET /api/operational/occurrences/location - Buscando ocorrÃªncias por local: {}", location);
        
        try {
            List<OperationalOccurrence> occurrences = occurrenceService.getOccurrencesByLocation(location);
            return ResponseEntity.ok(occurrences);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncias por local: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar ocorrÃªncia por nÃºmero de advertÃªncia
     */
    @GetMapping("/warning/{warningNumber}")
    public ResponseEntity<OperationalOccurrence> getOccurrenceByWarningNumber(@PathVariable("warningNumber") Integer warningNumber) {
        log.info("GET /api/operational/occurrences/warning/{} - Buscando ocorrÃªncia por nÃºmero de advertÃªncia", warningNumber);
        
        try {
            OperationalOccurrence occurrence = occurrenceService.getOccurrenceByWarningNumber(warningNumber);
            return ResponseEntity.ok(occurrence);
        } catch (Exception e) {
            log.error("Erro ao buscar ocorrÃªncia por nÃºmero de advertÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar ocorrÃªncia existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<OperationalOccurrence> updateOccurrence(@PathVariable("id") UUID id, 
                                                                @RequestBody OperationalOccurrence occurrenceDetails) {
        log.info("PUT /api/operational/occurrences/{} - Atualizando ocorrÃªncia", id);
        
        try {
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrence(id, occurrenceDetails);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (Exception e) {
            log.error("Erro ao atualizar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar status da ocorrÃªncia
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OperationalOccurrence> updateOccurrenceStatus(@PathVariable("id") UUID id, 
                                                                      @RequestParam(value = "newStatus") String newStatus) {
        log.info("PATCH /api/operational/occurrences/{}/status - Atualizando status da ocorrÃªncia para {}", id, newStatus);
        
        try {
            OperationalOccurrence.OccurrenceStatus occurrenceStatus = OperationalOccurrence.OccurrenceStatus.valueOf(newStatus.toUpperCase());
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrenceStatus(id, occurrenceStatus);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (IllegalArgumentException e) {
            log.error("Status invÃ¡lido: {}", newStatus);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao atualizar status da ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar prioridade da ocorrÃªncia
     */
    @PatchMapping("/{id}/priority")
    public ResponseEntity<OperationalOccurrence> updateOccurrencePriority(@PathVariable("id") UUID id, 
                                                                        @RequestParam(value = "newPriority") String newPriority) {
        log.info("PATCH /api/operational/occurrences/{}/priority - Atualizando prioridade da ocorrÃªncia para {}", id, newPriority);
        
        try {
            OperationalOccurrence.OccurrencePriority occurrencePriority = OperationalOccurrence.OccurrencePriority.valueOf(newPriority.toUpperCase());
            OperationalOccurrence updatedOccurrence = occurrenceService.updateOccurrencePriority(id, occurrencePriority);
            return ResponseEntity.ok(updatedOccurrence);
        } catch (IllegalArgumentException e) {
            log.error("Prioridade invÃ¡lida: {}", newPriority);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao atualizar prioridade da ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar ocorrÃªncia
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOccurrence(@PathVariable("id") UUID id) {
        log.info("DELETE /api/operational/occurrences/{} - Deletando ocorrÃªncia", id);
        
        try {
            occurrenceService.deleteOccurrence(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar ocorrÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar ocorrÃªncias por funcionÃ¡rio e perÃ­odo
     */
    @GetMapping("/count/employee/{employeeId}")
    public ResponseEntity<Long> countOccurrencesByEmployeeAndPeriod(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/count/employee/{} - Contando ocorrÃªncias por funcionÃ¡rio e perÃ­odo", employeeId);
        
        try {
            long count = occurrenceService.countOccurrencesByEmployeeAndPeriod(employeeId, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar ocorrÃªncias: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar ocorrÃªncias por tipo e perÃ­odo
     */
    @GetMapping("/count/type/{type}")
    public ResponseEntity<Long> countOccurrencesByTypeAndPeriod(
            @PathVariable("type") String type,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/operational/occurrences/count/type/{} - Contando ocorrÃªncias por tipo e perÃ­odo", type);
        
        try {
            OperationalOccurrence.OccurrenceType occurrenceType = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
            long count = occurrenceService.countOccurrencesByTypeAndPeriod(occurrenceType, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            log.error("Tipo invÃ¡lido: {}", type);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao contar ocorrÃªncias: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Gerar prÃ³ximo nÃºmero de advertÃªncia
     */
    @GetMapping("/next-warning-number")
    public ResponseEntity<Integer> generateNextWarningNumber() {
        log.info("GET /api/operational/occurrences/next-warning-number - Gerando prÃ³ximo nÃºmero de advertÃªncia");
        
        try {
            Integer nextNumber = occurrenceService.generateNextWarningNumber();
            return ResponseEntity.ok(nextNumber);
        } catch (Exception e) {
            log.error("Erro ao gerar prÃ³ximo nÃºmero de advertÃªncia: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gerar relatÃ³rio PDF de ocorrÃªncias
     */
    @GetMapping(value = "/report/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Gerar relatÃ³rio PDF de ocorrÃªncias", description = "Gera relatÃ³rio PDF filtrado por funcionÃ¡rio, tipo, status, prioridade, data, responsÃ¡vel e local")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "responsible", required = false) String responsible,
            @RequestParam(value = "location", required = false) String location) {
        try {
            OperationalOccurrence.OccurrenceType typeEnum = null;
            if (type != null && !type.isEmpty() && !"all".equals(type)) {
                try {
                    typeEnum = OperationalOccurrence.OccurrenceType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Tipo invÃ¡lido: {}", type);
                }
            }

            OperationalOccurrence.OccurrenceStatus statusEnum = null;
            if (status != null && !status.isEmpty() && !"all".equals(status)) {
                try {
                    statusEnum = OperationalOccurrence.OccurrenceStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Status invÃ¡lido: {}", status);
                }
            }

            OperationalOccurrence.OccurrencePriority priorityEnum = null;
            if (priority != null && !priority.isEmpty() && !"all".equals(priority)) {
                try {
                    priorityEnum = OperationalOccurrence.OccurrencePriority.valueOf(priority.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Prioridade invÃ¡lida: {}", priority);
                }
            }

            byte[] pdfBytes = occurrenceService.generatePDFReport(employeeId, typeEnum, statusEnum, priorityEnum,
                    startDate, endDate, responsible, location);
            String fileName = "relatorio-ocorrencias-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de ocorrÃªncias: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

