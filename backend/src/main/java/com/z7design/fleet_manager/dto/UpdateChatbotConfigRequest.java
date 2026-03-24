package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChatbotConfigRequest {
    
    private String name;
    private String welcomeMessage;
    private String defaultResponse;
    private Boolean isActive;
    private Boolean autoRespond;
    private Boolean transferToHumanEnabled;
    private Boolean workingHoursEnabled;
    private String workingHoursStart;
    private String workingHoursEnd;
    private String offlineMessage;
    private Integer maxWaitTimeMinutes;
    private Boolean autoEscalateEnabled;
    private Integer autoEscalateAfterMinutes;
    private Boolean knowledgeBaseEnabled;
    private Boolean sentimentAnalysisEnabled;
    private String language;
}


