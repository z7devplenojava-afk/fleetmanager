package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.KmControlDTO;
import com.z7design.fleet_manager.service.KmControlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.z7design.fleet_manager.service.ReportService;
import com.z7design.fleet_manager.model.KmControl;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import net.sf.jasperreports.engine.JRException;
import java.io.IOException;
import com.z7design.fleet_manager.repository.KmControlRepository;

@RestController
@RequestMapping("/api/frota/km-controls")
@RequiredArgsConstructor
@Slf4j
public class KmControlController {
    
    private final KmControlService kmControlService;
    private final ReportService reportService; // Injetar ReportService
    private final KmControlRepository kmControlRepository;
    
    /**
     * Buscar todos os registros de controle de KM
     */
    @GetMapping
    public ResponseEntity<List<KmControlDTO>> getAllKmControls() {
        try {
            log.info("GET /api/frota/km-controls - Buscando todos os registros");
            List<KmControlDTO> kmControls = kmControlService.getAllKmControls();
            log.info("âœ… Registros encontrados: {}", kmControls.size());
            
            // Log detalhado para debug
            if (kmControls.isEmpty()) {
                log.warn("âš ï¸ Nenhum registro de KM encontrado no banco de dados");
            } else {
                log.info("ðŸ“Š Primeiro registro: {}", kmControls.get(0));
            }
            
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar registros de controle de KM", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste para verificar se o controller estÃ¡ funcionando
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testEndpoint() {
        try {
            log.info("GET /api/frota/km-controls/test - Testando endpoint");
            
            Map<String, Object> response = Map.of(
                "message", "Endpoint de teste funcionando",
                "timestamp", java.time.LocalDateTime.now(),
                "status", "OK"
            );
            
            log.info("âœ… Endpoint de teste funcionando");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro no endpoint de teste", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste para verificar se o serviÃ§o estÃ¡ funcionando
     */
    @GetMapping("/test-service")
    public ResponseEntity<Map<String, Object>> testService() {
        try {
            log.info("GET /api/frota/km-controls/test-service - Testando serviÃ§o");
            
            // Testar se o serviÃ§o consegue acessar o repositÃ³rio
            long count = kmControlRepository.count();
            log.info("âœ… Contagem de registros: {}", count);
            
            Map<String, Object> response = Map.of(
                "message", "ServiÃ§o funcionando",
                "recordCount", count,
                "timestamp", java.time.LocalDateTime.now(),
                "status", "OK"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro no teste do serviÃ§o", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getMessage(),
                "status", "ERROR"
            ));
        }
    }

    /**
     * Endpoint de teste sem autenticaÃ§Ã£o para debug
     */
    @GetMapping("/test-public")
    public ResponseEntity<Map<String, Object>> testPublicEndpoint() {
        try {
            log.info("GET /api/frota/km-controls/test-public - Testando endpoint pÃºblico");
            Map<String, Object> response = Map.of(
                "message", "Endpoint pÃºblico funcionando",
                "timestamp", java.time.LocalDateTime.now(),
                "service", "KmControlController",
                "status", "OK"
            );
            log.info("âœ… Teste pÃºblico realizado com sucesso");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro no teste pÃºblico do endpoint", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Criar dados de teste para KM Controls
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<Map<String, Object>> createTestData() {
        try {
            log.info("POST /api/frota/km-controls/create-test-data - Criando dados de teste");
            List<KmControlDTO> testData = kmControlService.createTestData();
            Map<String, Object> response = Map.of(
                "message", "Dados de teste criados com sucesso",
                "count", testData.size(),
                "data", testData
            );
            log.info("âœ… Dados de teste criados: {} registros", testData.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro ao criar dados de teste", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar registro por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<KmControlDTO> getKmControlById(@PathVariable("id") String id) {
        try {
            log.info("GET /api/frota/km-controls/{} - Buscando registro por ID", id);
            KmControlDTO kmControl = kmControlService.getKmControlById(id);
            
            // Log detalhado dos dados retornados
            log.info("âœ… Registro encontrado com ID: {}", id);
            log.info("ðŸ“Š Dados do registro:");
            log.info("  - KM Inicial: {} (tipo: {})", kmControl.getInitialKm(), kmControl.getInitialKm() != null ? kmControl.getInitialKm().getClass().getSimpleName() : "null");
            log.info("  - KM Final: {} (tipo: {})", kmControl.getFinalKm(), kmControl.getFinalKm() != null ? kmControl.getFinalKm().getClass().getSimpleName() : "null");
            log.info("  - KM Total: {} (tipo: {})", kmControl.getTotalKm(), kmControl.getTotalKm() != null ? kmControl.getTotalKm().getClass().getSimpleName() : "null");
            log.info("  - Justificativa Inicial: {}", kmControl.getInitialKmJustification());
            log.info("  - Justificativa Final: {}", kmControl.getFinalKmJustification());
            log.info("  - Data: {}", kmControl.getDate());
            log.info("  - Supervisor: {}", kmControl.getSupervisor());
            
            return ResponseEntity.ok(kmControl);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar registro com ID: {}", id, e);
            if (e.getMessage().contains("nÃ£o encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar registros com filtros
     */
    @GetMapping("/filter")
    public ResponseEntity<List<KmControlDTO>> getKmControlsWithFilters(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "supervisor", required = false) String supervisor,
            @RequestParam(value = "vehiclePlate", required = false) String vehiclePlate) {
        
        try {
            log.info("GET /api/frota/km-controls/filter - Filtros: Data: {} a {}, Supervisor: {}, VeÃ­culo: {}", 
                    startDate, endDate, supervisor, vehiclePlate);
            
            List<KmControlDTO> kmControls = kmControlService.getKmControlsWithFilters(
                    startDate, endDate, supervisor, vehiclePlate);
            
            log.info("âœ… Registros filtrados encontrados: {}", kmControls.size());
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar registros com filtros", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Criar novo registro
     */
    @PostMapping
    public ResponseEntity<KmControlDTO> createKmControl(@Valid @RequestBody KmControlDTO kmControlDTO) {
        try {
            log.info("POST /api/frota/km-controls - Criando novo registro para supervisor: {}", kmControlDTO.getSupervisor());
            
            KmControlDTO createdKmControl = kmControlService.createKmControl(kmControlDTO);
            
            log.info("âœ… Registro criado com ID: {}", createdKmControl.getId());
            return ResponseEntity.ok(createdKmControl);
        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o ao criar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("âŒ Erro ao criar registro de controle de KM", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Atualizar registro existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<KmControlDTO> updateKmControl(
            @PathVariable("id") String id, 
            @Valid @RequestBody KmControlDTO kmControlDTO) {
        try {
            log.info("PUT /api/frota/km-controls/{} - Atualizando registro", id);
            
            KmControlDTO updatedKmControl = kmControlService.updateKmControl(id, kmControlDTO);
            
            log.info("âœ… Registro atualizado com ID: {}", id);
            return ResponseEntity.ok(updatedKmControl);
        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o ao atualizar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar registro com ID: {}", id, e);
            if (e.getMessage().contains("nÃ£o encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Deletar registro
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKmControl(@PathVariable("id") String id) {
        try {
            log.info("DELETE /api/frota/km-controls/{} - Deletando registro", id);
            
            kmControlService.deleteKmControl(id);
            
            log.info("âœ… Registro deletado com ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("âŒ Erro ao deletar registro com ID: {}", id, e);
            if (e.getMessage().contains("nÃ£o encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar estatÃ­sticas
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("GET /api/frota/km-controls/statistics - EstatÃ­sticas para perÃ­odo: {} a {}", startDate, endDate);
            
            Map<String, Object> statistics = kmControlService.getStatistics(startDate, endDate);
            
            log.info("âœ… EstatÃ­sticas calculadas: {}", statistics);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("âŒ Erro ao calcular estatÃ­sticas", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar registros com observaÃ§Ãµes
     */
    @GetMapping("/with-observations")
    public ResponseEntity<List<KmControlDTO>> getKmControlsWithObservations() {
        try {
            log.info("GET /api/frota/km-controls/with-observations - Buscando registros com observaÃ§Ãµes");
            
            List<KmControlDTO> kmControls = kmControlService.getKmControlsWithObservations();
            
            log.info("âœ… Registros com observaÃ§Ãµes encontrados: {}", kmControls.size());
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar registros com observaÃ§Ãµes", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar todos os supervisores disponÃ­veis
     */
    @GetMapping("/supervisors")
    public ResponseEntity<List<String>> getAllSupervisors() {
        try {
            log.info("GET /api/frota/km-controls/supervisors - Buscando todos os supervisores");
            
            List<String> supervisors = kmControlService.getAllSupervisors();
            
            log.info("âœ… Supervisores encontrados: {}", supervisors.size());
            return ResponseEntity.ok(supervisors);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar supervisores", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Upload de foto do painel
     */
    @PostMapping("/{id}/dashboard-photo")
    public ResponseEntity<KmControlDTO> uploadDashboardPhoto(
            @PathVariable("id") String id,
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        try {
            log.info("POST /api/frota/km-controls/{}/dashboard-photo - Upload de foto do painel", id);
            
            // Validar arquivo
            if (file.isEmpty()) {
                log.warn("âš ï¸ Arquivo vazio recebido para upload");
                return ResponseEntity.badRequest().build();
            }
            
            // Validar tipo de arquivo (imagens)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("âš ï¸ Tipo de arquivo invÃ¡lido: {}", contentType);
                return ResponseEntity.badRequest().build();
            }
            
            log.info("ðŸ“¸ Processando upload de foto: {} ({} bytes)", 
                    file.getOriginalFilename(), file.getSize());
            
            KmControlDTO updatedKmControl = kmControlService.uploadDashboardPhoto(id, file, description);
            
            log.info("âœ… Foto do painel enviada com sucesso para o registro: {}", id);
            return ResponseEntity.ok(updatedKmControl);
            
        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o no upload da foto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("âŒ Erro ao fazer upload da foto do painel para o registro: {}", id, e);
            if (e.getMessage().contains("nÃ£o encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Gerar relatÃ³rio de Controle de KM (PDF ou Excel)
     */
    @GetMapping("/report")
    public ResponseEntity<byte[]> generateKmControlReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "supervisor", required = false) String supervisor,
            @RequestParam(value = "vehiclePlate", required = false) String vehiclePlate,
            @RequestParam(value = "format") String format) {

        try {
            log.info("GET /api/frota/km-controls/report - Gerando relatÃ³rio de KM. Formato: {}", format);
            
            Map<String, Object> filters = new HashMap<>();
            if (startDate != null) filters.put("startDate", startDate);
            if (endDate != null) filters.put("endDate", endDate);
            if (supervisor != null && !"all".equals(supervisor)) filters.put("supervisor", supervisor);
            if (vehiclePlate != null && !"all".equals(vehiclePlate)) filters.put("vehiclePlate", vehiclePlate);

            List<KmControl> kmControls = kmControlService.getKmControlsEntitiesWithFilters(
                startDate, endDate, supervisor, vehiclePlate
            );
            
            log.info("Dados obtidos para relatÃ³rio: {} registros de KmControl", kmControls.size());

            byte[] reportContent = reportService.generateKmControlReport(kmControls, filters, format);

            HttpHeaders headers = new HttpHeaders();
            String filename = "relatorio_km_control." + format;
            
            if ("pdf".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
            } else if ("xlsx".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            } else {
                throw new IllegalArgumentException("Formato de relatÃ³rio invÃ¡lido: " + format);
            }
            
            headers.setContentDispositionFormData("attachment", filename);
            log.info("âœ… RelatÃ³rio de KM gerado com sucesso. Tamanho: {} bytes", reportContent.length);
            return ResponseEntity.ok().headers(headers).body(reportContent);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de KM Control", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatÃ³rio: " + e.getMessage() + "\"}").getBytes());
        }
    }
}

