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

    public String storeFile(MultipartFile file) {
        // Normaliza o nome do arquivo
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            // Verifica se o nome do arquivo contÃ©m caracteres invÃ¡lidos
            if (fileName.contains("..")) {
                throw new IOException("Nome do arquivo contÃ©m sequÃªncia de caminho invÃ¡lida " + fileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("Arquivo {} armazenado com sucesso em {}", originalFileName, targetLocation);
            // Retorna a URL relativa para o frontend
            return baseUrl + "/" + fileName;
        } catch (IOException ex) {
            log.error("Erro ao armazenar arquivo {}: {}", originalFileName, ex.getMessage());
            throw new RuntimeException(
                    "NÃ£o foi possÃ­vel armazenar o arquivo " + originalFileName + ". Por favor, tente novamente!", ex);
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
