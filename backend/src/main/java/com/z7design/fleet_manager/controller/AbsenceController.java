package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Absence;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.dto.AbsenceDTO;
import com.z7design.fleet_manager.dto.AbsenceResponse;
import com.z7design.fleet_manager.service.AbsenceService;
import com.z7design.fleet_manager.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/absences")
@CrossOrigin(origins = "*")
public class AbsenceController {

    private static final Logger log = LoggerFactory.getLogger(AbsenceController.class);

    @Autowired
    private AbsenceService absenceService;

    @Autowired
    private EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<AbsenceResponse>> getAllAbsences() {
        try {
            log.info("GET /api/absences - Buscando todas as faltas");
            List<Absence> absences = absenceService.getAllAbsences();
            List<AbsenceResponse> absenceResponses = absences.stream()
                    .map(AbsenceResponse::fromEntity)
                    .toList();
            log.info("âœ… Faltas retornadas: {} registros", absenceResponses.size());
            return ResponseEntity.ok(absenceResponses);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar faltas", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AbsenceResponse> getAbsenceById(@PathVariable UUID id) {
        return absenceService.getAbsenceById(id)
                .map(absence -> ResponseEntity.ok(AbsenceResponse.fromEntity(absence)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByEmployee(@PathVariable UUID employeeId) {
        List<Absence> absences = absenceService.getAbsencesByEmployee(employeeId);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByDate(@PathVariable LocalDate date) {
        List<Absence> absences = absenceService.getAbsencesByDate(date);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByStatus(@PathVariable Absence.AbsenceStatus status) {
        List<Absence> absences = absenceService.getAbsencesByStatus(status);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/absence-type/{absenceType}")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByType(@PathVariable Absence.AbsenceType absenceType) {
        List<Absence> absences = absenceService.getAbsencesByType(absenceType);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<Absence> absences = absenceService.getAbsencesByDateRange(startDate, endDate);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/employee/{employeeId}/date-range")
    public ResponseEntity<List<AbsenceResponse>> getAbsencesByEmployeeAndDateRange(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<Absence> absences = absenceService.getAbsencesByEmployeeAndDateRange(employeeId, startDate, endDate);
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<AbsenceResponse>> getPendingAbsences() {
        List<Absence> absences = absenceService.getPendingAbsences();
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/today")
    public ResponseEntity<List<AbsenceResponse>> getTodayAbsences() {
        List<Absence> absences = absenceService.getTodayAbsences();
        List<AbsenceResponse> absenceResponses = absences.stream()
                .map(AbsenceResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(absenceResponses);
    }

    @GetMapping("/employee/{employeeId}/count")
    public ResponseEntity<Long> getEmployeeAbsenceCount(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        Long count = absenceService.getEmployeeAbsenceCount(employeeId, startDate, endDate);
        return ResponseEntity.ok(count);
    }

    @PostMapping
    public ResponseEntity<?> createAbsence(@RequestBody AbsenceDTO absenceDTO) {
        try {
            // ValidaÃ§Ãµes
            if (absenceDTO.getEmployeeId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "ID do funcionÃ¡rio Ã© obrigatÃ³rio"));
            }

            if (absenceDTO.getAbsenceDate() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Data da falta Ã© obrigatÃ³ria"));
            }

            if (absenceDTO.getReason() == null || absenceDTO.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Motivo da falta Ã© obrigatÃ³rio"));
            }

            // Buscar o funcionÃ¡rio pelo ID
            Employee employee = employeeService.findById(absenceDTO.getEmployeeId());
            if (employee == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "FuncionÃ¡rio nÃ£o encontrado"));
            }

            Absence absence = absenceDTO.toEntity();
            absence.setEmployee(employee);

            // Buscar funcionÃ¡rio de cobertura se fornecido
            if (absenceDTO.getCoverageEmployeeId() != null) {
                Employee coverageEmployee = employeeService.findById(absenceDTO.getCoverageEmployeeId());
                if (coverageEmployee != null) {
                    absence.setCoverageEmployee(coverageEmployee);
                }
            }

            Absence createdAbsence = absenceService.createAbsence(absence);
            return ResponseEntity.ok(AbsenceResponse.fromEntity(createdAbsence));
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Erro ao criar falta: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erro interno ao criar falta: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AbsenceResponse> updateAbsence(@PathVariable UUID id, @RequestBody AbsenceDTO absenceDTO) {
        try {
            log.info("ðŸ”„ Atualizando afastamento {} com dados: absenceType={}, status={}, reason={}",
                    id, absenceDTO.getAbsenceType(), absenceDTO.getStatus(), absenceDTO.getReason());

            // Buscar o funcionÃ¡rio pelo ID
            Employee employee = employeeService.findById(absenceDTO.getEmployeeId());
            Absence absence = absenceDTO.toEntity();
            absence.setEmployee(employee);

            // Log para debug
            log.info("ðŸ“ Absence entity criado com absenceType: {}", absence.getAbsenceType());

            // Buscar funcionÃ¡rio de cobertura se fornecido
            if (absenceDTO.getCoverageEmployeeId() != null) {
                Employee coverageEmployee = employeeService.findById(absenceDTO.getCoverageEmployeeId());
                absence.setCoverageEmployee(coverageEmployee);
            }

            Absence updatedAbsence = absenceService.updateAbsence(id, absence);
            log.info("âœ… Afastamento atualizado com sucesso. Novo absenceType: {}", updatedAbsence.getAbsenceType());
            return ResponseEntity.ok(AbsenceResponse.fromEntity(updatedAbsence));
        } catch (RuntimeException e) {
            log.error("âŒ Erro ao atualizar afastamento {}: {}", id, e.getMessage(), e);
            e.printStackTrace(); // Log para debug
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Absence> updateStatus(@PathVariable UUID id, @RequestParam Absence.AbsenceStatus status) {
        try {
            Absence updatedAbsence = absenceService.updateStatus(id, status);
            return ResponseEntity.ok(updatedAbsence);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAbsence(@PathVariable UUID id) {
        try {
            absenceService.deleteAbsence(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AbsenceResponse> approveAbsence(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request) {
        try {
            Absence absence = absenceService.approveAbsence(id, request != null ? request.getObservacoes() : null);
            return ResponseEntity.ok(AbsenceResponse.fromEntity(absence));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<AbsenceResponse> rejectAbsence(
            @PathVariable UUID id,
            @RequestBody(required = false) ApprovalRequest request) {
        try {
            String observacoes = (request != null && request.getObservacoes() != null)
                    ? request.getObservacoes()
                    : null;
            Absence absence = absenceService.rejectAbsence(id, observacoes);
            return ResponseEntity.ok(AbsenceResponse.fromEntity(absence));
        } catch (RuntimeException e) {
            log.error("Erro ao rejeitar afastamento {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro inesperado ao rejeitar afastamento {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Classe interna para requests de aprovaÃ§Ã£o
    public static class ApprovalRequest {
        private String observacoes;

        public String getObservacoes() {
            return observacoes;
        }

        public void setObservacoes(String observacoes) {
            this.observacoes = observacoes;
        }
    }
}
