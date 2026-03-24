package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.JobVacancyDTO;
import com.z7design.fleet_manager.model.enums.VacancyStatus;
import com.z7design.fleet_manager.service.JobVacancyService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Slf4j
public class JobVacancyController {
    
    @Autowired
    private JobVacancyService jobVacancyService;
    
    // ===== ENDPOINTS PÃšBLICOS =====
    
    // Buscar vagas pÃºblicas (abertas com prazo vÃ¡lido)
    @GetMapping("/public/vacancies")
    public ResponseEntity<List<JobVacancyDTO>> getPublicVacancies() {
        List<JobVacancyDTO> vacancies = jobVacancyService.getPublicJobVacancies();
        return ResponseEntity.ok(vacancies);
    }
    
    // Buscar vaga pÃºblica por ID
    @GetMapping("/public/vacancies/{id}")
    public ResponseEntity<JobVacancyDTO> getPublicVacancyById(@PathVariable UUID id) {
        JobVacancyDTO vacancy = jobVacancyService.getJobVacancyById(id);
        return ResponseEntity.ok(vacancy);
    }
    
    // Incrementar candidatura (para candidatos)
    @PostMapping("/public/vacancies/{id}/apply")
    public ResponseEntity<Map<String, String>> applyToVacancy(@PathVariable UUID id) {
        jobVacancyService.incrementApplications(id);
        return ResponseEntity.ok(Map.of("message", "Candidatura registrada com sucesso"));
    }
    
    // ===== ENDPOINTS ADMINISTRATIVOS =====
    
    // Buscar todas as vagas (admin)
    @GetMapping("/hr/vacancies")
    public ResponseEntity<List<JobVacancyDTO>> getAllVacancies(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String location) {
        try {
            log.info("GET /api/hr/vacancies - Buscando vagas com filtros: status={}, position={}, location={}", 
                    status, position, location);
            List<JobVacancyDTO> vacancies = jobVacancyService.getJobVacanciesWithFilters(status, position, location);
            log.info("âœ… Vagas retornadas: {} registros", vacancies.size());
            return ResponseEntity.ok(vacancies);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar vagas", e);
            log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            log.error("âŒ Mensagem: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("âŒ Causa: {}", e.getCause().getMessage());
            }
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar vaga por ID (admin)
    @GetMapping("/hr/vacancies/{id}")
    public ResponseEntity<JobVacancyDTO> getVacancyById(@PathVariable UUID id) {
        JobVacancyDTO vacancy = jobVacancyService.getJobVacancyById(id);
        return ResponseEntity.ok(vacancy);
    }
    
    // Criar nova vaga (admin)
    @PostMapping("/hr/vacancies")
    public ResponseEntity<JobVacancyDTO> createVacancy(@Valid @RequestBody JobVacancyDTO vacancyDTO) {
        JobVacancyDTO createdVacancy = jobVacancyService.createJobVacancy(vacancyDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVacancy);
    }
    
    // Atualizar vaga (admin)
    @PutMapping("/hr/vacancies/{id}")
    public ResponseEntity<JobVacancyDTO> updateVacancy(@PathVariable UUID id, @Valid @RequestBody JobVacancyDTO vacancyDTO) {
        JobVacancyDTO updatedVacancy = jobVacancyService.updateJobVacancy(id, vacancyDTO);
        return ResponseEntity.ok(updatedVacancy);
    }
    
    // Excluir vaga (admin)
    @DeleteMapping("/hr/vacancies/{id}")
    public ResponseEntity<Map<String, String>> deleteVacancy(@PathVariable UUID id) {
        System.out.println("ðŸ” [DEBUG] Endpoint DELETE chamado para vaga ID: " + id);
        try {
            jobVacancyService.deleteJobVacancy(id);
            System.out.println("âœ… [DEBUG] Vaga excluÃ­da com sucesso via endpoint");
            return ResponseEntity.ok(Map.of("message", "Vaga excluÃ­da com sucesso"));
        } catch (Exception e) {
            System.out.println("âŒ [DEBUG] Erro ao excluir vaga: " + e.getMessage());
            throw e;
        }
    }
    
    // Atualizar status da vaga (admin)
    @PatchMapping("/hr/vacancies/{id}/status")
    public ResponseEntity<JobVacancyDTO> updateVacancyStatus(
            @PathVariable UUID id, 
            @RequestParam VacancyStatus status) {
        JobVacancyDTO updatedVacancy = jobVacancyService.updateVacancyStatus(id, status);
        return ResponseEntity.ok(updatedVacancy);
    }
    
    // Buscar vagas vencendo em breve (admin)
    @GetMapping("/hr/vacancies/expiring")
    public ResponseEntity<List<JobVacancyDTO>> getExpiringVacancies(
            @RequestParam(defaultValue = "7") int days) {
        List<JobVacancyDTO> vacancies = jobVacancyService.getVacanciesExpiringSoon(days);
        return ResponseEntity.ok(vacancies);
    }
    
    // EstatÃ­sticas de vagas (admin)
    @GetMapping("/hr/vacancies/stats")
    public ResponseEntity<Map<String, Object>> getVacancyStats() {
        long openVacancies = jobVacancyService.getOpenVacanciesCount();
        long closedVacancies = jobVacancyService.getVacanciesCountByStatus(VacancyStatus.CLOSED);
        long cancelledVacancies = jobVacancyService.getVacanciesCountByStatus(VacancyStatus.CANCELLED);
        
        Map<String, Object> stats = Map.of(
                "openVacancies", openVacancies,
                "closedVacancies", closedVacancies,
                "cancelledVacancies", cancelledVacancies,
                "totalVacancies", openVacancies + closedVacancies + cancelledVacancies
        );
        
        return ResponseEntity.ok(stats);
    }
} 
