package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ClientDocumentationDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ClientDocumentationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints da área do cliente para acompanhar a documentação mensal
 * (clientes -> Ano/Mês -> etapas 1ª/2ª -> categorias -> arquivos).
 * <p>
 * Acesso somente leitura, restrito aos clientes da empresa do usuário
 * autenticado (CLIENT_MANAGER, admin etc.).
 */
@RestController
@RequestMapping("/api/client-area/documentation")
@RequiredArgsConstructor
@Tag(name = "Client Area Documentation", description = "Documentação mensal na área do cliente")
public class ClientAreaDocumentationController {

    private final ClientDocumentationService service;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    @Operation(summary = "Listar documentações da empresa do usuário")
    public ResponseEntity<List<ClientDocumentationDTO>> listByCompany(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listByCompany(user.getCompanyId()));
    }

    @GetMapping("/{documentationId}/structure")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    @Operation(summary = "Estrutura completa (etapas + categorias + arquivos) com verificação de empresa")
    public ResponseEntity<Map<String, Object>> getStructure(
            @PathVariable UUID documentationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getFullStructureForCompany(documentationId, user.getCompanyId()));
    }

    @GetMapping("/files/{fileId}/download")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT_MANAGER', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    @Operation(summary = "Baixar arquivo com verificação de empresa")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable UUID fileId,
            @AuthenticationPrincipal User user) {
        Resource resource = service.downloadFileForCompany(fileId, user.getCompanyId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
