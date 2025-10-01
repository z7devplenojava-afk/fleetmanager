package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.servlet.http.HttpServletRequest;

import br.com.fleetmanager.service.SignatureService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.dto.SignatureRequestDTO;
import br.com.fleetmanager.model.DocumentSignature;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
@Tag(name = "Assinaturas Eletrônicas", description = "Endpoints para gestão de assinaturas eletrônicas de documentos.")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class SignatureController {

    private final SignatureService signatureService;

    @Operation(summary = "Registra uma nova assinatura eletrônica",
               description = "Registra a assinatura eletrônica de um documento específico. Requer o papel de ADMIN, RH ou OPERACIONAL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assinatura registrada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DocumentSignature.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<DocumentSignature> createSignature(
            @RequestBody SignatureRequestDTO signatureRequest,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        
        try {
            // Obter IP do cliente
            String clientIp = getClientIpAddress(request);
            
            DocumentSignature signature = signatureService.createSignature(
                signatureRequest.getDocumentId(),
                signatureRequest.getSignerName(),
                signatureRequest.getSignerCpf(),
                signatureRequest.getSignerRole(),
                clientIp,
                userDetails.getUsername()
            );
            
            return ResponseEntity.ok(signature);
        } catch (Exception e) {
            log.error("Erro ao criar assinatura: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Operation(summary = "Busca assinaturas por documento",
               description = "Retorna todas as assinaturas de um documento específico. Requer o papel de ADMIN, RH ou OPERACIONAL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de assinaturas do documento",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DocumentSignature.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<DocumentSignature>> getSignaturesByDocument(@PathVariable UUID documentId) {
        List<DocumentSignature> signatures = signatureService.findByDocumentId(documentId);
        return ResponseEntity.ok(signatures);
    }

    @Operation(summary = "Busca uma assinatura específica",
               description = "Retorna os detalhes de uma assinatura específica. Requer o papel de ADMIN, RH ou OPERACIONAL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assinatura encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DocumentSignature.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assinatura não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<DocumentSignature> getSignature(@PathVariable UUID id) {
        DocumentSignature signature = signatureService.findById(id);
        return ResponseEntity.ok(signature);
    }

    @Operation(summary = "Retorna todas as assinaturas",
               description = "Retorna uma lista de todas as assinaturas eletrônicas. Requer o papel de ADMIN ou RH.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as assinaturas",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DocumentSignature.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<DocumentSignature>> getAllSignatures() {
        List<DocumentSignature> signatures = signatureService.findAll();
        return ResponseEntity.ok(signatures);
    }

    @Operation(summary = "Valida uma assinatura",
               description = "Valida se uma assinatura é autêntica através do hash. Requer o papel de ADMIN, RH ou OPERACIONAL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assinatura válida"),
            @ApiResponse(responseCode = "400", description = "Assinatura inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Assinatura não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/validate")
    public ResponseEntity<Boolean> validateSignature(@PathVariable UUID id) {
        boolean isValid = signatureService.validateSignature(id);
        return ResponseEntity.ok(isValid);
    }

    /**
     * Obtém o endereço IP real do cliente, considerando proxies
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
} 