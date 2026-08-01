package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ClientDocumentationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/client-documentation")
@RequiredArgsConstructor
@Tag(name = "Documentação de Clientes", description = "Gestão de documentação mensal por cliente")
@SecurityRequirement(name = "bearerAuth")
public class ClientDocumentationController {

    private final ClientDocumentationService service;

    // ==================== DOCUMENTATION ====================

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Listar documentações de um cliente")
    public ResponseEntity<List<ClientDocumentationDTO>> listByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(service.listByClient(clientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Obter documentação por ID")
    public ResponseEntity<ClientDocumentationDTO> getDocumentation(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getDocumentation(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Criar nova documentação para um cliente em um período")
    public ResponseEntity<ClientDocumentationDTO> createDocumentation(
            @Valid @RequestBody CreateClientDocumentationRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.createDocumentation(request, user.getCompanyId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir documentação")
    public ResponseEntity<Void> deleteDocumentation(@PathVariable UUID id) {
        service.deleteDocumentation(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== STAGES ====================

    @GetMapping("/{documentationId}/stages")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Listar etapas de uma documentação")
    public ResponseEntity<List<ClientDocStageDTO>> listStages(@PathVariable UUID documentationId) {
        return ResponseEntity.ok(service.listStages(documentationId));
    }

    @PostMapping("/stages")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Criar etapa em uma documentação")
    public ResponseEntity<ClientDocStageDTO> createStage(@Valid @RequestBody CreateClientDocStageRequest request) {
        return ResponseEntity.ok(service.createStage(request));
    }

    @PutMapping("/stages/{stageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Renomear etapa")
    public ResponseEntity<ClientDocStageDTO> renameStage(
            @PathVariable UUID stageId,
            @RequestBody Map<String, String> body) {
        String newName = body.get("name");
        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.renameStage(stageId, newName));
    }

    @DeleteMapping("/stages/{stageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir etapa")
    public ResponseEntity<Void> deleteStage(@PathVariable UUID stageId) {
        service.deleteStage(stageId);
        return ResponseEntity.noContent().build();
    }

    // ==================== CATEGORIES ====================

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Listar categorias de documentos disponíveis")
    public ResponseEntity<List<ClientDocCategoryDTO>> listCategories(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listCategories(user.getCompanyId()));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Criar nova categoria de documento")
    public ResponseEntity<ClientDocCategoryDTO> createCategory(
            @Valid @RequestBody CreateClientDocCategoryRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.createCategory(request, user.getCompanyId()));
    }

    @DeleteMapping("/categories/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir categoria")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID categoryId) {
        service.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    // ==================== FILES ====================

    @GetMapping("/stages/{stageId}/categories/{categoryId}/files")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Listar arquivos de uma etapa + categoria")
    public ResponseEntity<List<ClientDocFileDTO>> listFiles(
            @PathVariable UUID stageId,
            @PathVariable UUID categoryId) {
        return ResponseEntity.ok(service.listFiles(stageId, categoryId));
    }

    @PostMapping(value = "/stages/{stageId}/categories/{categoryId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Fazer upload de arquivo para uma etapa + categoria")
    public ResponseEntity<ClientDocFileDTO> uploadFile(
            @PathVariable UUID stageId,
            @PathVariable UUID categoryId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.uploadFile(stageId, categoryId, file, user.getCompanyId(), user.getId()));
    }

    @GetMapping("/files/{fileId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Baixar arquivo")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        Resource resource = service.downloadFile(fileId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/files/{fileId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Excluir arquivo")
    public ResponseEntity<Void> deleteFile(@PathVariable UUID fileId) {
        service.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    // ==================== FULL STRUCTURE ====================

    @GetMapping("/{documentationId}/structure")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'SUPER_ADMIN')")
    @Operation(summary = "Obter estrutura completa (documentação + etapas + categorias + arquivos)")
    public ResponseEntity<Map<String, Object>> getFullStructure(@PathVariable UUID documentationId) {
        return ResponseEntity.ok(service.getFullStructure(documentationId));
    }
}
