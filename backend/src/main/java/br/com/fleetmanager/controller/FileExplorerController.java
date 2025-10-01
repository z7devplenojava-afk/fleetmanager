package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.FileExplorerService;

import br.com.fleetmanager.model.FileSystemNode;
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
     * Lista arquivos e pastas de um diretório
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listFiles(
            @RequestParam(defaultValue = "") String path) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📂 Listando arquivos do caminho: {}", path);
            
            List<Map<String, Object>> files = fileExplorerService.listFiles(path);
            
            response.put("success", true);
            response.put("message", "Arquivos listados com sucesso");
            response.put("files", files);
            response.put("path", path);
            response.put("count", files.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao listar arquivos: {}", e.getMessage(), e);
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
            @RequestParam(defaultValue = "") String parentPath,
            @RequestParam String folderName,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📁 Criando pasta '{}' em '{}'", folderName, parentPath);
            
            UUID userId = getUserIdFromAuth(authentication);
            Map<String, Object> folder = fileExplorerService.createFolder(parentPath, folderName, userId);
            
            response.put("success", true);
            response.put("message", "Pasta criada com sucesso");
            response.put("folder", folder);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao criar pasta: {}", e.getMessage(), e);
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
            @RequestParam(defaultValue = "") String parentPath,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("📤 Upload de {} arquivo(s) para '{}'", files.length, parentPath);
            
            UUID userId = getUserIdFromAuth(authentication);
            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (MultipartFile file : files) {
                try {
                    Map<String, Object> uploadedFile = fileExplorerService.uploadFile(parentPath, file, userId);
                    uploadedFiles.add(uploadedFile);
                } catch (Exception e) {
                    log.error("💥 Erro no upload do arquivo {}: {}", file.getOriginalFilename(), e.getMessage());
                    errors.add(file.getOriginalFilename() + ": " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", String.format("Upload concluído: %d sucesso, %d erros", 
                    uploadedFiles.size(), errors.size()));
            response.put("uploadedFiles", uploadedFiles);
            response.put("errors", errors);
            response.put("successCount", uploadedFiles.size());
            response.put("errorCount", errors.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no upload: {}", e.getMessage(), e);
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
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        try {
            log.info("📥 Download do arquivo: {}", fileId);
            
            Optional<FileSystemNode> fileNodeOpt = fileExplorerService.getFileForDownload(fileId);
            
            if (fileNodeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            FileSystemNode fileNode = fileNodeOpt.get();
            Path filePath = Paths.get(fileNode.getPhysicalPath());
            
            if (!Files.exists(filePath)) {
                log.warn("⚠️ Arquivo físico não encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // Determinar tipo de conteúdo
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
            log.error("💥 Erro no download: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Renomeia arquivo ou pasta
     */
    @PutMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> renameItem(
            @PathVariable UUID itemId,
            @RequestParam String newName,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("✏️ Renomeando item {} para '{}'", itemId, newName);
            
            UUID userId = getUserIdFromAuth(authentication);
            Map<String, Object> item = fileExplorerService.renameItem(itemId, newName, userId);
            
            response.put("success", true);
            response.put("message", "Item renomeado com sucesso");
            response.put("item", item);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro ao renomear: {}", e.getMessage(), e);
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
            @PathVariable UUID itemId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🗑️ Excluindo item: {}", itemId);
            
            UUID userId = getUserIdFromAuth(authentication);
            boolean deleted = fileExplorerService.deleteItem(itemId, userId);
            
            if (deleted) {
                response.put("success", true);
                response.put("message", "Item excluído com sucesso");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Erro ao excluir item");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("💥 Erro ao excluir: {}", e.getMessage(), e);
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
            @RequestParam String q) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("🔍 Buscando arquivos: {}", q);
            
            List<Map<String, Object>> files = fileExplorerService.searchFiles(q);
            
            response.put("success", true);
            response.put("message", "Busca realizada com sucesso");
            response.put("files", files);
            response.put("query", q);
            response.put("count", files.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro na busca: {}", e.getMessage(), e);
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
    public ResponseEntity<Resource> previewFile(@PathVariable UUID fileId) {
        try {
            log.info("👁️ Preview do arquivo: {}", fileId);
            
            Optional<FileSystemNode> fileNodeOpt = fileExplorerService.getFileForDownload(fileId);
            
            if (fileNodeOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            FileSystemNode fileNode = fileNodeOpt.get();
            Path filePath = Paths.get(fileNode.getPhysicalPath());
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            // Verificar se é um tipo de arquivo que pode ser visualizado
            String mimeType = fileNode.getMimeType();
            if (mimeType == null) {
                try {
                    mimeType = Files.probeContentType(filePath);
                } catch (IOException e) {
                    mimeType = "application/octet-stream";
                }
            }
            
            // Permitir preview apenas para tipos específicos
            if (!isPreviewableType(mimeType)) {
                return ResponseEntity.badRequest().build();
            }
            
            Resource resource = new FileSystemResource(filePath.toFile());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileNode.getName() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("💥 Erro no preview: {}", e.getMessage(), e);
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
            log.info("🧪 Testando File Explorer...");
            
            response.put("success", true);
            response.put("message", "File Explorer funcionando");
            response.put("timestamp", new Date());
            response.put("baseUploadPath", "uploads");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("💥 Erro no teste: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro no teste: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Métodos auxiliares

    private UUID getUserIdFromAuth(Authentication authentication) {
        // TODO: Implementar extração do ID do usuário da autenticação
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