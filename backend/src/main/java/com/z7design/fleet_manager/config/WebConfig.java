package com.z7design.fleet_manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.z7design.fleet_manager.service.FileStorageService;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.Paths;
import java.nio.file.Files;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);
    
    // Usar a mesma propriedade que FileUploadController
    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:uploads}")
    private String uploadDir;
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        log.info("ðŸ”§ Configurando ResourceHandlers para arquivos estÃ¡ticos");
        log.info("ðŸ“ uploadDir configurado: {}", uploadDir);
        
        // Servir arquivos de upload estaticamente
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600); // Cache por 1 hora
                
        // Servir arquivos de manutenÃ§Ã£o especificamente
        registry.addResourceHandler("/uploads/maintenance/**")
                .addResourceLocations("file:uploads/maintenance/")
                .setCachePeriod(3600);
                
        // Servir arquivos de holerites
        registry.addResourceHandler("/holerites/**")
                .addResourceLocations("file:holerites/")
                .setCachePeriod(3600);
                
        // Servir logos de empresas estaticamente (sem autenticaÃ§Ã£o)
        // IMPORTANTE: Usar o mesmo caminho que FileUploadController para garantir consistÃªncia
        try {
            // Usar o mesmo cÃ¡lculo de caminho que FileUploadController
            java.nio.file.Path logoDir = Paths.get(uploadDir, "companies", "logos").toAbsolutePath().normalize();
            String logoPath = logoDir.toString().replace("\\", "/");
            
            // Garantir que termine com /
            if (!logoPath.endsWith("/")) {
                logoPath += "/";
            }
            
            log.info("ðŸ“ Caminho dos logos (absoluto): {}", logoPath);
            
            // Verificar se o diretÃ³rio existe, se nÃ£o, criar
            if (!Files.exists(logoDir)) {
                Files.createDirectories(logoDir);
                log.info("âœ… DiretÃ³rio de logos criado: {}", logoDir);
            } else {
                log.info("âœ… DiretÃ³rio de logos jÃ¡ existe: {}", logoDir);
            }
            
            registry.addResourceHandler("/api/uploads/companies/logos/**")
                    .addResourceLocations("file:" + logoPath)
                    .setCachePeriod(3600); // Cache por 1 hora
            
            log.info("âœ… ResourceHandler configurado para logos: /api/uploads/companies/logos/** -> file:{}", logoPath);
        } catch (Exception e) {
            log.error("âŒ Erro ao configurar ResourceHandler para logos, usando fallback: {}", e.getMessage(), e);
            // Fallback: usar caminho relativo
            registry.addResourceHandler("/api/uploads/companies/logos/**")
                    .addResourceLocations("file:" + uploadDir + "/companies/logos/")
                    .setCachePeriod(3600); // Cache por 1 hora
        }
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                // Adicionar headers CORS para arquivos estÃ¡ticos
                if (request.getRequestURI().startsWith("/uploads/") || 
                    request.getRequestURI().startsWith("/holerites/") ||
                    request.getRequestURI().startsWith("/api/uploads/companies/logos/")) {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "*");
                    // NÃƒO definir Content-Disposition aqui - serÃ¡ definido pelo ResourceHandler ou pelo endpoint do controller
                    // NÃ£o definir X-Frame-Options para permitir iframe
                }
                return true;
            }
        });
    }

    @Bean(name = "receiptStorageService")
    public FileStorageService receiptStorageService() {
        return new FileStorageService("receipts");
    }
} 
