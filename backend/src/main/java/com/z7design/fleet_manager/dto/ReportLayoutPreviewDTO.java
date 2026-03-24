package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO para preview de layout de relatÃ³rio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportLayoutPreviewDTO {
    
    /**
     * ID da empresa
     */
    private UUID companyId;
    
    /**
     * Nome da empresa
     */
    private String companyName;
    
    /**
     * Logo da empresa (URL ou base64)
     */
    private String logoUrl;
    
    /**
     * CNPJ formatado
     */
    private String cnpj;
    
    /**
     * EndereÃ§o completo formatado
     */
    private String fullAddress;
    
    /**
     * Telefone formatado
     */
    private String phone;
    
    /**
     * Email
     */
    private String email;
    
    /**
     * Texto do rodapÃ© completo
     */
    private String footerText;
    
    /**
     * Cores do gradiente (personalizÃ¡veis por empresa)
     */
    private GradientColors gradientColors;
    
    /**
     * Cores do gradiente
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradientColors {
        private String yellow; // #FFCC00
        private String orange; // #FF9900
        private String red;    // #FF3333
    }
}

