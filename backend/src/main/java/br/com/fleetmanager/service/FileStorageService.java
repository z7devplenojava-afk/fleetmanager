package br.com.fleetmanager.service;

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

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;
    private final String baseUrl = "/uploads/maintenance"; // Base URL para acesso aos arquivos

    public FileStorageService(@Value("${app.file.upload-dir:./uploads/maintenance}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Não foi possível criar o diretório de upload: " + uploadDir, ex);
        }
        log.info("Diretório de upload de arquivos inicializado em: {}", this.fileStorageLocation);
    }

    public String storeFile(MultipartFile file) {
        // Normaliza o nome do arquivo
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            // Verifica se o nome do arquivo contém caracteres inválidos
            if (fileName.contains("..")) {
                throw new IOException("Nome do arquivo contém sequência de caminho inválida " + fileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("Arquivo {} armazenado com sucesso em {}", originalFileName, targetLocation);
            // Retorna a URL relativa para o frontend
            return baseUrl + "/" + fileName;
        } catch (IOException ex) {
            log.error("Erro ao armazenar arquivo {}: {}", originalFileName, ex.getMessage());
            throw new RuntimeException("Não foi possível armazenar o arquivo " + originalFileName + ". Por favor, tente novamente!", ex);
        }
    }

    public List<String> storeFiles(List<MultipartFile> files) {
        return files.stream()
                .map(this::storeFile)
                .collect(Collectors.toList());
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            log.debug("URL do arquivo é null ou vazia, ignorando exclusão");
            return;
        }

        try {
            // Extrai o nome do arquivo da URL completa
            String fileName;
            if (fileUrl.startsWith(baseUrl)) {
                fileName = fileUrl.substring(baseUrl.length() + 1); // +1 para remover a barra
            } else if (fileUrl.contains("/")) {
                // Se não começar com baseUrl, tenta extrair o nome do arquivo do final da URL
                fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            } else {
                // Se não tem barra, assume que é o nome do arquivo
                fileName = fileUrl;
            }
            
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            
            // Verifica se o caminho está dentro do diretório permitido
            if (!filePath.startsWith(this.fileStorageLocation)) {
                log.warn("Tentativa de acessar arquivo fora do diretório permitido: {}", filePath);
                return;
            }

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Arquivo {} excluído com sucesso.", fileName);
            } else {
                log.warn("Tentativa de excluir arquivo que não existe: {}", fileName);
            }
        } catch (Exception ex) {
            log.error("Erro ao excluir arquivo {}: {}", fileUrl, ex.getMessage());
            // Não lança exceção para não interromper o processo de delete da manutenção
        }
    }
} 