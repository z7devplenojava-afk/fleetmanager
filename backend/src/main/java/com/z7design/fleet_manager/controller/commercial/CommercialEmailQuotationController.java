package com.z7design.fleet_manager.controller.commercial;

import com.z7design.fleet_manager.dto.commercial.CommercialAttachmentDTO;
import com.z7design.fleet_manager.dto.commercial.CommercialEmailConfigDTO;
import com.z7design.fleet_manager.dto.commercial.CommercialQuotationDTO;
import com.z7design.fleet_manager.service.UserCompanyResolver;
import com.z7design.fleet_manager.service.commercial.CommercialEmailQuotationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/commercial/quotations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cotações Comerciais por E-mail", description = "Endpoints para integração IMAP, gestão de cotações e verificação de anexos seguros")
public class CommercialEmailQuotationController {

    private final CommercialEmailQuotationService quotationService;
    private final UserCompanyResolver userCompanyResolver;

    @GetMapping("/config")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obter credenciais e configuração do e-mail comercial")
    public ResponseEntity<CommercialEmailConfigDTO> getConfig() {
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        CommercialEmailConfigDTO config = quotationService.getConfig(companyId);
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Salvar configurações do e-mail comercial")
    public ResponseEntity<CommercialEmailConfigDTO> saveConfig(@RequestBody CommercialEmailConfigDTO dto) {
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        CommercialEmailConfigDTO saved = quotationService.saveConfig(companyId, dto);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/config/test")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Testar conexão com o servidor de e-mail")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestBody CommercialEmailConfigDTO dto) {
        Map<String, Object> result = quotationService.testConnection(dto);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sync")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Sincronizar e-mails e analisar novas cotações")
    public ResponseEntity<Map<String, Object>> syncQuotations() {
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        Map<String, Object> result = quotationService.syncCommercialQuotations(companyId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar cotações solicitadas com filtros")
    public ResponseEntity<Page<CommercialQuotationDTO>> listQuotations(
            @RequestParam(name = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "receivedAt"));
        Page<CommercialQuotationDTO> result = quotationService.listQuotations(companyId, status, query, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obter detalhes de uma cotação")
    public ResponseEntity<CommercialQuotationDTO> getQuotation(@PathVariable("id") UUID id) {
        CommercialQuotationDTO result = quotationService.getQuotationById(id);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Atualizar status de cotação comercial")
    public ResponseEntity<CommercialQuotationDTO> updateStatus(
            @PathVariable("id") UUID id,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "notes", required = false) String notes,
            @RequestParam(name = "proposalId", required = false) UUID proposalId
    ) {
        CommercialQuotationDTO updated = quotationService.updateStatus(id, status, notes, proposalId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/attachments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload manual de arquivo complementar (.pdf, .xlsx, .xls)")
    public ResponseEntity<CommercialAttachmentDTO> uploadAttachment(
            @PathVariable("id") UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();
        CommercialAttachmentDTO attachment = quotationService.addManualAttachment(id, file, companyId);
        return ResponseEntity.ok(attachment);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download seguro de anexo verificado")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable("attachmentId") UUID attachmentId) {
        try {
            Path filePath = quotationService.getAttachmentPath(attachmentId);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filePath.getFileName().toString() + "\"")
                    .body(resource);

        } catch (SecurityException se) {
            log.warn("⚠️ Tentativa de download de anexo bloqueado: {}", se.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            log.error("Erro ao baixar anexo {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
