package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialAuthRequest {
    
    @NotNull(message = "Embedding criptografado Ã© obrigatÃ³rio")
    private String encryptedEmbedding;
    
    @NotNull(message = "Latitude Ã© obrigatÃ³ria")
    @DecimalMin(value = "-90.0", message = "Latitude deve estar entre -90 e 90")
    @DecimalMax(value = "90.0", message = "Latitude deve estar entre -90 e 90")
    private BigDecimal latitude;
    
    @NotNull(message = "Longitude Ã© obrigatÃ³ria")
    @DecimalMin(value = "-180.0", message = "Longitude deve estar entre -180 e 180")
    @DecimalMax(value = "180.0", message = "Longitude deve estar entre -180 e 180")
    private BigDecimal longitude;
    
    private String ipAddress;
    
    private String userAgent;
    
    // Campos opcionais para validaÃ§Ã£o adicional
    private String deviceId;
    
    private String sessionId;
}

