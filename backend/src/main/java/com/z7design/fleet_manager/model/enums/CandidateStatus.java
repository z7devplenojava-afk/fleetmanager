package com.z7design.fleet_manager.model.enums;

public enum CandidateStatus {
    PENDING("Pendente"),
    APPROVED("Aprovado"),
    REJECTED("Reprovado"),
    INTERVIEWED("Entrevistado"),
    HIRED("Contratado"),
    WITHDRAWN("Desistiu");
    
    private final String displayName;
    
    CandidateStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
