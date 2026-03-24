package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.FileSystemNode;
import com.z7design.fleet_manager.repository.FileSystemNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileExplorerService {

    private final FileSystemNodeRepository fileSystemNodeRepository;
    private static final String BASE_UPLOAD_PATH = "uploads";

    /**
     * Lista arquivos e pastas de um diretÃ³rio
     */
    public List<Map<String, Object>> listFiles(String path) {
        log.info("ðŸ“‚ Listando arquivos do caminho: {}", path);
        
        try {
            // Normalizar caminho
            String normalizedPath = normalizePath(path);
            
            // Buscar no banco de dados
            List<FileSystemNode> nodes = fileSystemNodeRepository.findByParentPathOrderByTypeDescNameAsc(normalizedPath);
            
            // Se nÃ£o encontrou no banco, sincronizar com sistema de arquivos
            if (nodes.isEmpty()) {
                syncWithFileSystem(normalizedPath);
                nodes = fileSystemNodeRepository.findByParentPathOrderByTypeDescNameAsc(normalizedPath);
            }
            
            return nodes.stream()
                    .map(this::nodeToMap)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar arquivos: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Cria uma nova pasta
     */
    public Map<String, Object> createFolder(String parentPath, String folderName, UUID userId) {
        log.info("ðŸ“ Criando pasta '{}' em '{}'", folderName, parentPath);
        
        try {
            // Validar nome da pasta
            if (!isValidFileName(folderName)) {
                throw new IllegalArgumentException("Nome de pasta invÃ¡lido");
            }
            
            String normalizedParentPath = normalizePath(parentPath);
            String folderPath = normalizedParentPath + "/" + folderName;
            
            // Verificar se jÃ¡ existe
            Optional<FileSystemNode> existing = fileSystemNodeRepository.findByPath(folderPath);
            if (existing.isPresent()) {
                throw new IllegalArgumentException("Pasta jÃ¡ existe");
            }
            
            // Criar pasta fÃ­sica
            Path physicalPath = Paths.get(BASE_UPLOAD_PATH, folderPath);
            Files.createDirectories(physicalPath);
            
            // Salvar no banco
            FileSystemNode folder = FileSystemNode.builder()
                    .name(folderName)
                    .path(folderPath)
                    .parentPath(normalizedParentPath)
                    .type(FileSystemNode.FileType.FOLDER)
                    .physicalPath(physicalPath.toString())
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build();
                    
            folder = fileSystemNodeRepository.save(folder);
            
            log.info("âœ… Pasta criada com sucesso: {}", folderPath);
            return nodeToMap(folder);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar pasta: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao criar pasta: " + e.getMessage());
        }
    }

    /**
     * Upload de arquivo
     */
    public Map<String, Object> uploadFile(String parentPath, MultipartFile file, UUID userId) {
        log.info("ðŸ“¤ Upload de arquivo '{}' para '{}'", file.getOriginalFilename(), parentPath);
        
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Arquivo vazio");
            }
            
            String fileName = file.getOriginalFilename();
            if (!isValidFileName(fileName)) {
                throw new IllegalArgumentException("Nome de arquivo invÃ¡lido");
            }
            
            String normalizedParentPath = normalizePath(parentPath);
            String filePath = normalizedParentPath + "/" + fileName;
            
            // Verificar se jÃ¡ existe
            Optional<FileSystemNode> existing = fileSystemNodeRepository.findByPath(filePath);
            if (existing.isPresent()) {
                // Gerar nome Ãºnico
                fileName = generateUniqueFileName(fileName, normalizedParentPath);
                filePath = normalizedParentPath + "/" + fileName;
            }
            
            // Salvar arquivo fÃ­sico
            Path physicalPath = Paths.get(BASE_UPLOAD_PATH, filePath);
            Files.createDirectories(physicalPath.getParent());
            Files.copy(file.getInputStream(), physicalPath, StandardCopyOption.REPLACE_EXISTING);
            
            // Salvar no banco
            FileSystemNode fileNode = FileSystemNode.builder()
                    .name(fileName)
                    .path(filePath)
                    .parentPath(normalizedParentPath)
                    .type(FileSystemNode.FileType.FILE)
                    .size(file.getSize())
                    .mimeType(file.getContentType())
                    .physicalPath(physicalPath.toString())
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build();
                    
            fileNode = fileSystemNodeRepository.save(fileNode);
            
            log.info("âœ… Arquivo enviado com sucesso: {}", filePath);
            return nodeToMap(fileNode);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no upload: {}", e.getMessage(), e);
            throw new RuntimeException("Erro no upload: " + e.getMessage());
        }
    }

    /**
     * Renomeia arquivo ou pasta
     */
    public Map<String, Object> renameItem(UUID itemId, String newName, UUID userId) {
        log.info("âœï¸ Renomeando item {} para '{}'", itemId, newName);
        
        try {
            // Validar nome
            if (!isValidFileName(newName)) {
                throw new IllegalArgumentException("Nome invÃ¡lido");
            }
            
            // Buscar item
            FileSystemNode item = fileSystemNodeRepository.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("Item nÃ£o encontrado"));
            
            // Verificar se novo nome jÃ¡ existe
            String newPath = item.getParentPath() + "/" + newName;
            Optional<FileSystemNode> existing = fileSystemNodeRepository.findByPath(newPath);
            if (existing.isPresent() && !existing.get().getId().equals(itemId)) {
                throw new IllegalArgumentException("Nome jÃ¡ existe");
            }
            
            // Renomear arquivo fÃ­sico
            Path oldPhysicalPath = Paths.get(item.getPhysicalPath());
            Path newPhysicalPath = oldPhysicalPath.getParent().resolve(newName);
            Files.move(oldPhysicalPath, newPhysicalPath);
            
            // Atualizar banco
            item.setName(newName);
            item.setPath(newPath);
            item.setPhysicalPath(newPhysicalPath.toString());
            item.setUpdatedBy(userId);
            
            item = fileSystemNodeRepository.save(item);
            
            log.info("âœ… Item renomeado com sucesso: {}", newPath);
            return nodeToMap(item);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao renomear: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao renomear: " + e.getMessage());
        }
    }

    /**
     * Exclui arquivo ou pasta
     */
    public boolean deleteItem(UUID itemId, UUID userId) {
        log.info("ðŸ—‘ï¸ Excluindo item {}", itemId);
        
        try {
            // Buscar item
            FileSystemNode item = fileSystemNodeRepository.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("Item nÃ£o encontrado"));
            
            // Excluir arquivo fÃ­sico
            Path physicalPath = Paths.get(item.getPhysicalPath());
            if (Files.exists(physicalPath)) {
                if (item.getType() == FileSystemNode.FileType.FOLDER) {
                    // Excluir pasta recursivamente
                    deleteDirectoryRecursively(physicalPath);
                } else {
                    Files.delete(physicalPath);
                }
            }
            
            // Excluir do banco
            fileSystemNodeRepository.delete(item);
            
            log.info("âœ… Item excluÃ­do com sucesso: {}", item.getPath());
            return true;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao excluir: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Busca arquivos por nome
     */
    public List<Map<String, Object>> searchFiles(String searchTerm) {
        log.info("ðŸ” Buscando arquivos: {}", searchTerm);
        
        try {
            List<FileSystemNode> nodes = fileSystemNodeRepository
                    .findByNameContainingIgnoreCaseOrderByTypeDescNameAsc(searchTerm);
            
            return nodes.stream()
                    .map(this::nodeToMap)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro na busca: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * ObtÃ©m informaÃ§Ãµes de um arquivo para download
     */
    public Optional<FileSystemNode> getFileForDownload(UUID fileId) {
        return fileSystemNodeRepository.findById(fileId)
                .filter(node -> node.getType() == FileSystemNode.FileType.FILE);
    }

    // MÃ©todos auxiliares

    private String normalizePath(String path) {
        if (path == null || path.trim().isEmpty() || path.equals("/")) {
            return "";
        }
        
        path = path.trim();
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        
        return path;
    }

    private boolean isValidFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }
        
        // Caracteres nÃ£o permitidos
        String invalidChars = "<>:\"/\\|?*";
        for (char c : invalidChars.toCharArray()) {
            if (fileName.indexOf(c) >= 0) {
                return false;
            }
        }
        
        return true;
    }

    private String generateUniqueFileName(String originalName, String parentPath) {
        String baseName = originalName;
        String extension = "";
        
        int lastDot = originalName.lastIndexOf('.');
        if (lastDot > 0) {
            baseName = originalName.substring(0, lastDot);
            extension = originalName.substring(lastDot);
        }
        
        int counter = 1;
        String newName;
        
        do {
            newName = baseName + " (" + counter + ")" + extension;
            counter++;
        } while (fileSystemNodeRepository.findByParentPathAndName(parentPath, newName).isPresent());
        
        return newName;
    }

    private void syncWithFileSystem(String path) {
        // TODO: Implementar sincronizaÃ§Ã£o com sistema de arquivos fÃ­sico
        log.debug("ðŸ”„ Sincronizando com sistema de arquivos: {}", path);
    }

    private void deleteDirectoryRecursively(Path directory) throws IOException {
        Files.walk(directory)
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        log.error("Erro ao excluir: {}", path, e);
                    }
                });
    }

    private Map<String, Object> nodeToMap(FileSystemNode node) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", node.getId().toString());
        map.put("name", node.getName());
        map.put("path", node.getPath());
        map.put("parentPath", node.getParentPath());
        map.put("type", node.getType().name().toLowerCase());
        map.put("size", node.getSize());
        map.put("mimeType", node.getMimeType());
        map.put("createdAt", node.getCreatedAt());
        map.put("updatedAt", node.getUpdatedAt());
        map.put("createdBy", node.getCreatedBy());
        return map;
    }
}
