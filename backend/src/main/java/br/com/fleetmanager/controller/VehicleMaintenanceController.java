package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.VehicleMaintenanceService;

import br.com.fleetmanager.dto.VehicleMaintenanceDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenances")
@RequiredArgsConstructor
@Slf4j
public class VehicleMaintenanceController {

    private final VehicleMaintenanceService maintenanceService;

    // GET /api/maintenances/temp - Listar todas as manutenções (versão temporária)
    @GetMapping("/temp")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenancesTemporary() {
        log.info("GET /api/maintenances/temp - Listando todas as manutenções (versão temporária)");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenancesTemporary();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/simple - Listar todas as manutenções (versão simplificada)
    @GetMapping("/simple")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenancesSimple() {
        log.info("GET /api/maintenances/simple - Listando todas as manutenções (versão simplificada)");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenancesSimple();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances - Listar todas as manutenções
    @GetMapping
    public ResponseEntity<List<VehicleMaintenanceDTO>> getAllMaintenances() {
        log.info("GET /api/maintenances - Listando todas as manutenções");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getAllMaintenances();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/{id} - Buscar manutenção por ID
    @GetMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceDTO> getMaintenanceById(@PathVariable UUID id) {
        log.info("GET /api/maintenances/{} - Buscando manutenção por ID", id);
        VehicleMaintenanceDTO maintenance = maintenanceService.getMaintenanceById(id);
        return ResponseEntity.ok(maintenance);
    }

    // POST /api/maintenances - Criar nova manutenção
    @PostMapping
    public ResponseEntity<VehicleMaintenanceDTO> createMaintenance(@Valid @RequestBody VehicleMaintenanceDTO dto) {
        log.info("POST /api/maintenances - Criando nova manutenção");
        VehicleMaintenanceDTO createdMaintenance = maintenanceService.createMaintenance(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMaintenance);
    }

    // PUT /api/maintenances/{id} - Atualizar manutenção
    @PutMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenance(
            @PathVariable UUID id, 
            @Valid @RequestBody VehicleMaintenanceDTO dto) {
        log.info("PUT /api/maintenances/{} - Atualizando manutenção", id);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        return ResponseEntity.ok(updatedMaintenance);
    }

    // DELETE /api/maintenances/{id} - Deletar manutenção
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable UUID id) {
        log.info("DELETE /api/maintenances/{} - Deletando manutenção", id);
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/maintenances/vehicle/{vehicleId} - Buscar manutenções por veículo
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByVehicle(@PathVariable UUID vehicleId) {
        log.info("GET /api/maintenances/vehicle/{} - Buscando manutenções por veículo", vehicleId);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByVehicle(vehicleId);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/vehicle/{vehicleId}/last-date - Buscar data da última manutenção
    @GetMapping("/vehicle/{vehicleId}/last-date")
    public ResponseEntity<LocalDate> getLastMaintenanceDateByVehicle(@PathVariable UUID vehicleId) {
        log.info("GET /api/maintenances/vehicle/{}/last-date - Buscando data da última manutenção", vehicleId);
        LocalDate lastMaintenanceDate = maintenanceService.getLastMaintenanceDateByVehicle(vehicleId);
        return ResponseEntity.ok(lastMaintenanceDate);
    }

    // GET /api/maintenances/status/{status} - Buscar manutenções por status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByStatus(@PathVariable String status) {
        log.info("GET /api/maintenances/status/{} - Buscando manutenções por status", status);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByStatus(status);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/priority/{priority} - Buscar manutenções por prioridade
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByPriority(@PathVariable String priority) {
        log.info("GET /api/maintenances/priority/{} - Buscando manutenções por prioridade", priority);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByPriority(priority);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/period - Buscar manutenções por período
    @GetMapping("/period")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getMaintenancesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/maintenances/period - Buscando manutenções entre {} e {}", startDate, endDate);
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getMaintenancesByPeriod(startDate, endDate);
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/scheduled/today - Buscar manutenções agendadas para hoje
    @GetMapping("/scheduled/today")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getScheduledForToday() {
        log.info("GET /api/maintenances/scheduled/today - Buscando manutenções agendadas para hoje");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getScheduledForToday();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/urgent - Buscar manutenções urgentes
    @GetMapping("/urgent")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getUrgentMaintenances() {
        log.info("GET /api/maintenances/urgent - Buscando manutenções urgentes");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getUrgentMaintenances();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/overdue - Buscar manutenções vencidas
    @GetMapping("/overdue")
    public ResponseEntity<List<VehicleMaintenanceDTO>> getOverdueMaintenances() {
        log.info("GET /api/maintenances/overdue - Buscando manutenções vencidas");
        List<VehicleMaintenanceDTO> maintenances = maintenanceService.getOverdueMaintenances();
        return ResponseEntity.ok(maintenances);
    }

    // GET /api/maintenances/stats - Estatísticas de manutenção
    @GetMapping("/stats")
    public ResponseEntity<VehicleMaintenanceService.MaintenanceStats> getMaintenanceStats() {
        log.info("GET /api/maintenances/stats - Gerando estatísticas de manutenção");
        VehicleMaintenanceService.MaintenanceStats stats = maintenanceService.getMaintenanceStats();
        return ResponseEntity.ok(stats);
    }

    // PATCH /api/maintenances/{id}/status - Atualizar apenas o status
    @PatchMapping("/{id}/status")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenanceStatus(
            @PathVariable UUID id, 
            @RequestParam String status) {
        log.info("PATCH /api/maintenances/{}/status - Atualizando status para {}", id, status);
        
        VehicleMaintenanceDTO dto = maintenanceService.getMaintenanceById(id);
        dto.setStatus(status);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        
        return ResponseEntity.ok(updatedMaintenance);
    }

    // PATCH /api/maintenances/{id}/priority - Atualizar apenas a prioridade
    @PatchMapping("/{id}/priority")
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenancePriority(
            @PathVariable UUID id, 
            @RequestParam String priority) {
        log.info("PATCH /api/maintenances/{}/priority - Atualizando prioridade para {}", id, priority);
        
        VehicleMaintenanceDTO dto = maintenanceService.getMaintenanceById(id);
        dto.setPriority(priority);
        VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenance(id, dto);
        
        return ResponseEntity.ok(updatedMaintenance);
    }

    // POST /api/maintenances/upload - Criar manutenção com upload de arquivos
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
        
        log.info("POST /api/maintenances/upload - Criando manutenção com upload de arquivos");
        
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
            log.error("Erro ao criar manutenção com arquivos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    // PUT /api/maintenances/{id}/upload - Atualizar manutenção com upload de arquivos
    @PutMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VehicleMaintenanceDTO> updateMaintenanceWithFiles(
            @PathVariable UUID id,
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
        
        log.info("PUT /api/maintenances/{}/upload - Atualizando manutenção com upload de arquivos", id);
        
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
            
            // Adicionar arquivos para remoção
            if (removedPhotos != null) {
                dto.setRemovedPhotos(java.util.Arrays.asList(removedPhotos));
            }
            if (removedDocuments != null) {
                dto.setRemovedDocuments(java.util.Arrays.asList(removedDocuments));
            }
            
            VehicleMaintenanceDTO updatedMaintenance = maintenanceService.updateMaintenanceWithFiles(id, dto, files);
            return ResponseEntity.ok(updatedMaintenance);
            
        } catch (Exception e) {
            log.error("Erro ao atualizar manutenção com arquivos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}
