package com.z7design.fleet_manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.z7design.fleet_manager.service.FileStorageService;
import com.z7design.fleet_manager.security.TenantSecurityValidator;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.util.UUID;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);
    
    // Usar a mesma propriedade que FileUploadController
    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @org.springframework.beans.factory.annotation.Autowired
    private TenantSecurityValidator tenantSecurityValidator;
    
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
                    "file:/var/www/fluxbus/uploads/"
                )
                .setCachePeriod(3600); // Cache por 1 hora
                
        // Fotos de manutenção (/api/uploads/maintenance/** e /uploads/maintenance/**) são servidas
        // pelo FileUploadController com fallback persistente no PostgreSQL (sobrevive a deploys).
                
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
            
            // Logos e banners em /api/uploads/companies/** e /uploads/companies/** são servidos pelo
            // FileUploadController com fallback persistente no PostgreSQL e retorno 200 transparente quando ausente.
            registry.addResourceHandler("/companies/logos/**")
                .addResourceLocations(
                    "file:" + logoPath,
                    "file:" + parentLogoPath,
                    "file:uploads/companies/logos/",
                    "file:../uploads/companies/logos/",
                    "file:/app/uploads/companies/logos/",
                    "file:/var/www/fluxbus/uploads/companies/logos/"
                )
                .setCachePeriod(3600);
            
            registry.addResourceHandler("/companies/banners/**")
                .addResourceLocations(
                    "file:" + uploadDir + "/companies/banners/",
                    "file:../uploads/companies/banners/",
                    "file:uploads/companies/banners/",
                    "file:/app/uploads/companies/banners/"
                )
                .setCachePeriod(3600);
            
            log.info("✅ ResourceHandler configurado para logos e banners (com fallback em FileUploadController)");
        } catch (Exception e) {
            log.error("❌ Erro ao configurar ResourceHandler para logos/banners: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                // Adicionar headers CORS para arquivos estáticos
                if (request.getRequestURI().startsWith("/uploads/") || 
                    request.getRequestURI().startsWith("/holerites/") ||
                    request.getRequestURI().startsWith("/api/uploads/")) {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "*");
                }
                return true;
            }
        });

        // Bloqueio global: parâmetros de empresa vindos da requisição só são aceitos
        // de SUPER_ADMIN (ou quando coincidem com o tenant do JWT).
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                UUID tenantId = TenantContext.get();
                if (tenantId == null || tenantSecurityValidator.isSuperAdmin()) {
                    return true;
                }
                java.util.Enumeration<String> names = request.getParameterNames();
                while (names.hasMoreElements()) {
                    String name = names.nextElement();
                    String normalized = name.toLowerCase().replace("_", "");
                    if (!normalized.equals("companyid") && !normalized.equals("empresaid")
                            && !normalized.equals("targetcompanyid") && !normalized.equals("company")) {
                        continue;
                    }
                    String raw = request.getParameter(name);
                    if (raw == null || raw.isBlank()) {
                        continue;
                    }
                    try {
                        UUID requested = UUID.fromString(raw.trim());
                        if (!tenantId.equals(requested)) {
                            log.warn("Acesso cross-tenant bloqueado: {} tentou companyId={} (tenant={})",
                                    request.getRequestURI(), requested, tenantId);
                            response.sendError(HttpServletResponse.SC_FORBIDDEN,
                                    "Acesso negado: você não pode acessar dados de outra empresa.");
                            return false;
                        }
                    } catch (IllegalArgumentException e) {
                        response.sendError(HttpServletResponse.SC_BAD_REQUEST, "companyId inválido.");
                        return false;
                    }
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
