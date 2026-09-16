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
        
        // Servir arquivos de upload estaticamente (com e sem prefixo /api)
        java.nio.file.Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String baseUploadPath = basePath.toString().replace("\\", "/") + "/";
        java.nio.file.Path parentBasePath = Paths.get("..", "uploads").toAbsolutePath().normalize();
        String parentUploadPath = parentBasePath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/uploads/**", "/api/uploads/**")
                .addResourceLocations(
                    "file:" + baseUploadPath,
                    "file:" + parentUploadPath,
                    "file:uploads/",
                    "file:../uploads/",
                    "file:/app/uploads/",
                    "file:/var/www/secured_guard/ci/uploads/"
                )
                .setCachePeriod(3600); // Cache por 1 hora
                
        // Servir arquivos de manutenção especificamente
        registry.addResourceHandler("/uploads/maintenance/**", "/api/uploads/maintenance/**")
                .addResourceLocations(
                    "file:" + baseUploadPath + "maintenance/",
                    "file:" + parentUploadPath + "maintenance/",
                    "file:uploads/maintenance/",
                    "file:../uploads/maintenance/"
                )
                .setCachePeriod(3600);
                
        // Servir arquivos de holerites
        registry.addResourceHandler("/holerites/**", "/api/holerites/**")
                .addResourceLocations("file:holerites/", "file:../holerites/")
                .setCachePeriod(3600);
                
        // Servir logos de empresas estaticamente (sem autenticação)
        try {
            java.nio.file.Path logoDir = Paths.get(uploadDir, "companies", "logos").toAbsolutePath().normalize();
            String logoPath = logoDir.toString().replace("\\", "/");
            if (!logoPath.endsWith("/")) {
                logoPath += "/";
            }
            
            java.nio.file.Path parentLogoDir = Paths.get("..", "uploads", "companies", "logos").toAbsolutePath().normalize();
            String parentLogoPath = parentLogoDir.toString().replace("\\", "/");
            if (!parentLogoPath.endsWith("/")) {
                parentLogoPath += "/";
            }
            
            log.info("📁 Caminho dos logos (absoluto): {}", logoPath);
            
            if (!Files.exists(logoDir)) {
                Files.createDirectories(logoDir);
                log.info("✅ Diretório de logos criado: {}", logoDir);
            }
            
            registry.addResourceHandler(
                    "/api/uploads/companies/logos/**",
                    "/uploads/companies/logos/**",
                    "/companies/logos/**"
                )
                .addResourceLocations(
                    "file:" + logoPath,
                    "file:" + parentLogoPath,
                    "file:uploads/companies/logos/",
                    "file:../uploads/companies/logos/",
                    "file:/app/uploads/companies/logos/",
                    "file:/var/www/secured_guard/ci/uploads/companies/logos/"
                )
                .setCachePeriod(3600);
            
            log.info("✅ ResourceHandler configurado para logos com múltiplos caminhos");
        } catch (Exception e) {
            log.error("❌ Erro ao configurar ResourceHandler para logos, usando fallback: {}", e.getMessage(), e);
            registry.addResourceHandler("/api/uploads/companies/logos/**", "/uploads/companies/logos/**")
                    .addResourceLocations(
                        "file:" + uploadDir + "/companies/logos/",
                        "file:../uploads/companies/logos/",
                        "file:uploads/companies/logos/"
                    )
                    .setCachePeriod(3600);
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
