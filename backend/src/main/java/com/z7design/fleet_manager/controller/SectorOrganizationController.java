package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.SectorOrganizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sector-organization")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SectorOrganizationController {

    private final SectorOrganizationService sectorOrganizationService;

    /**
     * Processa todos os documentos unificados e organiza por setor
     * POST /api/sector-organization/process
     */
    @PostMapping("/process")
    // @PreAuthorize - TEMPORARIAMENTE REMOVIDO PARA DEBUG (endpoint jÃ¡ protegido no SecurityConfig)
    public ResponseEntity<Map<String, Object>> processAllDocuments(
        @RequestParam(required = false) Integer filterMonth,
        @RequestParam(required = false) Integer filterYear
    ) {
        try {
            log.info("ðŸš€ Iniciando processamento de documentos por setor (MÃªs: {}, Ano: {})", 
                filterMonth, filterYear);
            
            SectorOrganizationService.BatchOrganizationResult result = 
                sectorOrganizationService.organizeAllDocuments(filterMonth, filterYear);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());
            response.put("totalDocuments", result.getTotalDocuments());
            response.put("successCount", result.getSuccessCount());
            response.put("failedCount", result.getFailedCount());
            response.put("results", result.getResults());
            
            if (result.isSuccess()) {
                log.info("âœ… Processamento concluÃ­do: {} documentos organizados com sucesso", 
                    result.getSuccessCount());
                return ResponseEntity.ok(response);
            } else {
                log.warn("âš ï¸ Processamento concluÃ­do com falhas: {}", result.getMessage());
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(response);
            }
            
        } catch (Exception e) {
            log.error("âŒ Erro ao processar documentos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao processar documentos: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Lista documentos organizados por setor
     * GET /api/sector-organization/list
     */
    @GetMapping("/list")
    // @PreAuthorize - TEMPORARIAMENTE REMOVIDO PARA DEBUG (endpoint jÃ¡ protegido no SecurityConfig)
    public ResponseEntity<Map<String, Object>> listOrganizedDocuments() {
        try {
            log.info("ðŸ“‹ Listando documentos organizados por setor");
            
            Map<String, Object> result = sectorOrganizationService.listOrganizedDocuments();
            
            log.info("âœ… Listagem concluÃ­da: {} setores, {} documentos", 
                result.get("totalSectors"), result.get("totalDocuments"));
            
            return ResponseEntity.ok(result);
            
        } catch (IOException e) {
            log.error("âŒ Erro ao listar documentos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao listar documentos: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Endpoint pÃºblico para listar documentos (sem autenticaÃ§Ã£o - TEMPORÃRIO PARA DEBUG)
     * GET /api/sector-organization/public/list
     */
    @GetMapping("/public/list")
    public ResponseEntity<Map<String, Object>> listOrganizedDocumentsPublic() {
        try {
            log.info("ðŸ“‹ [PUBLIC] Listando documentos organizados por setor");
            
            Map<String, Object> result = sectorOrganizationService.listOrganizedDocuments();
            
            log.info("âœ… [PUBLIC] Listagem concluÃ­da: {} setores, {} documentos", 
                result.get("totalSectors"), result.get("totalDocuments"));
            
            return ResponseEntity.ok(result);
            
        } catch (IOException e) {
            log.error("âŒ [PUBLIC] Erro ao listar documentos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao listar documentos: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Deleta documentos organizados por setor
     * DELETE /api/sector-organization/delete
     */
    @DeleteMapping("/delete")
    // @PreAuthorize - TEMPORARIAMENTE REMOVIDO PARA DEBUG
    public ResponseEntity<Map<String, Object>> deleteDocuments(@RequestBody Map<String, Object> request) {
        try {
            log.info("ðŸ—‘ï¸ SolicitaÃ§Ã£o de exclusÃ£o recebida");
            
            @SuppressWarnings("unchecked")
            List<String> filePaths = (List<String>) request.get("filePaths");
            
            if (filePaths == null || filePaths.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Nenhum arquivo especificado para exclusÃ£o");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            int deletedCount = 0;
            int failedCount = 0;
            List<String> errors = new ArrayList<>();
            
            for (String filePath : filePaths) {
                try {
                    java.nio.file.Path path = java.nio.file.Paths.get(filePath);
                    if (java.nio.file.Files.exists(path)) {
                        java.nio.file.Files.delete(path);
                        deletedCount++;
                        log.info("âœ… Arquivo deletado: {}", filePath);
                    } else {
                        log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", filePath);
                        failedCount++;
                        errors.add("Arquivo nÃ£o encontrado: " + filePath);
                    }
                } catch (Exception e) {
                    log.error("âŒ Erro ao deletar arquivo {}: {}", filePath, e.getMessage());
                    failedCount++;
                    errors.add("Erro ao deletar " + filePath + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", deletedCount > 0);
            response.put("deletedCount", deletedCount);
            response.put("failedCount", failedCount);
            response.put("errors", errors);
            response.put("message", String.format("%d arquivo(s) deletado(s), %d falha(s)", deletedCount, failedCount));
            
            log.info("âœ… ExclusÃ£o concluÃ­da: {} deletados, {} falhas", deletedCount, failedCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao processar exclusÃ£o: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao processar exclusÃ£o: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Download individual de PDF
     * GET /api/sector-organization/download/{sector}/{period}/{fileName}
     */
    @GetMapping("/download/{sector}/{period}/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @PathVariable String sector,
            @PathVariable String period,
            @PathVariable String fileName) {
        try {
            log.info("ðŸ“¥ Download solicitado: Setor={}, PerÃ­odo={}, Arquivo={}", sector, period, fileName);
            
            org.springframework.core.io.Resource resource = sectorOrganizationService.downloadDocument(sector, period, fileName);
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + fileName + "\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("âŒ Erro ao baixar documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Download em massa (ZIP) por setor e perÃ­odo
     * GET /api/sector-organization/download-zip/{sector}/{period}
     */
    @GetMapping("/download-zip/{sector}/{period}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadSectorZip(
            @PathVariable String sector,
            @PathVariable String period) {
        try {
            log.info("ðŸ“¦ Download ZIP solicitado: Setor={}, PerÃ­odo={}", sector, period);
            
            org.springframework.core.io.Resource resource = sectorOrganizationService.createZipForSector(sector, period);
            
            String zipFileName = String.format("%s_%s.zip", sector.replaceAll("[^a-zA-Z0-9]", "_"), period);
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + zipFileName + "\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/zip")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("âŒ Erro ao criar ZIP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Enviar documento individual por email
     * POST /api/sector-organization/send-email
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody Map<String, Object> request) {
        try {
            String filePath = (String) request.get("filePath");
            String cpf = (String) request.get("cpf");
            String employeeName = (String) request.get("employeeName");
            
            log.info("ðŸ“§ SolicitaÃ§Ã£o de envio por email: CPF={}, Arquivo={}", cpf, filePath);
            
            Map<String, Object> result = sectorOrganizationService.sendDocumentByEmail(filePath, cpf, employeeName);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar email: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao enviar email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Enviar documento individual por WhatsApp
     * POST /api/sector-organization/send-whatsapp
     */
    @PostMapping("/send-whatsapp")
    public ResponseEntity<Map<String, Object>> sendWhatsApp(@RequestBody Map<String, Object> request) {
        try {
            String filePath = (String) request.get("filePath");
            String cpf = (String) request.get("cpf");
            
            log.info("ðŸ“± SolicitaÃ§Ã£o de envio por WhatsApp: CPF={}, Arquivo={}", cpf, filePath);
            
            Map<String, Object> result = sectorOrganizationService.sendDocumentByWhatsApp(filePath, cpf);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar WhatsApp: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erro ao enviar WhatsApp: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Endpoint de health check para verificar se o serviÃ§o estÃ¡ ativo
     * GET /api/sector-organization/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "SectorOrganization");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}


