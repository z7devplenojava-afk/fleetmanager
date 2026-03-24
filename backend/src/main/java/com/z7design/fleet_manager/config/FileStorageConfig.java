package com.z7design.fleet_manager.config;

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
                log.info("DiretÃ³rio de armazenamento criado: {}", path.toAbsolutePath());
            } else {
                log.info("DiretÃ³rio de armazenamento jÃ¡ existe: {}", path.toAbsolutePath());
            }
            return storagePath;
        } catch (IOException e) {
            log.error("Erro ao criar diretÃ³rio de armazenamento: {}", e.getMessage());
            throw new RuntimeException("NÃ£o foi possÃ­vel criar o diretÃ³rio de armazenamento", e);
        }
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ConfiguraÃ§Ã£o para servir arquivos estÃ¡ticos (se necessÃ¡rio)
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + storagePath + "/");
    }
}

