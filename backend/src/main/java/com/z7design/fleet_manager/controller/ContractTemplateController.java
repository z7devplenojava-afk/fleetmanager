package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.GeneratedContractDTO;
import com.z7design.fleet_manager.model.ContractTemplate;
import com.z7design.fleet_manager.service.ContractGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 2: Gestão de Propostas Comerciais & Minutas Contratuais.
 */
@RestController
@RequestMapping("/api/contract-templates")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Minutas Contratuais", description = "Templates contratuais e geração de minutas (PRD Módulo 2)")
public class ContractTemplateController {

    private final ContractGenerationService contractGenerationService;
    private final com.z7design.fleet_manager.service.ContractPresignedUrlService presignedUrlService;

    // ===== Templates (RF-02.1) =====

    @GetMapping
    @Operation(summary = "Listar modelos contratuais disponíveis")
    public ResponseEntity<List<ContractTemplate>> listTemplates() {
        return ResponseEntity.ok(contractGenerationService.listTemplates());
    }

    @PostMapping
    @Operation(summary = "Criar ou atualizar modelo contratual")
    public ResponseEntity<ContractTemplate> saveTemplate(@RequestBody ContractTemplate template) {
        return ResponseEntity.ok(contractGenerationService.saveTemplate(template));
    }

    // ===== Minutas geradas =====

    @PostMapping("/generate")
    @Operation(summary = "Gerar minuta contratual a partir de template + precificação aprovada (M1)")
    public ResponseEntity<GeneratedContractDTO> generate(@Valid @RequestBody GeneratedContractDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractGenerationService.generate(request));
    }

    @GetMapping("/generated")
    @Operation(summary = "Listar minutas por cliente ou simulação de custos")
    public ResponseEntity<List<GeneratedContractDTO>> listGenerated(
            @RequestParam(name = "clientId", required = false) UUID clientId,
            @RequestParam(name = "costSimulationId", required = false) UUID costSimulationId) {
        if (costSimulationId != null) {
            return ResponseEntity.ok(contractGenerationService.listBySimulation(costSimulationId));
        }
        if (clientId != null) {
            return ResponseEntity.ok(contractGenerationService.listByClient(clientId));
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/generated/{id}")
    @Operation(summary = "Buscar minuta por ID")
    public ResponseEntity<GeneratedContractDTO> getGenerated(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(contractGenerationService.getById(id));
    }

    @GetMapping("/generated/{id}/pdf")
    @Operation(summary = "Baixar minuta em PDF pronta para assinatura")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable("id") UUID id) {
        byte[] pdf = contractGenerationService.generatePdf(id);
        GeneratedContractDTO dto = contractGenerationService.getById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=minuta-contratual-" + id + ".pdf")
                .header("X-Contract-SHA256", dto.getSha256Hash() != null ? dto.getSha256Hash() : "")
                .body(pdf);
    }

    @GetMapping("/generated/{id}/presigned-url")
    @Operation(summary = "Gerar Presigned URL temporária para acesso seguro ao PDF (300s)")
    public ResponseEntity<java.util.Map<String, Object>> getPresignedUrl(
            @PathVariable("id") UUID id,
            jakarta.servlet.http.HttpServletRequest request) {

        String baseUrl = request.getRequestURL().toString().replace(request.getRequestURI(), "");
        UUID userId = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.z7design.fleet_manager.model.User u) {
            userId = u.getId();
        }

        String presignedUrl = presignedUrlService.generatePresignedUrl(id, userId, baseUrl);
        GeneratedContractDTO dto = contractGenerationService.getById(id);

        return ResponseEntity.ok(java.util.Map.of(
                "contractId", id,
                "presignedUrl", presignedUrl,
                "expiresInSeconds", 300,
                "sha256Hash", dto.getSha256Hash() != null ? dto.getSha256Hash() : ""
        ));
    }

    @GetMapping("/generated/{id}/presigned-download")
    @Operation(summary = "Download de contrato via Presigned URL temporária")
    public ResponseEntity<?> downloadViaPresignedUrl(
            @PathVariable("id") UUID id,
            @RequestParam("token") String token) {

        if (!presignedUrlService.validatePresignedToken(id, token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("error", "Presigned URL inválida ou expirada. Gere um novo link temporário."));
        }

        byte[] pdf = contractGenerationService.generatePdf(id);
        GeneratedContractDTO dto = contractGenerationService.getById(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=contrato-" + id + ".pdf")
                .header("X-Contract-SHA256", dto.getSha256Hash() != null ? dto.getSha256Hash() : "")
                .body(pdf);
    }

    @PostMapping("/generated/{id}/accept-electronic")
    @Operation(summary = "Registrar aceite eletrônico com auditoria (IP, User-Agent, Data/Hora UTC e SHA-256)")
    public ResponseEntity<GeneratedContractDTO> acceptContract(
            @PathVariable("id") UUID id,
            jakarta.servlet.http.HttpServletRequest request) {

        UUID userId = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.z7design.fleet_manager.model.User u) {
            userId = u.getId();
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        String userAgent = request.getHeader("User-Agent");

        GeneratedContractDTO accepted = contractGenerationService.acceptContract(id, userId, ip, userAgent);
        return ResponseEntity.ok(accepted);
    }

    /** RF-02.3: envio para assinatura digital. */
    @PostMapping("/generated/{id}/send")
    @Operation(summary = "Enviar minuta para assinatura (DocuSign/Gov.br)")
    public ResponseEntity<GeneratedContractDTO> markSent(
            @PathVariable("id") UUID id,
            @RequestParam(name = "provider", defaultValue = "DocuSign") String provider) {
        return ResponseEntity.ok(contractGenerationService.markSent(id, provider));
    }

    /** RF-02.3: confirmar assinatura. */
    @PostMapping("/generated/{id}/sign")
    @Operation(summary = "Registrar assinatura da minuta")
    public ResponseEntity<GeneratedContractDTO> markSigned(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(contractGenerationService.markSigned(id));
    }

    @DeleteMapping("/generated/{id}")
    @Operation(summary = "Excluir minuta")
    public ResponseEntity<Void> deleteGenerated(@PathVariable("id") UUID id) {
        contractGenerationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
