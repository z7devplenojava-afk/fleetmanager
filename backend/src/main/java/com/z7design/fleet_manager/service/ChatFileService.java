package com.z7design.fleet_manager.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.enums.ChatMessageType;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ChatFileService {
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
    
    /**
     * Salva arquivo de chat e retorna informaÃ§Ãµes do arquivo
     */
    public ChatFileInfo saveChatFile(MultipartFile file, ChatMessageType messageType) {
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                throw new BusinessException("Arquivo nÃ£o pode estar vazio");
            }
            
            // Validar tamanho baseado no tipo
            long maxSize = getMaxSizeForType(messageType);
            if (file.getSize() > maxSize) {
                throw new BusinessException(String.format("Arquivo muito grande. MÃ¡ximo permitido: %dMB", maxSize / (1024 * 1024)));
            }
            
            // Validar tipo de arquivo
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType, messageType)) {
                throw new BusinessException("Tipo de arquivo nÃ£o permitido para " + messageType.getDisplayName());
            }
            
            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            // Criar diretÃ³rio se nÃ£o existir
            String subDir = getSubDirectoryForType(messageType);
            Path uploadPath = Paths.get(uploadDir, "chat", subDir);
            Files.createDirectories(uploadPath);
            
            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("âœ… Arquivo de chat salvo: {}", filePath.toString());
            
            // Retornar informaÃ§Ãµes do arquivo
            ChatFileInfo fileInfo = new ChatFileInfo();
            fileInfo.setFileName(uniqueFilename);
            fileInfo.setOriginalName(originalFilename);
            fileInfo.setPath("chat/" + subDir + "/" + uniqueFilename);
            fileInfo.setSize(file.getSize());
            fileInfo.setContentType(contentType);
            fileInfo.setUrl("/api/uploads/chat/" + subDir + "/" + uniqueFilename);
            
            return fileInfo;
            
        } catch (IOException e) {
            log.error("âŒ Erro ao salvar arquivo de chat", e);
            throw new BusinessException("Erro ao salvar arquivo: " + e.getMessage());
        }
    }
    
    /**
     * Deleta arquivo de chat
     */
    public void deleteChatFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("âœ… Arquivo de chat deletado: {}", filePath);
            }
        } catch (IOException e) {
            log.warn("âš ï¸ Erro ao deletar arquivo de chat: {}", filePath, e);
        }
    }
    
    /**
     * ObtÃ©m tamanho mÃ¡ximo permitido baseado no tipo de mensagem
     */
    private long getMaxSizeForType(ChatMessageType type) {
        switch (type) {
            case IMAGE:
                return MAX_IMAGE_SIZE;
            case AUDIO:
                return MAX_AUDIO_SIZE;
            case VIDEO:
                return MAX_FILE_SIZE;
            case FILE:
                return MAX_FILE_SIZE;
            default:
                return MAX_FILE_SIZE;
        }
    }
    
    /**
     * ObtÃ©m subdiretÃ³rio baseado no tipo de mensagem
     */
    private String getSubDirectoryForType(ChatMessageType type) {
        switch (type) {
            case IMAGE:
                return "images";
            case AUDIO:
                return "audio";
            case VIDEO:
                return "videos";
            case FILE:
                return "files";
            default:
                return "files";
        }
    }
    
    /**
     * Valida tipo de arquivo baseado no tipo de mensagem
     */
    private boolean isValidFileType(String contentType, ChatMessageType messageType) {
        switch (messageType) {
            case IMAGE:
                return contentType.startsWith("image/");
            case AUDIO:
                return contentType.startsWith("audio/");
            case VIDEO:
                return contentType.startsWith("video/");
            case FILE:
                // Aceitar vÃ¡rios tipos de arquivo
                return contentType.equals("application/pdf") ||
                       contentType.equals("application/msword") ||
                       contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                       contentType.equals("application/vnd.ms-excel") ||
                       contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
                       contentType.equals("application/zip") ||
                       contentType.equals("application/x-zip-compressed") ||
                       contentType.equals("text/plain") ||
                       contentType.equals("text/csv");
            default:
                return false;
        }
    }
    
    /**
     * ObtÃ©m extensÃ£o do arquivo
     */
    private String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
    
    /**
     * Classe interna para informaÃ§Ãµes do arquivo
     */
    public static class ChatFileInfo {
        private String fileName;
        private String originalName;
        private String path;
        private Long size;
        private String contentType;
        private String url;
        
        // Getters e Setters
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public String getOriginalName() { return originalName; }
        public void setOriginalName(String originalName) { this.originalName = originalName; }
        
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        
        public Long getSize() { return size; }
        public void setSize(Long size) { this.size = size; }
        
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}


