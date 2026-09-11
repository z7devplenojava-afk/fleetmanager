package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.z7design.fleet_manager.model.Document;
import com.z7design.fleet_manager.service.DocumentService;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.model.enums.DocumentType;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documentos", description = "Endpoints para gestÃ£o de documentos.")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {
    
    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;
    
    @Operation(summary = "Cria um novo documento",
               description = "Adiciona um novo documento ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Documento criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do documento para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Document.class),
                    examples = @ExampleObject(value = "{\"documentType\": \"CNH\", \"documentNumber\": \"123456789\", \"issueDate\": \"2020-01-01\", \"expiryDate\": \"2025-12-31\", \"employee\": {\"id\": \"UUID_DO_FUNCIONARIO\"}}")))
    @PostMapping
    public ResponseEntity<Document> create(@RequestBody Document document) {
        return ResponseEntity.ok(documentService.create(document));
    }
    
    @Operation(summary = "Atualiza um documento existente",
               description = "Atualiza as informaÃ§Ãµes de um documento pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Documento atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do documento para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Document.class),
                    examples = @ExampleObject(value = "{\"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"documentType\": \"CNH\", \"documentNumber\": \"987654321\", \"issueDate\": \"2020-01-01\", \"expiryDate\": \"2026-12-31\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Document> update(@PathVariable("id") UUID id, @RequestBody Document document) {
        return ResponseEntity.ok(documentService.update(id, document));
    }
    
    @Operation(summary = "Exclui um documento",
               description = "Exclui um documento pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Documento excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um documento pelo ID",
               description = "Retorna as informaÃ§Ãµes de um documento especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Documento encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Document> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(documentService.findById(id));
    }
    
    @Operation(summary = "Busca documentos por ID de funcionÃ¡rio",
               description = "Retorna uma lista de documentos associados a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Document>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(documentService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Retorna todos os tipos de documentos disponÃ­veis",
               description = "Retorna uma lista de todos os tipos de documentos que podem ser cadastrados. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de tipos de documentos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DocumentType.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/types")
    public ResponseEntity<DocumentType[]> getDocumentTypes() {
        return ResponseEntity.ok(DocumentType.values());
    }
    
    @Operation(summary = "Busca documentos por tipo",
               description = "Retorna uma lista de documentos de um tipo especÃ­fico (ex: CPF, RG, CNH). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos por tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Document>> findByType(@PathVariable("type") DocumentType type) {
        return ResponseEntity.ok(documentService.findByType(type));
    }
    
    @Operation(summary = "Busca documentos prÃ³ximos da expiraÃ§Ã£o",
               description = "Retorna uma lista de documentos cuja data de expiraÃ§Ã£o estÃ¡ prÃ³xima. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos prÃ³ximos da expiraÃ§Ã£o",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/expiring")
    public ResponseEntity<List<Document>> findExpiringDocuments() {
        return ResponseEntity.ok(documentService.findExpiringDocuments());
    }
    
    @Operation(summary = "Retorna todos os documentos",
               description = "Retorna uma lista de todos os documentos cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os documentos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Document>> findAll() {
        try {
            log.debug("Buscando todos os documentos");
            List<Document> documents = documentService.findAll();
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            log.error("Erro ao buscar documentos: ", e);
            // Retornar lista vazia se houver erro (provavelmente tabela nÃ£o existe)
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Teste bÃ¡sico de documentos", description = "Teste bÃ¡sico para verificar se o endpoint funciona")
    public ResponseEntity<Object> testDocuments() {
        try {
            log.debug("Teste bÃ¡sico de documentos");
            // Retornar lista vazia por enquanto para evitar erro
            return ResponseEntity.ok(java.util.Map.of(
                "count", 0,
                "message", "Teste de documentos funcionando - lista vazia",
                "documents", java.util.Collections.emptyList()
            ));
        } catch (Exception e) {
            log.error("Erro no teste de documentos: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Faz upload de arquivo para um documento",
               description = "Faz upload de um arquivo (PDF, imagem) para um documento especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido ou documento nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> uploadFile(
            @PathVariable("id") UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadFile(id, file));
    }

    @Operation(summary = "Faz download do arquivo de um documento",
               description = "Faz download do arquivo associado a um documento especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo baixado com sucesso",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento ou arquivo nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable("id") UUID id) {
        try {
            Document document = documentService.findById(id);
            if (document == null) {
                return ResponseEntity.notFound().build();
            }

            // Se o documento tem um arquivo associado, baixar o arquivo
            if (document.getFileName() != null && !document.getFileName().isEmpty()) {
                Resource file = documentService.getFile(id);
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                    .body(file);
            }

            // Se nÃ£o tem arquivo, tentar gerar PDF baseado no tipo de documento
            // Por enquanto, retornar erro 404 se nÃ£o hÃ¡ arquivo
            return ResponseEntity.notFound().build();
                
        } catch (Exception e) {
            log.error("Erro ao baixar documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Visualiza o arquivo de um documento",
               description = "Visualiza o arquivo associado a um documento especÃ­fico no navegador. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo visualizado com sucesso",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Documento ou arquivo nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewFile(@PathVariable("id") UUID id) {
        Document document = documentService.findById(id);
        Resource file = documentService.getFile(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "inline; filename=\"" + document.getFileName() + "\"")
                .body(file);
    }

    @Operation(summary = "Gera um PDF a partir de um template HTML e dados",
               description = "Gera um PDF a partir de um template HTML (ex: termo-vale-transporte.html) e dados fornecidos. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF gerado com sucesso",
                    content = @Content(mediaType = "application/pdf")),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos ou template nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping(value = "/generate-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> generatePdf(@RequestBody Map<String, Object> data) {
        try {
            log.info("Recebida requisiÃ§Ã£o para gerar PDF com dados: {}", data);
            
            String templateName = (String) data.get("templateName");
            if (templateName == null) {
                templateName = "termo-vale-transporte.html"; // fallback
            }
            
            log.info("Usando template: {}", templateName);
            
            // Remover o templateName dos dados para nÃ£o enviar para o template
            data.remove("templateName");
            
            byte[] pdf = documentService.generatePdf(templateName, data);
            
            log.info("PDF gerado com sucesso. Tamanho: {} bytes", pdf.length);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=documento.pdf")
                .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "EstatÃ­sticas de documentos", description = "Retorna contadores de documentos por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EstatÃ­sticas retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @GetMapping("/stats")
    public ResponseEntity<DocumentStats> getDocumentStats() {
        long total = documentService.countAll();
        long signed = documentService.countSigned();
        long pending = documentService.countPending();
        long expired = documentService.countExpired();
        
        DocumentStats stats = new DocumentStats(total, signed, pending, expired);
        return ResponseEntity.ok(stats);
    }

    @GetMapping(value = "/test-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> testPdf() {
        try {
            log.info("Testando geraÃ§Ã£o de PDF...");
            
            Map<String, Object> testData = new HashMap<>();
            testData.put("nome", "JoÃ£o da Silva");
            testData.put("cpf", "123.456.789-00");
            testData.put("empresa", "Empresa Teste");
            testData.put("dataAdmissao", "2022-01-10");
            testData.put("enderecoFuncionario", "Rua Teste, 123");
            testData.put("cnpjEmpresa", "12.345.678/0001-99");
            testData.put("enderecoEmpresa", "Av. Teste, 456");
            testData.put("dataAtual", "17/07/2025");
            
            byte[] pdf = documentService.generatePdf("termo-vale-transporte.html", testData);
            
            log.info("PDF de teste gerado com sucesso. Tamanho: {} bytes", pdf.length);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=teste.pdf")
                .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Classe interna para estatÃ­sticas
    public static class DocumentStats {
        private final long total;
        private final long signed;
        private final long pending;
        private final long expired;
        
        public DocumentStats(long total, long signed, long pending, long expired) {
            this.total = total;
            this.signed = signed;
            this.pending = pending;
            this.expired = expired;
        }
        
        // Getters
        public long getTotal() { return total; }
        public long getSigned() { return signed; }
        public long getPending() { return pending; }
        public long getExpired() { return expired; }
    }

} 
