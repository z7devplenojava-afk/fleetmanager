package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.SSTTrainingService;

import br.com.fleetmanager.model.SSTTraining;
import br.com.fleetmanager.model.TrainingParticipation;
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
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SSTTraining>> getAllTrainings() {
        List<SSTTraining> trainings = trainingService.getAllTrainings();
        return ResponseEntity.ok(trainings);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar treinamento por ID", description = "Retorna um treinamento específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> getTrainingById(@PathVariable UUID id) {
        SSTTraining training = trainingService.getTrainingById(id);
        if (training == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(training);
    }

    @GetMapping("/active")
    @Operation(summary = "Listar treinamentos ativos", description = "Retorna todos os treinamentos ativos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SSTTraining>> getActiveTrainings() {
        List<SSTTraining> trainings = trainingService.getActiveTrainings();
        return ResponseEntity.ok(trainings);
    }

    @PostMapping
    @Operation(summary = "Criar treinamento", description = "Cria um novo treinamento")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> createTraining(@RequestBody SSTTraining training) {
        SSTTraining created = trainingService.createTraining(training);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar treinamento", description = "Atualiza um treinamento existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<SSTTraining> updateTraining(@PathVariable UUID id, @RequestBody SSTTraining training) {
        SSTTraining updated = trainingService.updateTraining(id, training);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir treinamento", description = "Exclui um treinamento")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTraining(@PathVariable UUID id) {
        trainingService.deleteTraining(id);
        return ResponseEntity.noContent().build();
    }

    // ========== PARTICIPAÇÕES EM TREINAMENTOS ==========

    @GetMapping("/participations")
    @Operation(summary = "Listar participações", description = "Retorna todas as participações em treinamentos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getAllParticipations() {
        List<TrainingParticipation> participations = trainingService.getAllParticipations();
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/participations/{id}")
    @Operation(summary = "Buscar participação por ID", description = "Retorna uma participação específica")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> getParticipationById(@PathVariable UUID id) {
        TrainingParticipation participation = trainingService.getParticipationById(id);
        if (participation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(participation);
    }

    @GetMapping("/participations/employee/{employeeId}")
    @Operation(summary = "Listar participações por funcionário", description = "Retorna participações de um funcionário específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getParticipationsByEmployee(@PathVariable UUID employeeId) {
        List<TrainingParticipation> participations = trainingService.getParticipationsByEmployee(employeeId);
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/participations/training/{trainingId}")
    @Operation(summary = "Listar participações por treinamento", description = "Retorna participações de um treinamento específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getParticipationsByTraining(@PathVariable UUID trainingId) {
        List<TrainingParticipation> participations = trainingService.getParticipationsByTraining(trainingId);
        return ResponseEntity.ok(participations);
    }

    @PostMapping("/participations")
    @Operation(summary = "Criar participação", description = "Cria uma nova participação em treinamento")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> createParticipation(@RequestBody TrainingParticipation participation) {
        TrainingParticipation created = trainingService.createParticipation(participation);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/participations/{id}")
    @Operation(summary = "Atualizar participação", description = "Atualiza uma participação existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> updateParticipation(@PathVariable UUID id, @RequestBody TrainingParticipation participation) {
        TrainingParticipation updated = trainingService.updateParticipation(id, participation);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/participations/{id}")
    @Operation(summary = "Excluir participação", description = "Exclui uma participação")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteParticipation(@PathVariable UUID id) {
        trainingService.deleteParticipation(id);
        return ResponseEntity.noContent().build();
    }

    // ========== TREINAMENTOS VENCIDOS/PRÓXIMOS DO VENCIMENTO ==========

    @GetMapping("/expired")
    @Operation(summary = "Listar treinamentos vencidos", description = "Retorna treinamentos que estão vencidos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getExpiredTrainings() {
        List<TrainingParticipation> participations = trainingService.getExpiredTrainings();
        return ResponseEntity.ok(participations);
    }

    @GetMapping("/expiring")
    @Operation(summary = "Listar treinamentos próximos do vencimento", description = "Retorna treinamentos que estão próximos do vencimento")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<TrainingParticipation>> getExpiringTrainings(@RequestParam(defaultValue = "30") int daysAhead) {
        List<TrainingParticipation> participations = trainingService.getExpiringTrainings(daysAhead);
        return ResponseEntity.ok(participations);
    }

    // ========== AGENDAMENTO AUTOMÁTICO ==========

    @PostMapping("/schedule/{trainingId}/employee/{employeeId}")
    @Operation(summary = "Agendar treinamento", description = "Agenda automaticamente um treinamento para um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> scheduleTraining(
            @PathVariable UUID trainingId, 
            @PathVariable UUID employeeId,
            @RequestParam LocalDate scheduledDate) {
        TrainingParticipation participation = trainingService.scheduleTraining(trainingId, employeeId, scheduledDate);
        return ResponseEntity.ok(participation);
    }

    @PostMapping("/complete/{participationId}")
    @Operation(summary = "Completar treinamento", description = "Marca um treinamento como completo")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<TrainingParticipation> completeTraining(
            @PathVariable UUID participationId,
            @RequestParam LocalDate completionDate,
            @RequestParam(required = false) String certificateUrl) {
        TrainingParticipation participation = trainingService.completeTraining(participationId, completionDate, certificateUrl);
        return ResponseEntity.ok(participation);
    }
}
