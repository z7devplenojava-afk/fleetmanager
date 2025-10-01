package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacialAuthResponse {
    
    private Boolean success;
    
    private String message;
    
    private String token;
    
    private UUID supervisorId;
    
    private String supervisorName;
    
    private String supervisorEmail;
    
    private BigDecimal confidenceScore;
    
    private LocalDateTime authenticationTime;
    
    private String sessionId;
    
    // Campos para debug (apenas em desenvolvimento)
    private String debugInfo;
    
    // Método para criar resposta de sucesso
    public static FacialAuthResponse success(String token, UUID supervisorId, 
                                          String supervisorName, String supervisorEmail,
                                          BigDecimal confidenceScore) {
        return FacialAuthResponse.builder()
            .success(true)
            .message("Autenticação facial realizada com sucesso")
            .token(token)
            .supervisorId(supervisorId)
            .supervisorName(supervisorName)
            .supervisorEmail(supervisorEmail)
            .confidenceScore(confidenceScore)
            .authenticationTime(LocalDateTime.now())
            .build();
    }
    
    // Método para criar resposta de falha
    public static FacialAuthResponse failure(String message, String failureReason) {
        return FacialAuthResponse.builder()
            .success(false)
            .message(message)
            .debugInfo(failureReason)
            .authenticationTime(LocalDateTime.now())
            .build();
    }
}
