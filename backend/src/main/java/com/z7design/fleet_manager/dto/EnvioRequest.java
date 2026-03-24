package com.z7design.fleet_manager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnvioRequest {
    
    @NotNull(message = "Tipo de envio Ã© obrigatÃ³rio")
    private String tipo; // "email" ou "whatsapp"
    
    private String funcionarioId; // Para envio individual
    private String cpf; // Para envio individual por CPF
    
    private List<String> funcionarioIds; // Para envio em massa
    
    private String mensagem; // Mensagem personalizada
    
    private String assunto; // Para emails

    // PerÃ­odo do holerite a enviar
    private Integer month;
    private Integer year;
} 
