package br.com.fleetmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import br.com.fleetmanager.service.FileStorageService;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir arquivos de upload estaticamente
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600); // Cache por 1 hora
                
        // Servir arquivos de manutenção especificamente
        registry.addResourceHandler("/uploads/maintenance/**")
                .addResourceLocations("file:uploads/maintenance/")
                .setCachePeriod(3600);
                
        // Servir arquivos de holerites
        registry.addResourceHandler("/holerites/**")
                .addResourceLocations("file:holerites/")
                .setCachePeriod(3600);
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                // Adicionar headers CORS para arquivos estáticos
                if (request.getRequestURI().startsWith("/uploads/") || 
                    request.getRequestURI().startsWith("/holerites/")) {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "*");
                    // Não definir X-Frame-Options para permitir iframe
                    response.setHeader("Content-Disposition", "inline");
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