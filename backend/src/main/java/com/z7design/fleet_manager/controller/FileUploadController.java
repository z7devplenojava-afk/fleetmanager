package com.z7design.fleet_manager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Upload de Arquivos", description = "Endpoints para upload e download de comprovantes e documentos")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/atestados")
    @Operation(summary = "Upload de atestado mÃ©dico", description = "Faz upload de atestado mÃ©dico para registro de falta")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, String>> uploadAtestado(
            @Parameter(description = "Arquivo do atestado")
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo nÃ£o pode estar vazio"));
            }

            // Validar tipo de arquivo (PDF, JPG, JPEG, PNG)
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo nÃ£o permitido. Use PDF, JPG, JPEG ou PNG"));
            }

            // Validar tamanho (mÃ¡ximo 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. MÃ¡ximo 10MB"));
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Criar diretÃ³rio se nÃ£o existir
            Path uploadPath = Paths.get(uploadDir, "atestados");
            Files.createDirectories(uploadPath);

            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar informaÃ§Ãµes do arquivo
            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "atestados/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            response.put("url", "/api/uploads/atestados/" + uniqueFilename);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        }
    }

    @PostMapping("/comprovantes")
    @Operation(summary = "Upload de comprovante de pagamento", description = "Faz upload de comprovante de pagamento para conta a pagar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, String>> uploadComprovante(
            @Parameter(description = "Arquivo do comprovante")
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo nÃ£o pode estar vazio"));
            }

            // Validar tipo de arquivo (PDF, JPG, JPEG, PNG)
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo nÃ£o permitido. Use PDF, JPG, JPEG ou PNG"));
            }

            // Validar tamanho (mÃ¡ximo 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. MÃ¡ximo 10MB"));
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Criar diretÃ³rio se nÃ£o existir
            Path uploadPath = Paths.get(uploadDir, "comprovantes");
            Files.createDirectories(uploadPath);

            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar informaÃ§Ãµes do arquivo
            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "comprovantes/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            response.put("url", "/api/uploads/comprovantes/" + uniqueFilename);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        }
    }

    @GetMapping("/comprovantes/{filename}")
    @Operation(summary = "Download de comprovante", description = "Faz download de um comprovante de pagamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Arquivo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Resource> downloadComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable("filename") String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "comprovantes").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determinar tipo de conteÃºdo
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/comprovantes/{filename}")
    @Operation(summary = "Excluir comprovante", description = "Exclui um comprovante de pagamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Arquivo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, String>> deleteComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable("filename") String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "comprovantes").resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("message", "Arquivo excluÃ­do com sucesso"));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao excluir arquivo: " + e.getMessage()));
        }
    }
    
    /**
     * Download de arquivo do chat
     */
    @GetMapping("/chat/{subDir}/{filename}")
    public ResponseEntity<Resource> downloadChatFile(
            @PathVariable("subDir") String subDir,
            @PathVariable("filename") String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "chat", subDir).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/companies/logo")
    @Operation(summary = "Upload de logo da empresa", description = "Faz upload de logo da empresa (PNG, JPG, JPEG)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH')")
    public ResponseEntity<Map<String, String>> uploadCompanyLogo(
            @Parameter(description = "Arquivo do logo (PNG, JPG, JPEG)")
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("ðŸ“¤ Iniciando upload de logo da empresa - Nome original: {}, Tamanho: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            // Validar arquivo
            if (file.isEmpty()) {
                log.warn("âŒ Arquivo vazio recebido");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo nÃ£o pode estar vazio"));
            }

            // Validar tipo de arquivo (apenas imagens: JPG, JPEG, PNG)
            String contentType = file.getContentType();
            log.info("ðŸ“„ Content-Type recebido: {}", contentType);
            
            if (contentType == null || !isValidImageType(contentType)) {
                log.warn("âŒ Tipo de arquivo invÃ¡lido: {}", contentType);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo nÃ£o permitido. Use PNG, JPG ou JPEG"));
            }

            // Validar tamanho (mÃ¡ximo 5MB para logos)
            if (file.getSize() > 5 * 1024 * 1024) {
                log.warn("âŒ Arquivo muito grande: {} bytes", file.getSize());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. MÃ¡ximo 5MB"));
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            log.info("ðŸ“ Nome Ãºnico gerado: {}", uniqueFilename);

            // Criar diretÃ³rio se nÃ£o existir (usar caminho absoluto)
            Path uploadPath = Paths.get(uploadDir, "companies", "logos").toAbsolutePath().normalize();
            log.info("ðŸ“ Caminho de upload: {}", uploadPath);
            
            Files.createDirectories(uploadPath);
            log.info("âœ… DiretÃ³rio verificado/criado: {}", uploadPath);

            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            log.info("ðŸ’¾ Salvando arquivo em: {}", filePath);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Verificar se o arquivo foi salvo corretamente
            if (!Files.exists(filePath)) {
                log.error("âŒ Arquivo nÃ£o foi salvo corretamente: {}", filePath);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao salvar arquivo: arquivo nÃ£o encontrado apÃ³s upload"));
            }
            
            log.info("âœ… Arquivo salvo com sucesso: {} ({} bytes)", filePath, Files.size(filePath));

            // Retornar informaÃ§Ãµes do arquivo
            // IMPORTANTE: Retornar apenas o caminho relativo (sem host/porta)
            // O frontend construirÃ¡ a URL completa quando necessÃ¡rio para exibiÃ§Ã£o
            String relativeUrl = "/api/uploads/companies/logos/" + uniqueFilename;
            
            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "companies/logos/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            response.put("url", relativeUrl); // Caminho relativo: /api/uploads/companies/logos/{filename}
            
            log.info("âœ… Upload concluÃ­do com sucesso. URL relativa: {}", relativeUrl);
            log.info("ðŸ“ Arquivo salvo em: {}", filePath.toAbsolutePath());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("âŒ Erro ao salvar arquivo de logo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao fazer upload de logo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro inesperado: " + e.getMessage()));
        }
    }

    // REMOVIDO: Endpoint GET removido para evitar conflito com ResourceHandler
    // O ResourceHandler em WebConfig.java serve os arquivos estÃ¡ticos diretamente
    // que Ã© mais eficiente e nÃ£o causa conflitos de headers
    // Se necessÃ¡rio, este endpoint pode ser restaurado como fallback
    
    // @GetMapping("/companies/logos/{filename}")
    // @Operation(summary = "Download de logo da empresa", description = "Faz download de um logo de empresa")
    // public ResponseEntity<Resource> downloadCompanyLogo(...) { ... }

    // MÃ©todos auxiliares
    private boolean isValidFileType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") ||
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png")
        );
    }

    private boolean isValidImageType(String contentType) {
        return contentType != null && (
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png")
        );
    }

    private String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
}
