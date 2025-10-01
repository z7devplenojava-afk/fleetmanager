package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.MedicalExamService;

import br.com.fleetmanager.model.MedicalExam;
import br.com.fleetmanager.model.MedicalExamType;
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
 * Controller para gerenciamento de exames médicos
 */
@RestController
@RequestMapping("/api/sst/medical-exams")
@RequiredArgsConstructor
@Tag(name = "SST Exames Médicos", description = "API para gerenciamento de exames médicos")
public class SSTMedicalExamController {

    private final MedicalExamService medicalExamService;

    // ========== TIPOS DE EXAME ==========

    @GetMapping("/types")
    @Operation(summary = "Listar tipos de exame", description = "Retorna todos os tipos de exame cadastrados")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExamType>> getAllExamTypes() {
        List<MedicalExamType> examTypes = medicalExamService.getAllExamTypes();
        return ResponseEntity.ok(examTypes);
    }

    @GetMapping("/types/{id}")
    @Operation(summary = "Buscar tipo de exame por ID", description = "Retorna um tipo de exame específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExamType> getExamTypeById(@PathVariable UUID id) {
        MedicalExamType examType = medicalExamService.getExamTypeById(id);
        if (examType == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(examType);
    }

    @PostMapping("/types")
    @Operation(summary = "Criar tipo de exame", description = "Cria um novo tipo de exame")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExamType> createExamType(@RequestBody MedicalExamType examType) {
        MedicalExamType created = medicalExamService.createExamType(examType);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/types/{id}")
    @Operation(summary = "Atualizar tipo de exame", description = "Atualiza um tipo de exame existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExamType> updateExamType(@PathVariable UUID id, @RequestBody MedicalExamType examType) {
        MedicalExamType updated = medicalExamService.updateExamType(id, examType);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/types/{id}")
    @Operation(summary = "Excluir tipo de exame", description = "Exclui um tipo de exame")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteExamType(@PathVariable UUID id) {
        medicalExamService.deleteExamType(id);
        return ResponseEntity.noContent().build();
    }

    // ========== EXAMES MÉDICOS ==========

    @GetMapping
    @Operation(summary = "Listar exames médicos", description = "Retorna todos os exames médicos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExam>> getAllExams() {
        List<MedicalExam> exams = medicalExamService.getAllExams();
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar exame por ID", description = "Retorna um exame médico específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> getExamById(@PathVariable UUID id) {
        MedicalExam exam = medicalExamService.getExamById(id);
        if (exam == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(exam);
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar exames por funcionário", description = "Retorna exames de um funcionário específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExam>> getExamsByEmployee(@PathVariable UUID employeeId) {
        List<MedicalExam> exams = medicalExamService.getExamsByEmployee(employeeId);
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/employee/{employeeId}/type/{examTypeId}")
    @Operation(summary = "Listar exames por funcionário e tipo", description = "Retorna exames de um funcionário de um tipo específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExam>> getExamsByEmployeeAndType(
            @PathVariable UUID employeeId, 
            @PathVariable UUID examTypeId) {
        List<MedicalExam> exams = medicalExamService.getExamsByEmployeeAndType(employeeId, examTypeId);
        return ResponseEntity.ok(exams);
    }

    @PostMapping
    @Operation(summary = "Criar exame médico", description = "Cria um novo exame médico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> createExam(@RequestBody MedicalExam exam) {
        MedicalExam created = medicalExamService.createExam(exam);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar exame médico", description = "Atualiza um exame médico existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> updateExam(@PathVariable UUID id, @RequestBody MedicalExam exam) {
        MedicalExam updated = medicalExamService.updateExam(id, exam);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir exame médico", description = "Exclui um exame médico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteExam(@PathVariable UUID id) {
        medicalExamService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    // ========== EXAMES VENCIDOS/PRÓXIMOS DO VENCIMENTO ==========

    @GetMapping("/expired")
    @Operation(summary = "Listar exames vencidos", description = "Retorna exames que estão vencidos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExam>> getExpiredExams() {
        List<MedicalExam> exams = medicalExamService.getExpiredExams();
        return ResponseEntity.ok(exams);
    }

    @GetMapping("/expiring")
    @Operation(summary = "Listar exames próximos do vencimento", description = "Retorna exames que estão próximos do vencimento")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<MedicalExam>> getExpiringExams(@RequestParam(defaultValue = "30") int daysAhead) {
        List<MedicalExam> exams = medicalExamService.getExpiringExams(daysAhead);
        return ResponseEntity.ok(exams);
    }

    // ========== AGENDAMENTO AUTOMÁTICO ==========

    @PostMapping("/schedule-admission/{employeeId}")
    @Operation(summary = "Agendar exame admissional", description = "Agenda automaticamente um exame admissional para um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> scheduleAdmissionExam(@PathVariable UUID employeeId) {
        MedicalExam exam = medicalExamService.scheduleAdmissionExam(employeeId);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/schedule-periodic/{employeeId}")
    @Operation(summary = "Agendar exame periódico", description = "Agenda automaticamente um exame periódico para um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> schedulePeriodicExam(@PathVariable UUID employeeId) {
        MedicalExam exam = medicalExamService.schedulePeriodicExam(employeeId);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/schedule-dismissal/{employeeId}")
    @Operation(summary = "Agendar exame demissional", description = "Agenda automaticamente um exame demissional para um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<MedicalExam> scheduleDismissalExam(@PathVariable UUID employeeId) {
        MedicalExam exam = medicalExamService.scheduleDismissalExam(employeeId);
        return ResponseEntity.ok(exam);
    }
}
