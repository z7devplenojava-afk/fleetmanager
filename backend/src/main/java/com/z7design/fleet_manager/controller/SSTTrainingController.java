package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.SSTTrainingDTO;
import com.z7design.fleet_manager.dto.CreateSSTTrainingDTO;
import com.z7design.fleet_manager.model.SSTTraining;
import com.z7design.fleet_manager.model.TrainingParticipation;
import com.z7design.fleet_manager.service.SSTTrainingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller para gerenciamento de treinamentos SST
 */
@RestController
@RequestMapping("/api/sst/trainings")
@RequiredArgsConstructor
@Tag(name = "SST Treinamentos", description = "API para gerenciamento de treinamentos SST")
public class SSTTrainingController {

    private final SSTTrainingService trainingService;

    // ========== TREINAMENTOS ==========

    @GetMapping
    @Operation(summary = "Listar treinamentos", description = "Retorna todos os treinamentos cadastrados")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTTraining>> getAllTrainings() {
        List<SSTTraining> trainings = trainingService.getAllTrainings();
        return ResponseEntity.ok(trainings);
    }

    @GetMapping("/with-stats")
    @Operation(summary = "Listar treinamentos com estatÃ­sticas", description = "Retorna todos os treinamentos com informaÃ§Ãµes agregadas (participantes, certificados vencendo, etc.)")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTTrainingDTO>> getAllTrainingsWithStats() {
        List<SSTTrainingDTO> trainings = trainingService.getAllTrainingsWithStats();
        return ResponseEntity.ok(trainings);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar treinamento por ID", description = "Retorna um treinamento especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> getTrainingById(@PathVariable UUID id) {
        SSTTraining training = trainingService.getTrainingById(id);
        if (training == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(training);
    }

    @GetMapping("/{id}/with-stats")
    @Operation(summary = "Buscar treinamento por ID com estatÃ­sticas", description = "Retorna um treinamento especÃ­fico com informaÃ§Ãµes agregadas")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTrainingDTO> getTrainingWithStatsById(@PathVariable UUID id) {
        SSTTrainingDTO training = trainingService.getTrainingWithStatsById(id);
        if (training == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(training);
    }

    @GetMapping("/active")
    @Operation(summary = "Listar treinamentos ativos", description = "Retorna todos os treinamentos ativos")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<SSTTraining>> getActiveTrainings() {
        List<SSTTraining> trainings = trainingService.getActiveTrainings();
        return ResponseEntity.ok(trainings);
    }

    @PostMapping
    @Operation(summary = "Criar treinamento", description = "Cria um novo treinamento")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> createTraining(@RequestBody SSTTraining training) {
        SSTTraining created = trainingService.createTraining(training);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/create")
    @Operation(summary = "Criar treinamento a partir de DTO", description = "Cria um novo treinamento a partir de DTO")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> createTrainingFromDTO(@RequestBody CreateSSTTrainingDTO dto) {
        SSTTraining created = trainingService.createTrainingFromDTO(dto);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar treinamento", description = "Atualiza um treinamento existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> updateTraining(@PathVariable UUID id, @RequestBody SSTTraining training) {
        SSTTraining updated = trainingService.updateTraining(id, training);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/update")
    @Operation(summary = "Atualizar treinamento a partir de DTO", description = "Atualiza um treinamento existente a partir de DTO")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> updateTrainingFromDTO(@PathVariable UUID id, @RequestBody CreateSSTTrainingDTO dto) {
        SSTTraining existing = trainingService.getTrainingById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        
        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setTrainingType(dto.getTrainingType());
        existing.setDurationHours(dto.getDurationHours());
        existing.setValidityMonths(dto.getValidityMonths());
        existing.setIsMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : true);
        existing.setProvider(dto.getProvider());
        existing.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        existing.setRequiredForRisks(dto.getRequiredForRisks());
        
        SSTTraining updated = trainingService.updateTraining(id, existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir treinamento", description = "Exclui um treinamento")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTraining(@PathVariable UUID id) {
        trainingService.deleteTraining(id);
        return ResponseEntity.noContent().build();
    }

    // ========== PARTICIPAÃ‡Ã•ES EM TREINAMENTOS ==========

    @GetMapping("/participations")
    @Operation(summary = "Listar participaÃ§Ãµes", description = "Retorna todas as participaÃ§Ãµes em treinamentos")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getAllParticipations() {
        List<TrainingParticipation> participations = trainingService.getAllParticipations();
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/participations/{id}")
    @Operation(summary = "Buscar participaÃ§Ã£o por ID", description = "Retorna uma participaÃ§Ã£o especÃ­fica")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> getParticipationById(@PathVariable UUID id) {
        TrainingParticipation participation = trainingService.getParticipationById(id);
        if (participation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(participation);
    }

    @GetMapping("/participations/employee/{employeeId}")
    @Operation(summary = "Listar participaÃ§Ãµes por funcionÃ¡rio", description = "Retorna participaÃ§Ãµes de um funcionÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getParticipationsByEmployee(@PathVariable UUID employeeId) {
        List<TrainingParticipation> participations = trainingService.getParticipationsByEmployee(employeeId);
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/participations/training/{trainingId}")
    @Operation(summary = "Listar participaÃ§Ãµes por treinamento", description = "Retorna participaÃ§Ãµes de um treinamento especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getParticipationsByTraining(@PathVariable UUID trainingId) {
        List<TrainingParticipation> participations = trainingService.getParticipationsByTraining(trainingId);
        return ResponseEntity.ok(participations);
    }

    @PostMapping("/participations")
    @Operation(summary = "Criar participaÃ§Ã£o", description = "Cria uma nova participaÃ§Ã£o em treinamento")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> createParticipation(@RequestBody TrainingParticipation participation) {
        TrainingParticipation created = trainingService.createParticipation(participation);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/participations/{id}")
    @Operation(summary = "Atualizar participaÃ§Ã£o", description = "Atualiza uma participaÃ§Ã£o existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> updateParticipation(@PathVariable UUID id, @RequestBody TrainingParticipation participation) {
        TrainingParticipation updated = trainingService.updateParticipation(id, participation);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/participations/{id}")
    @Operation(summary = "Excluir participaÃ§Ã£o", description = "Exclui uma participaÃ§Ã£o")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteParticipation(@PathVariable UUID id) {
        trainingService.deleteParticipation(id);
        return ResponseEntity.noContent().build();
    }

    // ========== TREINAMENTOS VENCIDOS/PRÃ“XIMOS DO VENCIMENTO ==========

    @GetMapping("/expired")
    @Operation(summary = "Listar treinamentos vencidos", description = "Retorna treinamentos que estÃ£o vencidos")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getExpiredTrainings() {
        List<TrainingParticipation> participations = trainingService.getExpiredTrainings();
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/expiring")
    @Operation(summary = "Listar treinamentos prÃ³ximos do vencimento", description = "Retorna treinamentos que estÃ£o prÃ³ximos do vencimento")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getExpiringTrainings(@RequestParam(defaultValue = "30") int daysAhead) {
        List<TrainingParticipation> participations = trainingService.getExpiringTrainings(daysAhead);
        return ResponseEntity.ok(participations);
    }

    // ========== AGENDAMENTO AUTOMÃTICO ==========

    @PostMapping("/schedule/{trainingId}/employee/{employeeId}")
    @Operation(summary = "Agendar treinamento", description = "Agenda automaticamente um treinamento para um funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> scheduleTraining(
            @PathVariable UUID trainingId, 
            @PathVariable UUID employeeId,
            @RequestParam LocalDate scheduledDate) {
        TrainingParticipation participation = trainingService.scheduleTraining(trainingId, employeeId, scheduledDate);
        return ResponseEntity.ok(participation);
    }

    @PostMapping("/complete/{participationId}")
    @Operation(summary = "Completar treinamento", description = "Marca um treinamento como completo")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> completeTraining(
            @PathVariable UUID participationId,
            @RequestParam LocalDate completionDate,
            @RequestParam(required = false) String certificateUrl) {
        TrainingParticipation participation = trainingService.completeTraining(participationId, completionDate, certificateUrl);
        return ResponseEntity.ok(participation);
    }
}

