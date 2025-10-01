package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.FileSystemService;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.User;
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
     * Lista arquivos e pastas de um diretório
     */
    @GetMapping
    public ResponseEntity<FileSystemResponse> listFiles(
            @RequestParam(defaultValue = "/") String path,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Listando arquivos do diretório: {} para usuário: {}", path, user.getUsername());
            
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
            log.info("Criando pasta: {} para usuário: {}", request.getName(), user.getUsername());
            
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
            @RequestParam(defaultValue = "/") String parentPath,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Fazendo upload do arquivo: {} para usuário: {}", file.getOriginalFilename(), user.getUsername());
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(FileSystemResponse.error("Arquivo não pode estar vazio"));
            }
            
            // Verifica o tamanho do arquivo (100MB)
            if (file.getSize() > 100 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(FileSystemResponse.error("Arquivo muito grande. Máximo permitido: 100MB"));
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
            @PathVariable UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Fazendo download do arquivo ID: {} para usuário: {}", id, user.getUsername());
            
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
            @PathVariable UUID id,
            @Valid @RequestBody RenameItemRequest request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Renomeando item ID: {} para: {} usuário: {}", id, request.getNewName(), user.getUsername());
            
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
            @PathVariable UUID id,
            @Valid @RequestBody MoveItemRequest request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Movendo item ID: {} para: {} usuário: {}", id, request.getTargetPath(), user.getUsername());
            
            // TODO: Implementar lógica de mover item
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade de mover será implementada em breve"));
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
            @PathVariable UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Excluindo item ID: {} usuário: {}", id, user.getUsername());
            
            fileSystemService.deleteItem(id, user);
            
            return ResponseEntity.ok(FileSystemResponse.success("Item excluído com sucesso"));
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
            @RequestParam String name,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Buscando arquivos com nome: {} para usuário: {}", name, user.getUsername());
            
            // TODO: Implementar busca
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade de busca será implementada em breve"));
        } catch (Exception e) {
            log.error("Erro ao buscar arquivos: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao buscar: " + e.getMessage()));
        }
    }
    
    /**
     * Obtém informações de um item específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<FileSystemResponse> getItemInfo(
            @PathVariable UUID id,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            log.info("Obtendo informações do item ID: {} para usuário: {}", id, user.getUsername());
            
            // TODO: Implementar obtenção de informações do item
            return ResponseEntity.ok(FileSystemResponse.success("Funcionalidade será implementada em breve"));
        } catch (Exception e) {
            log.error("Erro ao obter informações do item: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileSystemResponse.error("Erro ao obter informações: " + e.getMessage()));
        }
    }
}
