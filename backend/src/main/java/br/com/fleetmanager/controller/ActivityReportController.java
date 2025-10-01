package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ActivityReportService;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.enums.ActivityReportStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activity-reports")
public class ActivityReportController {

    private static final Logger log = LoggerFactory.getLogger(ActivityReportController.class);

    private final ActivityReportService activityReportService;

    public ActivityReportController(ActivityReportService activityReportService) {
        this.activityReportService = activityReportService;
    }

    @GetMapping
    @Operation(summary = "Buscar relatórios de atividade", description = "Retorna uma lista de relatórios de atividade com base em filtros opcionais.")
    public ResponseEntity<List<ActivityReportDTO>> getActivityReports(
            @Parameter(description = "ID do funcionário") @RequestParam(required = false) UUID employeeId,
            @Parameter(description = "ID do cliente") @RequestParam(required = false) UUID clientId,
            @Parameter(description = "ID do posto de trabalho") @RequestParam(required = false) UUID workPostId,
            @Parameter(description = "Data de início do período (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do período (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Status do relatório (DRAFT, SUBMITTED, APPROVED, REJECTED, FINALIZED)") @RequestParam(required = false) ActivityReportStatus status,
            @Parameter(description = "ID do supervisor") @RequestParam(required = false) UUID supervisorId) {
        
        log.info("GET /api/activity-reports - Buscando relatórios de atividade com filtros");
        List<ActivityReportDTO> reports = activityReportService.getActivityReports(
                employeeId, clientId, workPostId, startDate, endDate, status, supervisorId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar relatório de atividade por ID", description = "Retorna um relatório de atividade específico pelo seu ID.")
    public ResponseEntity<ActivityReportDTO> getActivityReportById(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID id) {
        
        log.info("GET /api/activity-reports/{} - Buscando relatório de atividade por ID", id);
        ActivityReportDTO report = activityReportService.getActivityReportById(id);
        return ResponseEntity.ok(report);
    }

    @PostMapping
    @Operation(summary = "Criar novo relatório de atividade", description = "Cria um novo relatório de atividade.")
    public ResponseEntity<ActivityReportDTO> createActivityReport(
            @Parameter(description = "Dados do relatório de atividade a ser criado") @Valid @RequestBody CreateActivityReportDTO createDTO) {
        
        log.info("POST /api/activity-reports - Criando novo relatório de atividade");
        ActivityReportDTO createdReport = activityReportService.createActivityReport(createDTO);
        return new ResponseEntity<>(createdReport, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar relatório de atividade", description = "Atualiza um relatório de atividade existente.")
    public ResponseEntity<ActivityReportDTO> updateActivityReport(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID id,
            @Parameter(description = "Dados do relatório de atividade para atualização") @Valid @RequestBody UpdateActivityReportDTO updateDTO) {
        
        log.info("PUT /api/activity-reports/{} - Atualizando relatório de atividade", id);
        ActivityReportDTO updatedReport = activityReportService.updateActivityReport(id, updateDTO);
        return ResponseEntity.ok(updatedReport);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir relatório de atividade", description = "Exclui um relatório de atividade pelo seu ID.")
    public ResponseEntity<Void> deleteActivityReport(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID id) {
        
        log.info("DELETE /api/activity-reports/{} - Deletando relatório de atividade", id);
        activityReportService.deleteActivityReport(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reportId}/photos")
    @Operation(summary = "Upload de foto para relatório", description = "Faz upload de uma foto para um relatório de atividade específico.")
    public ResponseEntity<ActivityReportDTO> uploadPhoto(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID reportId,
            @Parameter(description = "Arquivo de foto") @RequestParam("photo") MultipartFile file,
            @Parameter(description = "Descrição da foto") @RequestParam("description") String description) throws IOException {
        
        log.info("POST /api/activity-reports/{}/photos - Upload de foto para relatório", reportId);
        ActivityReportDTO updatedReport = activityReportService.uploadPhoto(reportId, file, description);
        return ResponseEntity.ok(updatedReport);
    }

    @PostMapping("/{reportId}/documents")
    @Operation(summary = "Upload de documento para relatório", description = "Faz upload de um documento para um relatório de atividade específico.")
    public ResponseEntity<ActivityReportDTO> uploadDocument(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID reportId,
            @Parameter(description = "Arquivo de documento") @RequestParam("document") MultipartFile file) throws IOException {
        
        log.info("POST /api/activity-reports/{}/documents - Upload de documento para relatório", reportId);
        ActivityReportDTO updatedReport = activityReportService.uploadDocument(reportId, file);
        return ResponseEntity.ok(updatedReport);
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Aprovar relatório de atividade", description = "Aprova um relatório de atividade pelo ID.")
    public ResponseEntity<ActivityReportDTO> approveReport(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID id,
            @Parameter(description = "ID do supervisor que aprova") @RequestParam UUID supervisorId) {
        
        log.info("PATCH /api/activity-reports/{}/approve - Aprovando relatório", id);
        ActivityReportDTO approvedReport = activityReportService.approveReport(id, supervisorId);
        return ResponseEntity.ok(approvedReport);
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Rejeitar relatório de atividade", description = "Rejeita um relatório de atividade pelo ID, com um motivo.")
    public ResponseEntity<ActivityReportDTO> rejectReport(
            @Parameter(description = "ID do relatório de atividade") @PathVariable UUID id,
            @Parameter(description = "ID do supervisor que rejeita") @RequestParam UUID supervisorId,
            @Parameter(description = "Motivo da rejeição") @RequestParam String reason) {
        
        log.info("PATCH /api/activity-reports/{}/reject - Rejeitando relatório", id);
        ActivityReportDTO rejectedReport = activityReportService.rejectReport(id, supervisorId, reason);
        return ResponseEntity.ok(rejectedReport);
    }

    @GetMapping("/pdf")
    @Operation(summary = "Gerar relatório de atividade em PDF", description = "Gera um relatório de atividade em formato PDF com base em filtros.")
    public ResponseEntity<byte[]> generatePDFReport(
            @Parameter(description = "ID do funcionário") @RequestParam(required = false) UUID employeeId,
            @Parameter(description = "ID do cliente") @RequestParam(required = false) UUID clientId,
            @Parameter(description = "Data de início do período (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do período (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET /api/activity-reports/pdf - Gerando relatório PDF");
        byte[] pdfBytes = activityReportService.generatePDFReport(employeeId, clientId, startDate, endDate);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "activity_report.pdf");
        headers.setContentLength(pdfBytes.length);
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
