package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * ConfiguraÃ§Ã£o para o layout padrÃ£o de relatÃ³rios
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportLayoutConfig {
    
    /**
     * ID da empresa para buscar informaÃ§Ãµes (nome, CNPJ, logo, etc.)
     */
    private UUID companyId;
    
    /**
     * TÃ­tulo do relatÃ³rio
     */
    private String reportTitle;
    
    /**
     * Cores personalizadas do gradiente (opcional, usa padrÃ£o se null)
     * Estrutura preparada para futura personalizaÃ§Ã£o por empresa
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
        private String yellow; // PadrÃ£o: #FFCC00
        private String orange; // PadrÃ£o: #FF9900
        private String red;    // PadrÃ£o: #FF3333
    }
    
    /**
     * Margem superior do conteÃºdo (para acomodar o cabeÃ§alho)
     * PadrÃ£o: 120px
     */
    @Builder.Default
    private float topMargin = 120f;
    
    /**
     * Margem inferior do conteÃºdo (para acomodar o rodapÃ©)
     * PadrÃ£o: 80px
     */
    @Builder.Default
    private float bottomMargin = 80f;
    
    /**
     * Margem esquerda do conteÃºdo
     * PadrÃ£o: 50px
     */
    @Builder.Default
    private float leftMargin = 50f;
    
    /**
     * Margem direita do conteÃºdo
     * PadrÃ£o: 50px
     */
    @Builder.Default
    private float rightMargin = 50f;
}

