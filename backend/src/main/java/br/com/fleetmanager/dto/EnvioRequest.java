package br.com.fleetmanager.dto;

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
    
    @NotNull(message = "Tipo de envio é obrigatório")
    private String tipo; // "email" ou "whatsapp"
    
    private String funcionarioId; // Para envio individual
    
    @NotEmpty(message = "Lista de funcionários é obrigatória para envio em massa")
    private List<String> funcionarioIds; // Para envio em massa
    
    private String mensagem; // Mensagem personalizada
    
    private String assunto; // Para emails
} 