package br.com.fleetmanager.controller;

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

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Upload de Arquivos", description = "Endpoints para upload e download de comprovantes e documentos")
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/comprovantes")
    @Operation(summary = "Upload de comprovante de pagamento", description = "Faz upload de comprovante de pagamento para conta a pagar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo inválido"),
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
                    .body(Map.of("error", "Arquivo não pode estar vazio"));
            }

            // Validar tipo de arquivo (PDF, JPG, JPEG, PNG)
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo não permitido. Use PDF, JPG, JPEG ou PNG"));
            }

            // Validar tamanho (máximo 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. Máximo 10MB"));
            }

            // Gerar nome único para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Criar diretório se não existir
            Path uploadPath = Paths.get(uploadDir, "comprovantes");
            Files.createDirectories(uploadPath);

            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Retornar informações do arquivo
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
            @ApiResponse(responseCode = "404", description = "Arquivo não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Resource> downloadComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "comprovantes").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determinar tipo de conteúdo
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
            @ApiResponse(responseCode = "200", description = "Arquivo excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Arquivo não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, String>> deleteComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "comprovantes").resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("message", "Arquivo excluído com sucesso"));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao excluir arquivo: " + e.getMessage()));
        }
    }

    // Métodos auxiliares
    private boolean isValidFileType(String contentType) {
        return contentType.equals("application/pdf") ||
               contentType.equals("image/jpeg") ||
               contentType.equals("image/jpg") ||
               contentType.equals("image/png");
    }

    private String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
}