package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ImportJobLog;
import com.z7design.fleet_manager.model.PontoRaw;
import com.z7design.fleet_manager.service.PontoImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ponto-import")
@RequiredArgsConstructor
@Slf4j
public class PontoImportController {

    private final PontoImportService pontoImportService;

    @PostMapping("/file")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_IMPORT', 'PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> importFromFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // TODO: Extrair UUID do usuÃ¡rio do userDetails
            // Por enquanto, usando um UUID fixo (deve ser ajustado conforme implementaÃ§Ã£o de autenticaÃ§Ã£o)
            UUID userId = UUID.randomUUID(); // PLACEHOLDER - ajustar conforme necessÃ¡rio
            
            ImportJobLog importJob = pontoImportService.importFromFile(file, userId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ImportaÃ§Ã£o iniciada com sucesso",
                    "data", importJob
            ));
        } catch (Exception e) {
            log.error("Erro ao importar arquivo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/list")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_IMPORT', 'PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> importFromList(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> batidas = (List<Map<String, Object>>) request.get("batidas");
            String sourceType = (String) request.getOrDefault("sourceType", "API");
            
            // TODO: Extrair UUID do usuÃ¡rio do userDetails
            UUID userId = UUID.randomUUID(); // PLACEHOLDER - ajustar conforme necessÃ¡rio
            
            ImportJobLog importJob = pontoImportService.importFromList(batidas, userId, sourceType);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ImportaÃ§Ã£o concluÃ­da",
                    "data", importJob
            ));
        } catch (Exception e) {
            log.error("Erro ao importar lista: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_READ', 'PONTO_RAW_IMPORT', 'PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAllImportJobs() {
        try {
            List<ImportJobLog> jobs = pontoImportService.findAllImportJobs();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", jobs
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar jobs de importaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/jobs/{id}")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_READ', 'PONTO_RAW_IMPORT', 'PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getImportJobById(@PathVariable("id") UUID id) {
        try {
            ImportJobLog importJob = pontoImportService.findImportJobById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", importJob
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar job de importaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/unprocessed")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_READ', 'PONTO_RAW_IMPORT', 'PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getUnprocessedBatidas(@RequestParam(value = "employeeId", required = false) UUID employeeId) {
        try {
            List<PontoRaw> unprocessed = pontoImportService.findUnprocessedBatidas(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", unprocessed,
                    "count", unprocessed.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar batidas nÃ£o processadas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






