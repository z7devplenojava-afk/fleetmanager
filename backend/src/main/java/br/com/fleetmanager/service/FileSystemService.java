package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.*;
import br.com.fleetmanager.model.FileSystemItem;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.repository.FileSystemRepository;
import br.com.fleetmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FileSystemService {
    
    private final FileSystemRepository fileSystemRepository;
    private final String BASE_STORAGE_PATH = "data/files";
    
    /**
     * Lista arquivos e pastas de um diretório
     */
    public List<FileSystemItemDTO> listDirectory(String path, User user) {
        log.info("Listando diretório: {} para usuário: {}", path, user.getUsername());
        
        FileSystemItem parent = findParentByPath(path, user);
        List<FileSystemItem> items;
        
        if (parent == null) {
            // Lista itens da raiz
            items = fileSystemRepository.findRootItems().stream()
                    .filter(item -> item.getOwner().getId().equals(user.getId()))
                    .collect(Collectors.toList());
        } else {
            // Lista itens do diretório pai
            items = fileSystemRepository.findByParentIdAndNotDeleted(parent.getId());
        }
        
        return items.stream()
                .map(FileSystemItemDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Cria uma nova pasta
     */
    public FileSystemItemDTO createFolder(CreateFolderRequest request, User user) {
        log.info("Criando pasta: {} para usuário: {}", request.getName(), user.getUsername());
        
        FileSystemItem parent = findParentByPath(request.getParentPath(), user);
        
        // Verifica se já existe uma pasta com o mesmo nome
        Optional<FileSystemItem> existingItem;
        if (parent == null) {
            existingItem = fileSystemRepository.findByOwnerAndParentNullAndName(user, request.getName());
        } else {
            existingItem = fileSystemRepository.findByOwnerAndParentAndName(user, parent, request.getName());
        }
        
        if (existingItem.isPresent()) {
            throw new RuntimeException("Já existe uma pasta com o nome: " + request.getName());
        }
        
        // Cria a pasta física
        String physicalPath = createPhysicalPath(user, request.getParentPath(), request.getName());
        try {
            Files.createDirectories(Paths.get(physicalPath));
        } catch (IOException e) {
            log.error("Erro ao criar pasta física: {}", e.getMessage());
            throw new RuntimeException("Erro ao criar pasta: " + e.getMessage());
        }
        
        // Cria o registro no banco
        FileSystemItem folder = FileSystemItem.builder()
                .name(request.getName())
                .path(request.getParentPath())
                .type(FileSystemItem.ItemType.FOLDER)
                .parent(parent)
                .owner(user)
                .physicalPath(physicalPath)
                .build();
        
        FileSystemItem savedFolder = fileSystemRepository.save(folder);
        log.info("Pasta criada com ID: {}", savedFolder.getId());
        
        return FileSystemItemDTO.fromEntity(savedFolder);
    }
    
    /**
     * Faz upload de um arquivo
     */
    public FileSystemItemDTO uploadFile(MultipartFile file, String parentPath, User user) {
        log.info("Fazendo upload do arquivo: {} para usuário: {}", file.getOriginalFilename(), user.getUsername());
        
        FileSystemItem parent = findParentByPath(parentPath, user);
        
        // Verifica se já existe um arquivo com o mesmo nome
        Optional<FileSystemItem> existingItem;
        if (parent == null) {
            existingItem = fileSystemRepository.findByOwnerAndParentNullAndName(user, file.getOriginalFilename());
        } else {
            existingItem = fileSystemRepository.findByOwnerAndParentAndName(user, parent, file.getOriginalFilename());
        }
        
        if (existingItem.isPresent()) {
            throw new RuntimeException("Já existe um arquivo com o nome: " + file.getOriginalFilename());
        }
        
        // Cria o diretório físico se não existir
        String physicalPath = createPhysicalPath(user, parentPath, file.getOriginalFilename());
        Path targetPath = Paths.get(physicalPath);
        
        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Erro ao fazer upload do arquivo: {}", e.getMessage());
            throw new RuntimeException("Erro ao fazer upload: " + e.getMessage());
        }
        
        // Determina o tipo MIME e extensão
        String mimeType = file.getContentType();
        String fileExtension = getFileExtension(file.getOriginalFilename());
        
        // Cria o registro no banco
        FileSystemItem fileItem = FileSystemItem.builder()
                .name(file.getOriginalFilename())
                .path(parentPath)
                .type(FileSystemItem.ItemType.FILE)
                .size(file.getSize())
                .mimeType(mimeType)
                .fileExtension(fileExtension)
                .parent(parent)
                .owner(user)
                .physicalPath(physicalPath)
                .build();
        
        FileSystemItem savedFile = fileSystemRepository.save(fileItem);
        log.info("Arquivo salvo com ID: {}", savedFile.getId());
        
        return FileSystemItemDTO.fromEntity(savedFile);
    }
    
    /**
     * Download de um arquivo
     */
    public Resource downloadFile(UUID fileId, User user) {
        log.info("Fazendo download do arquivo ID: {} para usuário: {}", fileId, user.getUsername());
        
        FileSystemItem fileItem = fileSystemRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));
        
        // Verifica se o usuário tem permissão para baixar o arquivo
        if (!fileItem.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado ao arquivo");
        }
        
        if (fileItem.isFolder()) {
            throw new RuntimeException("Não é possível baixar uma pasta");
        }
        
        try {
            Path filePath = Paths.get(fileItem.getPhysicalPath());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Arquivo não encontrado no sistema de arquivos");
            }
        } catch (Exception e) {
            log.error("Erro ao fazer download do arquivo: {}", e.getMessage());
            throw new RuntimeException("Erro ao fazer download: " + e.getMessage());
        }
    }
    
    /**
     * Renomeia um arquivo ou pasta
     */
    public FileSystemItemDTO renameItem(UUID itemId, RenameItemRequest request, User user) {
        log.info("Renomeando item ID: {} para: {} usuário: {}", itemId, request.getNewName(), user.getUsername());
        
        FileSystemItem item = fileSystemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        
        // Verifica permissão
        if (!item.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado ao item");
        }
        
        // Verifica se já existe um item com o novo nome
        Optional<FileSystemItem> existingItem;
        if (item.getParent() == null) {
            existingItem = fileSystemRepository.findByOwnerAndParentNullAndName(user, request.getNewName());
        } else {
            existingItem = fileSystemRepository.findByOwnerAndParentAndName(user, item.getParent(), request.getNewName());
        }
        
        if (existingItem.isPresent() && !existingItem.get().getId().equals(itemId)) {
            throw new RuntimeException("Já existe um item com o nome: " + request.getNewName());
        }
        
        // Renomeia o arquivo físico
        try {
            Path oldPath = Paths.get(item.getPhysicalPath());
            Path newPath = oldPath.getParent().resolve(request.getNewName());
            Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
            
            // Atualiza o registro no banco
            item.setName(request.getNewName());
            item.setPhysicalPath(newPath.toString());
            
            FileSystemItem updatedItem = fileSystemRepository.save(item);
            log.info("Item renomeado com sucesso");
            
            return FileSystemItemDTO.fromEntity(updatedItem);
        } catch (IOException e) {
            log.error("Erro ao renomear item: {}", e.getMessage());
            throw new RuntimeException("Erro ao renomear: " + e.getMessage());
        }
    }
    
    /**
     * Exclui um arquivo ou pasta
     */
    public void deleteItem(UUID itemId, User user) {
        log.info("Excluindo item ID: {} usuário: {}", itemId, user.getUsername());
        
        FileSystemItem item = fileSystemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        
        // Verifica permissão
        if (!item.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado ao item");
        }
        
        // Se for uma pasta, verifica se está vazia
        if (item.isFolder()) {
            Long childCount = fileSystemRepository.countByParentAndNotDeleted(item);
            if (childCount > 0) {
                throw new RuntimeException("Não é possível excluir uma pasta que não está vazia");
            }
        }
        
        // Marca como excluído (soft delete)
        item.setIsDeleted(true);
        fileSystemRepository.save(item);
        
        log.info("Item excluído com sucesso");
    }
    
    /**
     * Busca o item pai pelo caminho
     */
    private FileSystemItem findParentByPath(String path, User user) {
        if (path == null || path.equals("/") || path.isEmpty()) {
            return null;
        }
        
        return fileSystemRepository.findFolderByOwnerAndPath(user, path)
                .orElse(null);
    }
    
    /**
     * Cria o caminho físico do arquivo/pasta
     */
    private String createPhysicalPath(User user, String parentPath, String name) {
        String userPath = BASE_STORAGE_PATH + "/" + user.getId().toString();
        if (parentPath != null && !parentPath.equals("/")) {
            userPath += parentPath;
        }
        return userPath + "/" + name;
    }
    
    /**
     * Extrai a extensão do arquivo
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        
        return "";
    }
}
