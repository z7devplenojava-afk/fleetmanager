package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.FileSystemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileSystemController {
    
    private final FileSystemService fileSystemService;
    
    /**
     * Lista arquivos e pastas de um diretÃ³rio
     */
    @GetMapping
    public ResponseEntity<FileSystemResponse> listFiles(
            @RequestParam(value = "path", defaultValue = "/") String path,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Listando arquivos do diretÃ³rio: {} para usuÃ¡rio: {}", path, user.getUsername());
            
            List<FileSystemItemDTO> items = fileSystemService.listDirectory(path, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Arquivos listados com sucesso", items));
        } catch (Exception e) {
            log.error("Erro ao listar arquivos: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao listar arquivos: " + e.getMessage()));
        }
    }
    
    /**
     * Cria uma nova pasta
     */
    @PostMapping("/folders")
    public ResponseEntity<FileSystemResponse> createFolder(
            @Valid @RequestBody CreateFolderRequest request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Criando pasta: {} para usuÃ¡rio: {}", request.getName(), user.getUsername());
            
            FileSystemItemDTO folder = fileSystemService.createFolder(request, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Pasta criada com sucesso", folder));
        } catch (Exception e) {
            log.error("Erro ao criar pasta: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao criar pasta: " + e.getMessage()));
        }
    }
    
    /**
     * Upload de arquivo
     */
    @PostMapping("/upload")
    public ResponseEntity<FileSystemResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "parentPath", defaultValue = "/") String parentPath,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Fazendo upload do arquivo: {} para usuÃ¡rio: {}", file.getOriginalFilename(), user.getUsername());
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(FileSystemResponse.error("Arquivo nÃ£o pode estar vazio"));
            }
            
            // Verifica o tamanho do arquivo (100MB)
            if (file.getSize() > 100 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(FileSystemResponse.error("Arquivo muito grande. MÃ¡ximo permitido: 100MB"));
            }
            
            FileSystemItemDTO uploadedFile = fileSystemService.uploadFile(file, parentPath, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Arquivo enviado com sucesso", uploadedFile));
        } catch (Exception e) {
            log.error("Erro ao fazer upload: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao fazer upload: " + e.getMessage()));
        }
    }
    
    /**
     * Download de arquivo
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Fazendo download do arquivo ID: {} para usuÃ¡rio: {}", id, user.getUsername());
            
            Resource resource = fileSystemService.downloadFile(id, user);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao fazer download: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Renomeia um arquivo ou pasta
     */
    @PutMapping("/{id}/rename")
    public ResponseEntity<FileSystemResponse> renameItem(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RenameItemRequest request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Renomeando item ID: {} para: {} usuÃ¡rio: {}", id, request.getNewName(), user.getUsername());
            
            FileSystemItemDTO renamedItem = fileSystemService.renameItem(id, request, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Item renomeado com sucesso", renamedItem));
        } catch (Exception e) {
            log.error("Erro ao renomear item: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao renomear: " + e.getMessage()));
        }
    }
    
    /**
     * Move um arquivo ou pasta
     */
    @PutMapping("/{id}/move")
    public ResponseEntity<FileSystemResponse> moveItem(
            @PathVariable("id") UUID id,
            @Valid @RequestBody MoveItemRequest request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Movendo item ID: {} para: {} usuÃ¡rio: {}", id, request.getTargetPath(), user.getUsername());
            
            // TODO: Implementar lÃ³gica de mover item
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade de mover serÃ¡ implementada em breve"));
        } catch (Exception e) {
            log.error("Erro ao mover item: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao mover: " + e.getMessage()));
        }
    }
    
    /**
     * Exclui um arquivo ou pasta
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<FileSystemResponse> deleteItem(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Excluindo item ID: {} usuÃ¡rio: {}", id, user.getUsername());
            
            fileSystemService.deleteItem(id, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Item excluÃ­do com sucesso"));
        } catch (Exception e) {
            log.error("Erro ao excluir item: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao excluir: " + e.getMessage()));
        }
    }
    
    /**
     * Busca arquivos por nome
     */
    @GetMapping("/search")
    public ResponseEntity<FileSystemResponse> searchFiles(
            @RequestParam(value = "name") String name,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Buscando arquivos com nome: {} para usuÃ¡rio: {}", name, user.getUsername());
            
            // TODO: Implementar busca
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade de busca serÃ¡ implementada em breve"));
        } catch (Exception e) {
            log.error("Erro ao buscar arquivos: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao buscar: " + e.getMessage()));
        }
    }
    
    /**
     * ObtÃ©m informaÃ§Ãµes de um item especÃ­fico
     */
    @GetMapping("/{id}")
    public ResponseEntity<FileSystemResponse> getItemInfo(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Obtendo informaÃ§Ãµes do item ID: {} para usuÃ¡rio: {}", id, user.getUsername());
            
            // TODO: Implementar obtenÃ§Ã£o de informaÃ§Ãµes do item
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade serÃ¡ implementada em breve"));
        } catch (Exception e) {
            log.error("Erro ao obter informaÃ§Ãµes do item: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao obter informaÃ§Ãµes: " + e.getMessage()));
        }
    }
}

