package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddTicketMessageRequest {
    
    @NotBlank(message = "ConteÃºdo da mensagem Ã© obrigatÃ³rio")
    private String content;
    
    @NotBlank(message = "Nome do remetente Ã© obrigatÃ³rio")
    private String senderName;
    
    private String senderEmail;
    
    private Boolean isSupport = false;
}


