package com.z7design.fleet_manager.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller para diagnÃ³stico do sistema
 * Endpoint pÃºblico para verificar status do sistema
 */
@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
@Slf4j
public class DiagnosticController {

    private final DataSource dataSource;

    @Value("${spring.application.name:Secured Guard}")
    private String applicationName;

    @Value("${server.port:8080}")
    private String serverPort;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> diagnosticStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            response.put("application", applicationName);
            response.put("port", serverPort);
            response.put("timestamp", LocalDateTime.now().toString());
            
            // Verificar conexÃ£o com banco de dados
            Map<String, Object> dbStatus = new HashMap<>();
            try (Connection connection = dataSource.getConnection()) {
                boolean isValid = connection.isValid(5);
                dbStatus.put("connected", isValid);
                
                if (isValid) {
                    DatabaseMetaData metaData = connection.getMetaData();
                    dbStatus.put("database", metaData.getDatabaseProductName());
                    dbStatus.put("version", metaData.getDatabaseProductVersion());
                    dbStatus.put("url", metaData.getURL());
                    dbStatus.put("username", metaData.getUserName());
                }
            } catch (Exception e) {
                log.error("Erro ao verificar banco de dados: {}", e.getMessage());
                dbStatus.put("connected", false);
                dbStatus.put("error", e.getMessage());
            }
            
            response.put("database", dbStatus);
            response.put("status", dbStatus.get("connected").equals(true) ? "HEALTHY" : "UNHEALTHY");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro no diagnÃ³stico: {}", e.getMessage(), e);
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}


