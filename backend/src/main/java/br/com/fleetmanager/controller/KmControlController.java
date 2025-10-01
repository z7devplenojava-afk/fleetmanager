package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.KmControlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import br.com.fleetmanager.service.ReportService;

import br.com.fleetmanager.dto.KmControlDTO;
import br.com.fleetmanager.model.KmControl;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import net.sf.jasperreports.engine.JRException;
import br.com.fleetmanager.repository.KmControlRepository;

import java.io.IOException;

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
            log.info("✅ Registros encontrados: {}", kmControls.size());
            
            // Log detalhado para debug
            if (kmControls.isEmpty()) {
                log.warn("⚠️ Nenhum registro de KM encontrado no banco de dados");
            } else {
                log.info("📊 Primeiro registro: {}", kmControls.get(0));
            }
            
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar registros de controle de KM", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste para verificar se o controller está funcionando
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
            
            log.info("✅ Endpoint de teste funcionando");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erro no endpoint de teste", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste para verificar se o serviço está funcionando
     */
    @GetMapping("/test-service")
    public ResponseEntity<Map<String, Object>> testService() {
        try {
            log.info("GET /api/frota/km-controls/test-service - Testando serviço");
            
            // Testar se o serviço consegue acessar o repositório
            long count = kmControlRepository.count();
            log.info("✅ Contagem de registros: {}", count);
            
            Map<String, Object> response = Map.of(
                "message", "Serviço funcionando",
                "recordCount", count,
                "timestamp", java.time.LocalDateTime.now(),
                "status", "OK"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erro no teste do serviço", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getMessage(),
                "status", "ERROR"
            ));
        }
    }

    /**
     * Endpoint de teste sem autenticação para debug
     */
    @GetMapping("/test-public")
    public ResponseEntity<Map<String, Object>> testPublicEndpoint() {
        try {
            log.info("GET /api/frota/km-controls/test-public - Testando endpoint público");
            Map<String, Object> response = Map.of(
                "message", "Endpoint público funcionando",
                "timestamp", java.time.LocalDateTime.now(),
                "service", "KmControlController",
                "status", "OK"
            );
            log.info("✅ Teste público realizado com sucesso");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erro no teste público do endpoint", e);
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
            log.info("✅ Dados de teste criados: {} registros", testData.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erro ao criar dados de teste", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar registro por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<KmControlDTO> getKmControlById(@PathVariable String id) {
        try {
            log.info("GET /api/frota/km-controls/{} - Buscando registro por ID", id);
            KmControlDTO kmControl = kmControlService.getKmControlById(id);
            
            // Log detalhado dos dados retornados
            log.info("✅ Registro encontrado com ID: {}", id);
            log.info("📊 Dados do registro:");
            log.info("  - KM Inicial: {} (tipo: {})", kmControl.getInitialKm(), kmControl.getInitialKm() != null ? kmControl.getInitialKm().getClass().getSimpleName() : "null");
            log.info("  - KM Final: {} (tipo: {})", kmControl.getFinalKm(), kmControl.getFinalKm() != null ? kmControl.getFinalKm().getClass().getSimpleName() : "null");
            log.info("  - KM Total: {} (tipo: {})", kmControl.getTotalKm(), kmControl.getTotalKm() != null ? kmControl.getTotalKm().getClass().getSimpleName() : "null");
            log.info("  - Justificativa Inicial: {}", kmControl.getInitialKmJustification());
            log.info("  - Justificativa Final: {}", kmControl.getFinalKmJustification());
            log.info("  - Data: {}", kmControl.getDate());
            log.info("  - Supervisor: {}", kmControl.getSupervisor());
            
            return ResponseEntity.ok(kmControl);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar registro com ID: {}", id, e);
            if (e.getMessage().contains("não encontrado")) {
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String supervisor,
            @RequestParam(required = false) String vehiclePlate) {
        
        try {
            log.info("GET /api/frota/km-controls/filter - Filtros: Data: {} a {}, Supervisor: {}, Veículo: {}", 
                    startDate, endDate, supervisor, vehiclePlate);
            
            List<KmControlDTO> kmControls = kmControlService.getKmControlsWithFilters(
                    startDate, endDate, supervisor, vehiclePlate);
            
            log.info("✅ Registros filtrados encontrados: {}", kmControls.size());
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar registros com filtros", e);
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
            
            log.info("✅ Registro criado com ID: {}", createdKmControl.getId());
            return ResponseEntity.ok(createdKmControl);
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro de validação ao criar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("❌ Erro ao criar registro de controle de KM", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Atualizar registro existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<KmControlDTO> updateKmControl(
            @PathVariable String id, 
            @Valid @RequestBody KmControlDTO kmControlDTO) {
        try {
            log.info("PUT /api/frota/km-controls/{} - Atualizando registro", id);
            
            KmControlDTO updatedKmControl = kmControlService.updateKmControl(id, kmControlDTO);
            
            log.info("✅ Registro atualizado com ID: {}", id);
            return ResponseEntity.ok(updatedKmControl);
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro de validação ao atualizar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("❌ Erro ao atualizar registro com ID: {}", id, e);
            if (e.getMessage().contains("não encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Deletar registro
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKmControl(@PathVariable String id) {
        try {
            log.info("DELETE /api/frota/km-controls/{} - Deletando registro", id);
            
            kmControlService.deleteKmControl(id);
            
            log.info("✅ Registro deletado com ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("❌ Erro ao deletar registro com ID: {}", id, e);
            if (e.getMessage().contains("não encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar estatísticas
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("GET /api/frota/km-controls/statistics - Estatísticas para período: {} a {}", startDate, endDate);
            
            Map<String, Object> statistics = kmControlService.getStatistics(startDate, endDate);
            
            log.info("✅ Estatísticas calculadas: {}", statistics);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("❌ Erro ao calcular estatísticas", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar registros com observações
     */
    @GetMapping("/with-observations")
    public ResponseEntity<List<KmControlDTO>> getKmControlsWithObservations() {
        try {
            log.info("GET /api/frota/km-controls/with-observations - Buscando registros com observações");
            
            List<KmControlDTO> kmControls = kmControlService.getKmControlsWithObservations();
            
            log.info("✅ Registros com observações encontrados: {}", kmControls.size());
            return ResponseEntity.ok(kmControls);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar registros com observações", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Buscar todos os supervisores disponíveis
     */
    @GetMapping("/supervisors")
    public ResponseEntity<List<String>> getAllSupervisors() {
        try {
            log.info("GET /api/frota/km-controls/supervisors - Buscando todos os supervisores");
            
            List<String> supervisors = kmControlService.getAllSupervisors();
            
            log.info("✅ Supervisores encontrados: {}", supervisors.size());
            return ResponseEntity.ok(supervisors);
        } catch (Exception e) {
            log.error("❌ Erro ao buscar supervisores", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Upload de foto do painel
     */
    @PostMapping("/{id}/dashboard-photo")
    public ResponseEntity<KmControlDTO> uploadDashboardPhoto(
            @PathVariable String id,
            @RequestParam("photo") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        try {
            log.info("POST /api/frota/km-controls/{}/dashboard-photo - Upload de foto do painel", id);
            
            // Validar arquivo
            if (file.isEmpty()) {
                log.warn("⚠️ Arquivo vazio recebido para upload");
                return ResponseEntity.badRequest().build();
            }
            
            // Validar tipo de arquivo (imagens)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("⚠️ Tipo de arquivo inválido: {}", contentType);
                return ResponseEntity.badRequest().build();
            }
            
            log.info("📸 Processando upload de foto: {} ({} bytes)", 
                    file.getOriginalFilename(), file.getSize());
            
            KmControlDTO updatedKmControl = kmControlService.uploadDashboardPhoto(id, file, description);
            
            log.info("✅ Foto do painel enviada com sucesso para o registro: {}", id);
            return ResponseEntity.ok(updatedKmControl);
            
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro de validação no upload da foto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("❌ Erro ao fazer upload da foto do painel para o registro: {}", id, e);
            if (e.getMessage().contains("não encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Gerar relatório de Controle de KM (PDF ou Excel)
     */
    @GetMapping("/report")
    public ResponseEntity<byte[]> generateKmControlReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String supervisor,
            @RequestParam(required = false) String vehiclePlate,
            @RequestParam String format) {

        try {
            log.info("GET /api/frota/km-controls/report - Gerando relatório de KM. Formato: {}", format);
            
            Map<String, Object> filters = new HashMap<>();
            if (startDate != null) filters.put("startDate", startDate);
            if (endDate != null) filters.put("endDate", endDate);
            if (supervisor != null && !"all".equals(supervisor)) filters.put("supervisor", supervisor);
            if (vehiclePlate != null && !"all".equals(vehiclePlate)) filters.put("vehiclePlate", vehiclePlate);

            List<KmControl> kmControls = kmControlService.getKmControlsEntitiesWithFilters(
                startDate, endDate, supervisor, vehiclePlate
            );
            
            log.info("Dados obtidos para relatório: {} registros de KmControl", kmControls.size());

            byte[] reportContent = reportService.generateKmControlReport(kmControls, filters, format);

            HttpHeaders headers = new HttpHeaders();
            String filename = "relatorio_km_control." + format;
            
            if ("pdf".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
            } else if ("xlsx".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            } else {
                throw new IllegalArgumentException("Formato de relatório inválido: " + format);
            }
            
            headers.setContentDispositionFormData("attachment", filename);
            log.info("✅ Relatório de KM gerado com sucesso. Tamanho: {} bytes", reportContent.length);
            return ResponseEntity.ok().headers(headers).body(reportContent);
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório de KM Control", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body(("{\"message\":\"Erro interno ao gerar relatório: " + e.getMessage() + "\"}").getBytes());
        }
    }
}
