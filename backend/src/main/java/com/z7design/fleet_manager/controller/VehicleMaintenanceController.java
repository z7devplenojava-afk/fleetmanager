package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleMaintenanceDTO;
import com.z7design.fleet_manager.model.VehicleMaintenance;
import com.z7design.fleet_manager.service.VehicleMaintenanceService;
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
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenances")
@RequiredArgsConstructor
@Slf4j
public class VehicleMaintenanceController {

    private final VehicleMaintenanceService maintenanceService;

    // GET /api/maintenances/temp - Listar todas as manutenÃ§Ãµes (versÃ£o temporÃ¡ria)
    @GetMapping("/temp")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenancesTemporary() {
        log.info("GET /api/maintenances/temp - Listando todas as manutenÃ§Ãµes (versÃ£o temporÃ¡ria)");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenancesTemporary();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/simple - Listar todas as manutenÃ§Ãµes (versÃ£o simplificada)
    @GetMapping("/simple")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenancesSimple() {
        log.info("GET /api/maintenances/simple - Listando todas as manutenÃ§Ãµes (versÃ£o simplificada)");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenancesSimple();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances - Listar todas as manutenÃ§Ãµes
    @GetMapping
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenances() {
        log.info("GET /api/maintenances - Listando todas as manutenÃ§Ãµes");
        try {
            List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenances();
            return ResponseEntity.ok(maintenances);
        } catch (Exception e) {
            // Evitar 500 para o frontend
            return ResponseEntity.ok(java.util.List.of());
        }
    }

    // GET /api/maintenances/{id} - Buscar manutenÃ§Ã£o por ID
    @GetMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceDTO> getMaintenanceById(@PathVariable("id") UUID id) {
        log.info("GET /api/maintenances/{} - Buscando manutenÃ§Ã£o por ID", id);
        VehicleMaintenanceDTO maintenance = maintenanceService.getMaintenanceById(id);
        return ResponseEntity.ok(maintenance);
    }

    // POST /api/maintenances - Criar nova manutenÃ§Ã£o
    @PostMapping
    public ResponseEntity<VehicleMaintenanceDTO> createMaintenance(@Valid @RequestBody VehicleMaintenanceDTO dto) {
        log.info("POST /api/maintenances - Criando nova manutenÃ§Ã£o");
        VehicleMaintenanceDTO createdMaintenance = maintenanceService.createMaintenance(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMaintenance);
    }

    // PUT /api/maintenances/{id} - Atualizar manutenÃ§Ã£o
    @PutMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenance(
            @PathVariable("id") UUID id, 
            @Valid @RequestBody VehicleMaintenanceDTO dto) {
        log.info("PUT /api/maintenances/{} - Atualizando manutenÃ§Ã£o", id);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        return ResponseEntity.ok(updatedMaintenance);
    }

    // DELETE /api/maintenances/{id} - Deletar manutenÃ§Ã£o
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable("id") UUID id) {
        log.info("DELETE /api/maintenances/{} - Deletando manutenÃ§Ã£o", id);
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/maintenances/vehicle/{vehicleId} - Buscar manutenÃ§Ãµes por veÃ­culo
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByVehicle(@PathVariable("vehicleId") UUID vehicleId) {
        log.info("GET /api/maintenances/vehicle/{} - Buscando manutenÃ§Ãµes por veÃ­culo", vehicleId);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByVehicle(vehicleId);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/vehicle/{vehicleId}/last-date - Buscar data da Ãºltima manutenÃ§Ã£o
    @GetMapping("/vehicle/{vehicleId}/last-date")
    public ResponseEntity<LocalDate> getLastMaintenanceDateByVehicle(@PathVariable("vehicleId") UUID vehicleId) {
        log.info("GET /api/maintenances/vehicle/{}/last-date - Buscando data da Ãºltima manutenÃ§Ã£o", vehicleId);
        LocalDate lastMaintenanceDate = maintenanceService.getLastMaintenanceDateByVehicle(vehicleId);
        return ResponseEntity.ok(lastMaintenanceDate);
    }

    // GET /api/maintenances/status/{status} - Buscar manutenÃ§Ãµes por status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByStatus(@PathVariable("status") String status) {
        log.info("GET /api/maintenances/status/{} - Buscando manutenÃ§Ãµes por status", status);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByStatus(status);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/priority/{priority} - Buscar manutenÃ§Ãµes por prioridade
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByPriority(@PathVariable("priority") String priority) {
        log.info("GET /api/maintenances/priority/{} - Buscando manutenÃ§Ãµes por prioridade", priority);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByPriority(priority);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/period - Buscar manutenÃ§Ãµes por perÃ­odo
    @GetMapping("/period")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByPeriod(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/maintenances/period - Buscando manutenÃ§Ãµes entre {} e {}", startDate, endDate);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByPeriod(startDate, endDate);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/scheduled/today - Buscar manutenÃ§Ãµes agendadas para hoje
    @GetMapping("/scheduled/today")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getScheduledForToday() {
        log.info("GET /api/maintenances/scheduled/today - Buscando manutenÃ§Ãµes agendadas para hoje");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getScheduledForToday();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/urgent - Buscar manutenÃ§Ãµes urgentes
    @GetMapping("/urgent")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getUrgentMaintenances() {
        log.info("GET /api/maintenances/urgent - Buscando manutenÃ§Ãµes urgentes");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getUrgentMaintenances();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/overdue - Buscar manutenÃ§Ãµes vencidas
    @GetMapping("/overdue")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getOverdueMaintenances() {
        log.info("GET /api/maintenances/overdue - Buscando manutenÃ§Ãµes vencidas");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getOverdueMaintenances();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/stats - EstatÃ­sticas de manutenÃ§Ã£o
    @GetMapping("/stats")
    public ResponseEntity<VehicleMaintenanceService.MaintenanceStats> getMaintenanceStats() {
        log.info("GET /api/maintenances/stats - Gerando estatÃ­sticas de manutenÃ§Ã£o");
        VehicleMaintenanceService.MaintenanceStats stats = maintenanceService.getMaintenanceStats();
        return ResponseEntity.ok(stats);
    }

    // PATCH /api/maintenances/{id}/status - Atualizar apenas o status
    @PatchMapping("/{id}/status")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenanceStatus(
            @PathVariable("id") UUID id, 
            @RequestParam(value = "status") String status) {
        log.info("PATCH /api/maintenances/{}/status - Atualizando status para {}", id, status);
        
        VehicleMaintenanceDTO dto = maintenanceService.getMaintenanceById(id);
        dto.setStatus(status);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        
        return ResponseEntity.ok(updatedMaintenance);
    }

    // PATCH /api/maintenances/{id}/priority - Atualizar apenas a prioridade
    @PatchMapping("/{id}/priority")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenancePriority(
            @PathVariable("id") UUID id, 
            @RequestParam(value = "priority") String priority) {
        log.info("PATCH /api/maintenances/{}/priority - Atualizando prioridade para {}", id, priority);
        
        VehicleMaintenanceDTO dto = maintenanceService.getMaintenanceById(id);
        dto.setPriority(priority);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        
        return ResponseEntity.ok(updatedMaintenance);
    }

    // POST /api/maintenances/upload - Criar manutenÃ§Ã£o com upload de arquivos
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VehicleMaintenanceDTO> createMaintenanceWithFiles(
            @RequestParam("vehicleId") String vehicleId,
            @RequestParam("date") String date,
            @RequestParam("maintenanceType") String maintenanceType,
            @RequestParam("description") String description,
            @RequestParam(value = "cost", required = false) String cost,
            @RequestParam(value = "provider", required = false) String provider,
            @RequestParam(value = "mileage", required = false) String mileage,
            @RequestParam(value = "status", required = false, defaultValue = "SCHEDULED") String status,
            @RequestParam(value = "priority", required = false, defaultValue = "MEDIUM") String priority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {
        
        log.info("POST /api/maintenances/upload - Criando manutenÃ§Ã£o com upload de arquivos");
        
        try {
            // Criar DTO com os dados recebidos
            VehicleMaintenanceDTO dto = new VehicleMaintenanceDTO();
            dto.setVehicleId(UUID.fromString(vehicleId));
            dto.setDate(LocalDate.parse(date));
            dto.setMaintenanceType(maintenanceType);
            dto.setDescription(description);
            dto.setStatus(status);
            dto.setPriority(priority);
            
            if (cost != null && !cost.isEmpty()) {
                dto.setCost(new java.math.BigDecimal(cost));
            }
            if (provider != null && !provider.isEmpty()) {
                dto.setProvider(provider);
            }
            if (mileage != null && !mileage.isEmpty()) {
                dto.setMileage(new java.math.BigDecimal(mileage));
            }
            if (notes != null && !notes.isEmpty()) {
                dto.setNotes(notes);
            }
            
            VehicleMaintenanceDTO createdMaintenance = maintenanceService.createMaintenanceWithFiles(dto, files);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdMaintenance);
            
        } catch (Exception e) {
            log.error("Erro ao criar manutenÃ§Ã£o com arquivos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    // PUT /api/maintenances/{id}/upload - Atualizar manutenÃ§Ã£o com upload de arquivos
    @PutMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenanceWithFiles(
            @PathVariable("id") UUID id,
            @RequestParam("vehicleId") String vehicleId,
            @RequestParam("date") String date,
            @RequestParam("maintenanceType") String maintenanceType,
            @RequestParam("description") String description,
            @RequestParam(value = "cost", required = false) String cost,
            @RequestParam(value = "provider", required = false) String provider,
            @RequestParam(value = "mileage", required = false) String mileage,
            @RequestParam(value = "status", required = false, defaultValue = "SCHEDULED") String status,
            @RequestParam(value = "priority", required = false, defaultValue = "MEDIUM") String priority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "removedPhotos", required = false) String[] removedPhotos,
            @RequestParam(value = "removedDocuments", required = false) String[] removedDocuments) {
        
        log.info("PUT /api/maintenances/{}/upload - Atualizando manutenÃ§Ã£o com upload de arquivos", id);
        
        try {
            // Criar DTO com os dados recebidos
            VehicleMaintenanceDTO dto = new VehicleMaintenanceDTO();
            dto.setVehicleId(UUID.fromString(vehicleId));
            dto.setDate(LocalDate.parse(date));
            dto.setMaintenanceType(maintenanceType);
            dto.setDescription(description);
            dto.setStatus(status);
            dto.setPriority(priority);
            
            if (cost != null && !cost.isEmpty()) {
                dto.setCost(new java.math.BigDecimal(cost));
            }
            if (provider != null && !provider.isEmpty()) {
                dto.setProvider(provider);
            }
            if (mileage != null && !mileage.isEmpty()) {
                dto.setMileage(new java.math.BigDecimal(mileage));
            }
            if (notes != null && !notes.isEmpty()) {
                dto.setNotes(notes);
            }
            
            // Adicionar arquivos para remoÃ§Ã£o
            if (removedPhotos != null) {
                dto.setRemovedPhotos(java.util.Arrays.asList(removedPhotos));
            }
            if (removedDocuments != null) {
                dto.setRemovedDocuments(java.util.Arrays.asList(removedDocuments));
            }
            
            VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenanceWithFiles(id, dto, files);
            return ResponseEntity.ok(updatedMaintenance);
            
        } catch (Exception e) {
            log.error("Erro ao atualizar manutenÃ§Ã£o com arquivos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    // GET /api/maintenances/report/pdf - Gerar relatÃ³rio PDF de manutenÃ§Ãµes
    @GetMapping(value = "/report/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Gerar relatÃ³rio PDF de manutenÃ§Ãµes", description = "Gera relatÃ³rio PDF filtrado por data, placa, status, tipo e descriÃ§Ã£o")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "maintenanceType", required = false) String maintenanceType,
            @RequestParam(value = "description", required = false) String description) {
        try {
            VehicleMaintenance.MaintenanceStatus statusEnum = null;
            if (status != null && !status.isEmpty() && !"all".equals(status)) {
                try {
                    statusEnum = VehicleMaintenance.MaintenanceStatus.valueOf(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Status invÃ¡lido fornecido: {}", status);
                }
            }

            VehicleMaintenance.MaintenanceType typeEnum = null;
            if (maintenanceType != null && !maintenanceType.isEmpty() && !"all".equals(maintenanceType)) {
                try {
                    typeEnum = VehicleMaintenance.MaintenanceType.valueOf(maintenanceType);
                } catch (IllegalArgumentException e) {
                    log.warn("Tipo invÃ¡lido fornecido: {}", maintenanceType);
                }
            }

            byte[] pdfBytes = maintenanceService.generatePDFReport(startDate, endDate, vehicleId, statusEnum, typeEnum, description);
            String fileName = "relatorio-manutencoes-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de manutenÃ§Ãµes: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

