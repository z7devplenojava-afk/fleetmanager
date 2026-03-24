package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request para validar contatos de funcionÃ¡rios antes do envio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactValidationRequest {
    
    /**
     * Lista de IDs de funcionÃ¡rios para validar
     */
    private List<UUID> employeeIds;
    
    /**
     * Tipo de envio desejado: "email", "whatsapp", "both"
     */
    private String type;
    
    /**
     * Tipo de documento: "holerite", "comprovante", "unificado"
     */
    private String documentType;
    
    /**
     * MÃªs e ano do documento (para contexto)
     */
    private Integer month;
    private Integer year;
}


