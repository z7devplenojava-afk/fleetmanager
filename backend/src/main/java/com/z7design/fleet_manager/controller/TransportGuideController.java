package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.TransportGuideDTO;
import com.z7design.fleet_manager.model.enums.TransportGuideStatus;
import com.z7design.fleet_manager.service.TransportGuideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/transport-guides")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Guias de Transporte", description = "GestÃ£o de guias de transporte de armas e muniÃ§Ãµes")
public class TransportGuideController {

    private final TransportGuideService transportGuideService;

    @GetMapping
    @Operation(summary = "Listar todas as guias de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<List<TransportGuideDTO>> getAllTransportGuides(
            @RequestParam(required = false) TransportGuideStatus status,
            @RequestParam(required = false) String empresa,
            @RequestParam(required = false) String cnpj
    ) {
        log.info("GET /api/transport-guides - Buscando guias de transporte");
        List<TransportGuideDTO> guides = transportGuideService.getTransportGuidesByFilters(status, empresa, cnpj);
        log.info("âœ… Retornadas {} guias de transporte", guides.size());
        return ResponseEntity.ok(guides);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar guia de transporte por ID")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<TransportGuideDTO> getTransportGuideById(@PathVariable Long id) {
        log.info("GET /api/transport-guides/{} - Buscando guia de transporte", id);
        TransportGuideDTO guide = transportGuideService.getTransportGuideById(id);
        return ResponseEntity.ok(guide);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Criar nova guia de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<TransportGuideDTO> createTransportGuide(
            @RequestParam String cnpj,
            @RequestParam String empresa,
            @RequestParam(required = false) String numeroColete,
            @RequestParam String numeroArma,
            @RequestParam String calibre,
            @RequestParam Integer qtdMunicoes,
            @RequestParam String origem,
            @RequestParam String destino,
            @RequestParam String trajeto,
            @RequestParam String motivo,
            @RequestParam(required = false) MultipartFile arquivoGuia
    ) {
        log.info("POST /api/transport-guides - Criando nova guia de transporte");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "system";
        
        TransportGuideDTO dto = TransportGuideDTO.builder()
                .cnpj(cnpj)
                .empresa(empresa)
                .numeroColete(numeroColete)
                .numeroArma(numeroArma)
                .calibre(calibre)
                .qtdMunicoes(qtdMunicoes)
                .origem(origem)
                .destino(destino)
                .trajeto(trajeto)
                .motivo(motivo)
                .build();
        
        TransportGuideDTO created = transportGuideService.createTransportGuide(dto, arquivoGuia, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Atualizar guia de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<TransportGuideDTO> updateTransportGuide(
            @PathVariable Long id,
            @RequestParam String cnpj,
            @RequestParam String empresa,
            @RequestParam(required = false) String numeroColete,
            @RequestParam String numeroArma,
            @RequestParam String calibre,
            @RequestParam Integer qtdMunicoes,
            @RequestParam String origem,
            @RequestParam String destino,
            @RequestParam String trajeto,
            @RequestParam String motivo,
            @RequestParam(required = false) MultipartFile arquivoGuia
    ) {
        log.info("PUT /api/transport-guides/{} - Atualizando guia de transporte", id);
        
        TransportGuideDTO dto = TransportGuideDTO.builder()
                .cnpj(cnpj)
                .empresa(empresa)
                .numeroColete(numeroColete)
                .numeroArma(numeroArma)
                .calibre(calibre)
                .qtdMunicoes(qtdMunicoes)
                .origem(origem)
                .destino(destino)
                .trajeto(trajeto)
                .motivo(motivo)
                .build();
        
        TransportGuideDTO updated = transportGuideService.updateTransportGuide(id, dto, arquivoGuia);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir guia de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<Void> deleteTransportGuide(@PathVariable Long id) {
        log.info("DELETE /api/transport-guides/{} - Excluindo guia de transporte", id);
        transportGuideService.deleteTransportGuide(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Aprovar guia de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TransportGuideDTO> approveTransportGuide(
            @PathVariable Long id,
            @RequestParam String supervisorId
    ) {
        log.info("PATCH /api/transport-guides/{}/approve - Aprovando guia de transporte", id);
        TransportGuideDTO approved = transportGuideService.approveTransportGuide(id, supervisorId);
        return ResponseEntity.ok(approved);
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Rejeitar guia de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<TransportGuideDTO> rejectTransportGuide(
            @PathVariable Long id,
            @RequestParam String supervisorId,
            @RequestParam String reason
    ) {
        log.info("PATCH /api/transport-guides/{}/reject - Rejeitando guia de transporte", id);
        TransportGuideDTO rejected = transportGuideService.rejectTransportGuide(id, supervisorId, reason);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Gerar relatÃ³rio PDF de guias de transporte")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'OPERACIONAL', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERACIONAL')")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(required = false) TransportGuideStatus status,
            @RequestParam(required = false) String empresa,
            @RequestParam(required = false) String startDate
    ) {
        log.info("GET /api/transport-guides/pdf - Gerando relatÃ³rio PDF");
        try {
            byte[] pdfBytes = transportGuideService.generatePDFReport(status, empresa, startDate);
            String fileName = "guias-transporte-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de guias de transporte: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


