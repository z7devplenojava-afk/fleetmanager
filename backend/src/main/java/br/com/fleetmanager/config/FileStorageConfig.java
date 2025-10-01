package br.com.fleetmanager.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {
    
    @Value("${app.file.storage-path:data/files}")
    private String storagePath;
    
    @Bean
    public String fileStoragePath() {
        try {
            Path path = Paths.get(storagePath);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("Diretório de armazenamento criado: {}", path.toAbsolutePath());
            } else {
                log.info("Diretório de armazenamento já existe: {}", path.toAbsolutePath());
            }
            return storagePath;
        } catch (IOException e) {
            log.error("Erro ao criar diretório de armazenamento: {}", e.getMessage());
            throw new RuntimeException("Não foi possível criar o diretório de armazenamento", e);
        }
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configuração para servir arquivos estáticos (se necessário)
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + storagePath + "/");
    }
}
