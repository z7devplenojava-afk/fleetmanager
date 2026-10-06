package com.z7design.fleet_manager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
public class FileStorageService {
    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;
    private final String baseUrl = "/uploads/maintenance"; // Base URL para acesso aos arquivos

    public FileStorageService(@Value("${app.file.upload-dir:./uploads/maintenance}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("NÃ£o foi possÃ­vel criar o diretÃ³rio de upload: " + uploadDir, ex);
        }
        log.info("DiretÃ³rio de upload de arquivos inicializado em: {}", this.fileStorageLocation);
    }

    // Whitelist rigorosa de extensões permitidas
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            "jpg", "jpeg", "png", "webp", "pdf", "xlsx", "xls", "csv", "docx", "doc", "txt", "zip"
    );

    // Blacklist explícita de extensões executáveis / scripts (Defesa em profundidade)
    private static final java.util.Set<String> DANGEROUS_EXTENSIONS = java.util.Set.of(
            "exe", "bat", "cmd", "sh", "jsp", "jspx", "php", "py", "pl", "cgi", "asp", "aspx", 
            "html", "htm", "xhtml", "js", "vbs", "jar", "war", "ear", "scr", "pif", "com", "msi"
    );

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo inválido ou vazio.");
        }

        // 1. Normaliza e sanitiza o nome original
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        // 2. Proteção contra Path Traversal
        if (originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\")) {
            log.warn("⛔ Tentativa de Path Traversal bloqueada no upload: {}", originalFileName);
            throw new SecurityException("Nome do arquivo contém caracteres de caminho inválidos.");
        }

        // 3. Extrair e validar extensão
        int lastDotIndex = originalFileName.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == originalFileName.length() - 1) {
            log.warn("⛔ Arquivo sem extensão rejeitado: {}", originalFileName);
            throw new IllegalArgumentException("Arquivos sem extensão não são permitidos.");
        }

        String extension = originalFileName.substring(lastDotIndex + 1).toLowerCase().trim();

        // 4. Bloqueio imediato de extensões perigosas / scripts
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            log.error("🚨 BLOQUEIO DE SEGURANÇA: Tentativa de upload de script/executável bloqueada: extension={}", extension);
            throw new SecurityException("Tipo de arquivo estritamente proibido por motivos de segurança.");
        }

        // 5. Whitelist de extensões permitidas
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            log.warn("⛔ Extensão não autorizada: {}. Permitidas: {}", extension, ALLOWED_EXTENSIONS);
            throw new IllegalArgumentException("Extensão de arquivo não permitida. Extensões aceitas: " + ALLOWED_EXTENSIONS);
        }

        // 6. Sanitizar nome para evitar caracteres especiais no sistema de arquivos
        String baseName = originalFileName.substring(0, lastDotIndex).replaceAll("[^a-zA-Z0-9._-]", "_");
        String safeFileName = UUID.randomUUID().toString() + "_" + baseName + "." + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(safeFileName).normalize();
            
            // Garantir que o destino está estritamente contido no diretório autorizado
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                log.error("🚨 Tentativa de gravar arquivo fora do diretório de upload: {}", targetLocation);
                throw new SecurityException("Caminho de gravação inválido.");
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("✅ Arquivo {} armazenado com sucesso como {}", originalFileName, safeFileName);
            return baseUrl + "/" + safeFileName;
        } catch (IOException ex) {
            log.error("Erro ao armazenar arquivo {}: {}", originalFileName, ex.getMessage());
            throw new RuntimeException("Não foi possível armazenar o arquivo. Por favor, tente novamente!", ex);
        }
    }

    public List<String> storeFiles(List<MultipartFile> files) {
        return files.stream()
                .map(this::storeFile)
                .collect(Collectors.toList());
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            log.debug("URL do arquivo Ã© null ou vazia, ignorando exclusÃ£o");
            return;
        }

        try {
            // Extrai o nome do arquivo da URL completa
            String fileName;
            if (fileUrl.startsWith(baseUrl)) {
                fileName = fileUrl.substring(baseUrl.length() + 1); // +1 para remover a barra
            } else if (fileUrl.contains("/")) {
                // Se nÃ£o comeÃ§ar com baseUrl, tenta extrair o nome do arquivo do final da URL
                fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            } else {
                // Se nÃ£o tem barra, assume que Ã© o nome do arquivo
                fileName = fileUrl;
            }

            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();

            // Verifica se o caminho estÃ¡ dentro do diretÃ³rio permitido
            if (!filePath.startsWith(this.fileStorageLocation)) {
                log.warn("Tentativa de acessar arquivo fora do diretÃ³rio permitido: {}", filePath);
                return;
            }

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Arquivo {} excluÃ­do com sucesso.", fileName);
            } else {
                log.warn("Tentativa de excluir arquivo que nÃ£o existe: {}", fileName);
            }
        } catch (Exception ex) {
            log.error("Erro ao excluir arquivo {}: {}", fileUrl, ex.getMessage());
            // NÃ£o lanÃ§a exceÃ§Ã£o para nÃ£o interromper o processo de delete da
            // manutenÃ§Ã£o
        }
    }
}
