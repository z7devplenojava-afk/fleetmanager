package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatbotConfigRequest {
    
    @NotBlank(message = "Nome do chatbot Ã© obrigatÃ³rio")
    private String name;
    
    private String welcomeMessage;
    private String defaultResponse;
    private Boolean isActive = true;
    private Boolean autoRespond = true;
    private Boolean transferToHumanEnabled = true;
    private Boolean workingHoursEnabled = false;
    private String workingHoursStart;
    private String workingHoursEnd;
    private String offlineMessage;
    private Integer maxWaitTimeMinutes = 30;
    private Boolean autoEscalateEnabled = false;
    private Integer autoEscalateAfterMinutes = 15;
    private Boolean knowledgeBaseEnabled = false;
    private Boolean sentimentAnalysisEnabled = false;
    private String language = "pt-BR";
}


