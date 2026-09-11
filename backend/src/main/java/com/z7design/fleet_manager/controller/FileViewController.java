package com.z7design.fleet_manager.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.OPTIONS})
@Slf4j
public class FileViewController {

    /**
     * Visualizar arquivo PDF de uploads
     */
    @GetMapping("/uploads/{fileName:.+}")
    public ResponseEntity<Resource> viewUploadFile(@PathVariable("fileName") String fileName) {
        return serveFile("uploads", fileName);
    }

    /**
     * Visualizar arquivo PDF de holerites
     */
    @GetMapping("/holerites/{fileName:.+}")
    public ResponseEntity<Resource> viewHoleriteFile(@PathVariable("fileName") String fileName) {
        return serveFile("holerites", fileName);
    }

    /**
     * Visualizar arquivo PDF de recibos
     */
    @GetMapping("/receipts/{fileName:.+}")
    public ResponseEntity<Resource> viewReceiptFile(@PathVariable("fileName") String fileName) {
        return serveFile("uploads/receipts", fileName);
    }

    /**
     * Visualizar arquivo PDF unificado
     */
    @GetMapping("/unified/{fileName:.+}")
    public ResponseEntity<Resource> viewUnifiedFile(@PathVariable("fileName") String fileName) {
        return serveFile("uploads/unified", fileName);
    }

    /**
     * MÃ©todo auxiliar para servir arquivos com headers CORS apropriados
     */
    private ResponseEntity<Resource> serveFile(String directory, String fileName) {
        try {
            Path filePath = Paths.get(directory, fileName);
            File file = filePath.toFile();
            
            if (!file.exists()) {
                log.warn("Arquivo nÃ£o encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            // Verificar se Ã© um arquivo PDF
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                log.warn("Tipo de arquivo nÃ£o suportado: {}", fileName);
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new FileSystemResource(file);
            
            // Headers para visualizaÃ§Ã£o de PDF
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", fileName);
            
            // Headers CORS para permitir visualizaÃ§Ã£o
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.set("Access-Control-Allow-Headers", "*");
            // Headers para permitir iframe
            headers.set("X-Frame-Options", "SAMEORIGIN"); // Permitir iframe do mesmo domÃ­nio
            headers.set("Content-Security-Policy", "frame-ancestors 'self' http://localhost:3000 http://localhost:8080"); // Permitir iframe de origens especÃ­ficas
            headers.set("Cache-Control", "public, max-age=3600");
            
            log.info("Servindo arquivo: {} ({} bytes)", filePath, file.length());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Erro ao servir arquivo {}: {}", fileName, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Verificar se arquivo existe
     */
    @GetMapping("/exists/{directory}/{fileName:.+}")
    public ResponseEntity<Boolean> fileExists(@PathVariable("directory") String directory, @PathVariable("fileName") String fileName) {
        try {
            Path filePath = Paths.get(directory, fileName);
            boolean exists = Files.exists(filePath);
            log.info("Verificando arquivo: {} - Existe: {}", filePath, exists);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            log.error("Erro ao verificar arquivo: {}", e.getMessage());
            return ResponseEntity.ok(false);
        }
    }
}

