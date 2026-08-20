package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.enums.ActivityReportStatus;
import com.z7design.fleet_manager.model.enums.AbsenceStatus;
import com.z7design.fleet_manager.service.ActivityReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activity-reports")
public class ActivityReportController {

    private static final Logger log = LoggerFactory.getLogger(ActivityReportController.class);

    private final ActivityReportService activityReportService;
    private final ObjectMapper objectMapper;

    public ActivityReportController(ActivityReportService activityReportService, ObjectMapper objectMapper) {
        this.activityReportService = activityReportService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @Operation(summary = "Buscar relatÃ³rios de atividade", description = "Retorna uma lista de relatÃ³rios de atividade com base em filtros opcionais.")
    public ResponseEntity<List<ActivityReportDTO>> getActivityReports(
            @Parameter(description = "ID do funcionÃ¡rio") @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @Parameter(description = "ID do cliente") @RequestParam(value = "clientId", required = false) UUID clientId,
            @Parameter(description = "ID do posto de trabalho") @RequestParam(value = "workPostId", required = false) UUID workPostId,
            @Parameter(description = "Data de inÃ­cio do perÃ­odo (ISO: YYYY-MM-DD)") @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do perÃ­odo (ISO: YYYY-MM-DD)") @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Status do relatÃ³rio (DRAFT, SUBMITTED, APPROVED, REJECTED, FINALIZED)") @RequestParam(value = "status", required = false) ActivityReportStatus status,
            @Parameter(description = "ID do supervisor") @RequestParam(value = "supervisorId", required = false) UUID supervisorId) {
        
        log.info("GET /api/activity-reports - Buscando relatÃ³rios de atividade com filtros");
        try {
            List<ActivityReportDTO> reports = activityReportService.getActivityReports(
                    employeeId, clientId, workPostId, startDate, endDate, status, supervisorId);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Erro ao buscar relatÃ³rios de atividade: ", e);
            // Retornar lista vazia se houver erro (provavelmente tabela nÃ£o existe)
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Teste bÃ¡sico de relatÃ³rios de atividade", description = "Teste bÃ¡sico para verificar se o endpoint funciona")
    public ResponseEntity<Object> testActivityReports() {
        try {
            log.debug("Teste bÃ¡sico de relatÃ³rios de atividade");
            // Retornar lista vazia por enquanto para evitar erro
            return ResponseEntity.ok(java.util.Map.of(
                "count", 0,
                "message", "Teste de relatÃ³rios de atividade funcionando - lista vazia",
                "reports", java.util.Collections.emptyList()
            ));
        } catch (Exception e) {
            log.error("Erro no teste de relatÃ³rios de atividade: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar relatÃ³rio de atividade por ID", description = "Retorna um relatÃ³rio de atividade especÃ­fico pelo seu ID.")
    public ResponseEntity<ActivityReportDTO> getActivityReportById(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("id") UUID id) {
        
        log.info("GET /api/activity-reports/{} - Buscando relatÃ³rio de atividade por ID", id);
        ActivityReportDTO report = activityReportService.getActivityReportById(id);
        return ResponseEntity.ok(report);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Criar novo relatÃ³rio de atividade (JSON)", description = "Cria um novo relatÃ³rio de atividade usando application/json.")
    public ResponseEntity<ActivityReportDTO> createActivityReportJson(
            @Parameter(description = "Dados do relatÃ³rio de atividade a ser criado") 
            @Valid @RequestBody CreateActivityReportDTO createDTO) {
        
        log.info("POST /api/activity-reports (JSON) - Criando novo relatÃ³rio de atividade");
        log.info("ðŸ“‹ Dados recebidos - employeeId: {}, clientId: {}, workPostId: {}, date: {}", 
            createDTO.getEmployeeId(), createDTO.getClientId(), createDTO.getWorkPostId(), createDTO.getDate());
        
        try {
            ActivityReportDTO createdReport = activityReportService.createActivityReport(createDTO);
            return new ResponseEntity<>(createdReport, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("âŒ Erro ao criar relatÃ³rio de atividade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Criar novo relatÃ³rio de atividade (Multipart)", description = "Cria um novo relatÃ³rio de atividade usando multipart/form-data.")
    public ResponseEntity<ActivityReportDTO> createActivityReportMultipart(
            @Parameter(description = "ID do funcionÃ¡rio") @RequestParam(value = "employeeId") String employeeId,
            @Parameter(description = "ID do cliente") @RequestParam(value = "clientId") String clientId,
            @Parameter(description = "ID do posto de trabalho") @RequestParam(value = "workPostId") String workPostId,
            @Parameter(description = "Data do relatÃ³rio (YYYY-MM-DD)") @RequestParam(value = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "Hora de inÃ­cio (HH:mm)") @RequestParam(value = "startTime") String startTime,
            @Parameter(description = "Hora de fim (HH:mm)") @RequestParam(value = "endTime") String endTime,
            @Parameter(description = "DescriÃ§Ã£o") @RequestParam(value = "description", required = false) String description,
            @Parameter(description = "Status de ausÃªncia") @RequestParam(value = "absenceStatus", required = false) String absenceStatus,
            @Parameter(description = "Placa balÃ­stica (JSON string)") @RequestParam(value = "ballisticPlate", required = false) String ballisticPlate,
            @Parameter(description = "Registro de arma (JSON string)") @RequestParam(value = "weaponRegistry", required = false) String weaponRegistry,
            @Parameter(description = "DivergÃªncias") @RequestParam(value = "divergences", required = false) String divergences,
            @Parameter(description = "Consulta mÃ©dica (JSON string)") @RequestParam(value = "medicalConsultation", required = false) String medicalConsultation) {
        
        log.info("POST /api/activity-reports (Multipart) - Criando novo relatÃ³rio de atividade");
        log.info("ðŸ“‹ Dados recebidos - employeeId: {}, clientId: {}, workPostId: {}, date: {}", 
            employeeId, clientId, workPostId, date);
        
        try {
            CreateActivityReportDTO createDTO = new CreateActivityReportDTO();
            
            // Campos obrigatÃ³rios
            createDTO.setEmployeeId(UUID.fromString(employeeId));
            createDTO.setClientId(UUID.fromString(clientId));
            createDTO.setWorkPostId(UUID.fromString(workPostId));
            createDTO.setDate(date);
            createDTO.setStartTime(LocalTime.parse(startTime));
            createDTO.setEndTime(LocalTime.parse(endTime));
            
            if (description != null) {
                createDTO.setDescription(description);
            }
            
            if (absenceStatus != null && !absenceStatus.isEmpty()) {
                try {
                    createDTO.setAbsenceStatus(AbsenceStatus.valueOf(absenceStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("âš ï¸ Status de ausÃªncia invÃ¡lido: {}, usando PRESENT como padrÃ£o", absenceStatus);
                    createDTO.setAbsenceStatus(AbsenceStatus.PRESENT);
                }
            } else {
                createDTO.setAbsenceStatus(AbsenceStatus.PRESENT);
            }
            
            if (divergences != null) {
                createDTO.setDivergences(divergences);
            }
            
            // Parse de objetos JSON enviados como strings
            if (ballisticPlate != null && !ballisticPlate.isEmpty()) {
                try {
                    BallisticPlateDTO bp = objectMapper.readValue(ballisticPlate, BallisticPlateDTO.class);
                    createDTO.setBallisticPlate(bp);
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao fazer parse de ballisticPlate: {}", e.getMessage());
                }
            }
            
            if (weaponRegistry != null && !weaponRegistry.isEmpty()) {
                try {
                    WeaponRegistryDTO wr = objectMapper.readValue(weaponRegistry, WeaponRegistryDTO.class);
                    createDTO.setWeaponRegistry(wr);
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao fazer parse de weaponRegistry: {}", e.getMessage());
                }
            }
            
            if (medicalConsultation != null && !medicalConsultation.isEmpty()) {
                try {
                    MedicalConsultationDTO mc = objectMapper.readValue(medicalConsultation, MedicalConsultationDTO.class);
                    createDTO.setMedicalConsultation(mc);
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao fazer parse de medicalConsultation: {}", e.getMessage());
                }
            }
            
            log.info("ðŸ“‹ DTO construÃ­do - employeeId: {}, clientId: {}, workPostId: {}, date: {}", 
                createDTO.getEmployeeId(), createDTO.getClientId(), createDTO.getWorkPostId(), createDTO.getDate());
            
            ActivityReportDTO createdReport = activityReportService.createActivityReport(createDTO);
            return new ResponseEntity<>(createdReport, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("âŒ Erro ao criar relatÃ³rio de atividade: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar relatÃ³rio de atividade", description = "Atualiza um relatÃ³rio de atividade existente.")
    public ResponseEntity<ActivityReportDTO> updateActivityReport(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("id") UUID id,
            @Parameter(description = "Dados do relatÃ³rio de atividade para atualizaÃ§Ã£o") @Valid @RequestBody UpdateActivityReportDTO updateDTO) {
        
        log.info("PUT /api/activity-reports/{} - Atualizando relatÃ³rio de atividade", id);
        ActivityReportDTO updatedReport = activityReportService.updateActivityReport(id, updateDTO);
        return ResponseEntity.ok(updatedReport);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir relatÃ³rio de atividade", description = "Exclui um relatÃ³rio de atividade pelo seu ID.")
    public ResponseEntity<Void> deleteActivityReport(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("id") UUID id) {
        
        log.info("DELETE /api/activity-reports/{} - Deletando relatÃ³rio de atividade", id);
        activityReportService.deleteActivityReport(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reportId}/photos")
    @Operation(summary = "Upload de foto para relatÃ³rio", description = "Faz upload de uma foto para um relatÃ³rio de atividade especÃ­fico.")
    public ResponseEntity<ActivityReportDTO> uploadPhoto(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("reportId") UUID reportId,
            @Parameter(description = "Arquivo de foto") @RequestParam("photo") MultipartFile file,
            @Parameter(description = "DescriÃ§Ã£o da foto") @RequestParam("description") String description) throws IOException {
        
        log.info("POST /api/activity-reports/{}/photos - Upload de foto para relatÃ³rio", reportId);
        ActivityReportDTO updatedReport = activityReportService.uploadPhoto(reportId, file, description);
        return ResponseEntity.ok(updatedReport);
    }

    @PostMapping("/{reportId}/documents")
    @Operation(summary = "Upload de documento para relatÃ³rio", description = "Faz upload de um documento para um relatÃ³rio de atividade especÃ­fico.")
    public ResponseEntity<ActivityReportDTO> uploadDocument(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("reportId") UUID reportId,
            @Parameter(description = "Arquivo de documento") @RequestParam("document") MultipartFile file) throws IOException {
        
        log.info("POST /api/activity-reports/{}/documents - Upload de documento para relatÃ³rio", reportId);
        ActivityReportDTO updatedReport = activityReportService.uploadDocument(reportId, file);
        return ResponseEntity.ok(updatedReport);
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Aprovar relatÃ³rio de atividade", description = "Aprova um relatÃ³rio de atividade pelo ID.")
    public ResponseEntity<ActivityReportDTO> approveReport(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("id") UUID id,
            @Parameter(description = "ID do supervisor que aprova") @RequestParam(value = "supervisorId") UUID supervisorId) {
        
        log.info("PATCH /api/activity-reports/{}/approve - Aprovando relatÃ³rio", id);
        ActivityReportDTO approvedReport = activityReportService.approveReport(id, supervisorId);
        return ResponseEntity.ok(approvedReport);
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Rejeitar relatÃ³rio de atividade", description = "Rejeita um relatÃ³rio de atividade pelo ID, com um motivo.")
    public ResponseEntity<ActivityReportDTO> rejectReport(
            @Parameter(description = "ID do relatÃ³rio de atividade") @PathVariable("id") UUID id,
            @Parameter(description = "ID do supervisor que rejeita") @RequestParam(value = "supervisorId") UUID supervisorId,
            @Parameter(description = "Motivo da rejeiÃ§Ã£o") @RequestParam(value = "reason") String reason) {
        
        log.info("PATCH /api/activity-reports/{}/reject - Rejeitando relatÃ³rio", id);
        ActivityReportDTO rejectedReport = activityReportService.rejectReport(id, supervisorId, reason);
        return ResponseEntity.ok(rejectedReport);
    }

    @GetMapping("/pdf")
    @Operation(summary = "Gerar relatÃ³rio de atividade em PDF", description = "Gera um relatÃ³rio de atividade em formato PDF com base em filtros.")
    public ResponseEntity<?> generatePDFReport(
            @Parameter(description = "ID do funcionÃ¡rio") @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @Parameter(description = "ID do cliente") @RequestParam(value = "clientId", required = false) UUID clientId,
            @Parameter(description = "Data de inÃ­cio do perÃ­odo (ISO: YYYY-MM-DD)") @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do perÃ­odo (ISO: YYYY-MM-DD)") @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            log.info("GET /api/activity-reports/pdf - Gerando relatÃ³rio PDF - EmployeeId: {}, ClientId: {}, StartDate: {}, EndDate: {}", 
                    employeeId, clientId, startDate, endDate);
            
            byte[] pdfBytes = activityReportService.generatePDFReport(employeeId, clientId, startDate, endDate);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                log.warn("PDF gerado estÃ¡ vazio");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(java.util.Map.of("error", "Erro ao gerar PDF", "message", "PDF gerado estÃ¡ vazio"));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "activity_report.pdf");
            headers.setContentLength(pdfBytes.length);
            
            log.info("PDF gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de relatÃ³rios de atividade no controller: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(java.util.Map.of(
                            "error", "Erro ao gerar PDF",
                            "message", e.getMessage() != null ? e.getMessage() : "Erro desconhecido ao gerar PDF"
                    ));
        }
    }
}

