package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.FileSystemNode;
import com.z7design.fleet_manager.service.FileExplorerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/file-explorer")
@RequiredArgsConstructor
@Slf4j
public class FileExplorerController {

    private final FileExplorerService fileExplorerService;

    /**
     * Lista arquivos e pastas de um diretÃ³rio
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listFiles(
            @RequestParam(value = "path", defaultValue = "") String path) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‚ Listando arquivos do caminho: {}", path);
            
            List<Map<String, Object>> files = fileExplorerService.listFiles(path);
            
            response.put("success", true);
            response.put("message", "Arquivos listados com sucesso");
            response.put("files", files);
            response.put("path", path);
            response.put("count", files.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar arquivos: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao listar arquivos: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria uma nova pasta
     */
    @PostMapping("/folders")
    public ResponseEntity<Map<String, Object>> createFolder(
            @RequestParam(value = "parentPath", defaultValue = "") String parentPath,
            @RequestParam(value = "folderName") String folderName,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“ Criando pasta '{}' em '{}'", folderName, parentPath);
            
            UUID userId = getUserIdFromAuth(authentication);
            Map<String, Object> folder = fileExplorerService.createFolder(parentPath, folderName, userId);
            
            response.put("success", true);
            response.put("message", "Pasta criada com sucesso");
            response.put("folder", folder);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar pasta: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao criar pasta: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Upload de arquivos
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam(value = "parentPath", defaultValue = "") String parentPath,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“¤ Upload de {} arquivo(s) para '{}'", files.length, parentPath);
            
            UUID userId = getUserIdFromAuth(authentication);
            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (MultipartFile file : files) {
                try {
                    Map<String, Object> uploadedFile = fileExplorerService.uploadFile(parentPath, file, userId);
                    uploadedFiles.add(uploadedFile);
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro no upload do arquivo {}: {}", file.getOriginalFilename(), e.getMessage());
                    errors.add(file.getOriginalFilename() + ": " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", String.format("Upload concluÃ­do: %d sucesso, %d erros", 
                    uploadedFiles.size(), errors.size()));
            response.put("uploadedFiles", uploadedFiles);
            response.put("errors", errors);
            response.put("successCount", uploadedFiles.size());
            response.put("errorCount", errors.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no upload: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro no upload: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Download de arquivo
     */
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable("fileId") UUID fileId) {
        try {
            log.info("ðŸ“¥ Download do arquivo: {}", fileId);
            
            Optional<FileSystemNode> fileNodeOpt = fileExplorerService.getFileForDownload(fileId);
            
            if (fileNodeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            FileSystemNode fileNode = fileNodeOpt.get();
            Path filePath = Paths.get(fileNode.getPhysicalPath());
            
            if (!Files.exists(filePath)) {
                log.warn("âš ï¸ Arquivo fÃ­sico nÃ£o encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // Determinar tipo de conteÃºdo
            String contentType = fileNode.getMimeType();
            if (contentType == null) {
                try {
                    contentType = Files.probeContentType(filePath);
                } catch (IOException e) {
                    contentType = "application/octet-stream";
                }
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + fileNode.getName() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no download: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Renomeia arquivo ou pasta
     */
    @PutMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> renameItem(
            @PathVariable("itemId") UUID itemId,
            @RequestParam(value = "newName") String newName,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("âœï¸ Renomeando item {} para '{}'", itemId, newName);
            
            UUID userId = getUserIdFromAuth(authentication);
            Map<String, Object> item = fileExplorerService.renameItem(itemId, newName, userId);
            
            response.put("success", true);
            response.put("message", "Item renomeado com sucesso");
            response.put("item", item);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao renomear: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao renomear: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Exclui arquivo ou pasta
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> deleteItem(
            @PathVariable("itemId") UUID itemId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ—‘ï¸ Excluindo item: {}", itemId);
            
            UUID userId = getUserIdFromAuth(authentication);
            boolean deleted = fileExplorerService.deleteItem(itemId, userId);
            
            if (deleted) {
                response.put("success", true);
                response.put("message", "Item excluÃ­do com sucesso");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Erro ao excluir item");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao excluir: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao excluir: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Busca arquivos por nome
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFiles(
            @RequestParam(value = "q") String q) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ” Buscando arquivos: {}", q);
            
            List<Map<String, Object>> files = fileExplorerService.searchFiles(q);
            
            response.put("success", true);
            response.put("message", "Busca realizada com sucesso");
            response.put("files", files);
            response.put("query", q);
            response.put("count", files.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro na busca: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro na busca: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Preview de arquivo (para imagens, PDFs, etc.)
     */
    @GetMapping("/{fileId}/preview")
    public ResponseEntity<Resource> previewFile(@PathVariable("fileId") UUID fileId) {
        try {
            log.info("ðŸ‘ï¸ Preview do arquivo: {}", fileId);
            
            Optional<FileSystemNode> fileNodeOpt = fileExplorerService.getFileForDownload(fileId);
            
            if (fileNodeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            FileSystemNode fileNode = fileNodeOpt.get();
            Path filePath = Paths.get(fileNode.getPhysicalPath());
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            // Verificar se Ã© um tipo de arquivo que pode ser visualizado
            String mimeType = fileNode.getMimeType();
            if (mimeType == null) {
                try {
                    mimeType = Files.probeContentType(filePath);
                } catch (IOException e) {
                    mimeType = "application/octet-stream";
                }
            }
            
            // Permitir preview apenas para tipos especÃ­ficos
            if (!isPreviewableType(mimeType)) {
                return ResponseEntity.badRequest().build();
            }
            
            Resource resource = new FileSystemResource(filePath.toFile());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileNode.getName() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no preview: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testFileExplorer() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando File Explorer...");
            
            response.put("success", true);
            response.put("message", "File Explorer funcionando");
            response.put("timestamp", new Date());
            response.put("baseUploadPath", "uploads");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro no teste: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // MÃ©todos auxiliares

    private UUID getUserIdFromAuth(Authentication authentication) {
        // TODO: Implementar extraÃ§Ã£o do ID do usuÃ¡rio da autenticaÃ§Ã£o
        // Por enquanto, retorna um UUID fixo para teste
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    private boolean isPreviewableType(String mimeType) {
        if (mimeType == null) return false;
        
        return mimeType.startsWith("image/") ||
               mimeType.equals("application/pdf") ||
               mimeType.startsWith("text/") ||
               mimeType.equals("application/json") ||
               mimeType.equals("application/xml");
    }
}
