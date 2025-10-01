package br.com.fleetmanager.dto;

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
    
    @NotNull(message = "Embedding criptografado é obrigatório")
    private String encryptedEmbedding;
    
    @NotNull(message = "Latitude é obrigatória")
    @DecimalMin(value = "-90.0", message = "Latitude deve estar entre -90 e 90")
    @DecimalMax(value = "90.0", message = "Latitude deve estar entre -90 e 90")
    private BigDecimal latitude;
    
    @NotNull(message = "Longitude é obrigatória")
    @DecimalMin(value = "-180.0", message = "Longitude deve estar entre -180 e 180")
    @DecimalMax(value = "180.0", message = "Longitude deve estar entre -180 e 180")
    private BigDecimal longitude;
    
    private String ipAddress;
    
    private String userAgent;
    
    // Campos opcionais para validação adicional
    private String deviceId;
    
    private String sessionId;
}
