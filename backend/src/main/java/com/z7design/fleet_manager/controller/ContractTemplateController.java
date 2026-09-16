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
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) UUID costSimulationId) {
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
    public ResponseEntity<GeneratedContractDTO> getGenerated(@PathVariable UUID id) {
        return ResponseEntity.ok(contractGenerationService.getById(id));
    }

    @GetMapping("/generated/{id}/pdf")
    @Operation(summary = "Baixar minuta em PDF pronta para assinatura")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        byte[] pdf = contractGenerationService.generatePdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=minuta-contratual-" + id + ".pdf")
                .body(pdf);
    }

    /** RF-02.3: envio para assinatura digital. */
    @PostMapping("/generated/{id}/send")
    @Operation(summary = "Enviar minuta para assinatura (DocuSign/Gov.br)")
    public ResponseEntity<GeneratedContractDTO> markSent(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "DocuSign") String provider) {
        return ResponseEntity.ok(contractGenerationService.markSent(id, provider));
    }

    /** RF-02.3: confirmar assinatura. */
    @PostMapping("/generated/{id}/sign")
    @Operation(summary = "Registrar assinatura da minuta")
    public ResponseEntity<GeneratedContractDTO> markSigned(@PathVariable UUID id) {
        return ResponseEntity.ok(contractGenerationService.markSigned(id));
    }

    @DeleteMapping("/generated/{id}")
    @Operation(summary = "Excluir minuta")
    public ResponseEntity<Void> deleteGenerated(@PathVariable UUID id) {
        contractGenerationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
