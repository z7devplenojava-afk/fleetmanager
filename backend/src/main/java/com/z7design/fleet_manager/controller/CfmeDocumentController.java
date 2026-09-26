package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CfmeDocumentDTO;
import com.z7design.fleet_manager.dto.CfmeDocumentUpdateDTO;
import com.z7design.fleet_manager.model.CfmeDocument;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.CfmeDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cfme-documents")
@RequiredArgsConstructor
@Tag(name = "Certificações CFME", description = "Controle de Certificações Federais, Municipais e Estaduais")
public class CfmeDocumentController {

    private final CfmeDocumentService service;

    @GetMapping
    @Operation(summary = "Lista os documentos CFME (filtro opcional por categoria)")
    public ResponseEntity<List<CfmeDocumentDTO>> list(
            @RequestParam(value = "category", required = false) CfmeDocument.DocumentCategory category,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.list(user != null ? user.getCompanyId() : null, category));
    }

    @GetMapping("/categories")
    @Operation(summary = "Lista as categorias disponíveis")
    public ResponseEntity<List<CategoryOption>> categories() {
        List<CategoryOption> options = java.util.Arrays.stream(CfmeDocument.DocumentCategory.values())
                .map(c -> new CategoryOption(c.name(), c.getDescription()))
                .toList();
        return ResponseEntity.ok(options);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um documento CFME por ID")
    public ResponseEntity<CfmeDocumentDTO> getById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getById(id, user != null ? user.getCompanyId() : null));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Faz upload de um documento CFME (PDF/Excel) com metadados e validade")
    public ResponseEntity<CfmeDocumentDTO> upload(
            @RequestParam("category") CfmeDocument.DocumentCategory category,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "issuer", required = false) String issuer,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.upload(category, title, issuer, documentNumber,
                issueDate, expiryDate, notes, file, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os metadados de um documento CFME")
    public ResponseEntity<CfmeDocumentDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody CfmeDocumentUpdateDTO dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, dto, user != null ? user.getCompanyId() : null));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Baixa o arquivo de um documento CFME")
    public ResponseEntity<Resource> download(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        CfmeDocumentDTO dto = service.getById(id, companyId);
        Resource resource = service.download(id, companyId);
        String filename = encodeFilename(dto.getOriginalName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/view")
    @Operation(summary = "Visualiza o arquivo de um documento CFME no navegador")
    public ResponseEntity<Resource> view(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        UUID companyId = user != null ? user.getCompanyId() : null;
        CfmeDocumentDTO dto = service.getById(id, companyId);
        Resource resource = service.download(id, companyId);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (dto.getMimeType() != null) {
            try {
                mediaType = MediaType.parseMediaType(dto.getMimeType());
            } catch (Exception ignored) {
                // mantém octet-stream
            }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + encodeFilename(dto.getOriginalName()) + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui um documento CFME e o arquivo físico")
    public ResponseEntity<Void> delete(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user != null ? user.getCompanyId() : null);
        return ResponseEntity.noContent().build();
    }

    private String encodeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "documento";
        }
        return URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
    }

    /** Opção de categoria exposta para o frontend. */
    public record CategoryOption(String value, String label) {
    }
}
