package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.JobVacancyService;

import br.com.fleetmanager.dto.JobVacancyDTO;
import br.com.fleetmanager.model.enums.VacancyStatus;
import jakarta.validation.Valid;
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
public class JobVacancyController {
    
    @Autowired
    private JobVacancyService jobVacancyService;
    
    // ===== ENDPOINTS PÚBLICOS =====
    
    // Buscar vagas públicas (abertas com prazo válido)
    @GetMapping("/public/vacancies")
    public ResponseEntity<List<JobVacancyDTO>> getPublicVacancies() {
        List<JobVacancyDTO> vacancies = jobVacancyService.getPublicJobVacancies();
        return ResponseEntity.ok(vacancies);
    }
    
    // Buscar vaga pública por ID
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
        
        List<JobVacancyDTO> vacancies = jobVacancyService.getJobVacanciesWithFilters(status, position, location);
        return ResponseEntity.ok(vacancies);
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
        System.out.println("🔍 [DEBUG] Endpoint DELETE chamado para vaga ID: " + id);
        try {
            jobVacancyService.deleteJobVacancy(id);
            System.out.println("✅ [DEBUG] Vaga excluída com sucesso via endpoint");
            return ResponseEntity.ok(Map.of("message", "Vaga excluída com sucesso"));
        } catch (Exception e) {
            System.out.println("❌ [DEBUG] Erro ao excluir vaga: " + e.getMessage());
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
    
    // Estatísticas de vagas (admin)
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