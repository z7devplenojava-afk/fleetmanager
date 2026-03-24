package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response com resultado da validaÃ§Ã£o de contatos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactValidationResponse {
    
    /**
     * Lista de detalhes de validaÃ§Ã£o para cada funcionÃ¡rio
     */
    private List<ContactValidationDetail> details;
    
    /**
     * EstatÃ­sticas
     */
    private int totalEmployees;
    private long readyToSend;
    private long needingAction;
    private long withErrors;
    
    /**
     * Status geral
     */
    private boolean allReady;
    private String message;
}


