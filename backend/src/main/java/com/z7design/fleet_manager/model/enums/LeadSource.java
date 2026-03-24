package com.z7design.fleet_manager.model.enums;

public enum LeadSource {
    WEBSITE("Website"),
    REFERRAL("IndicaÃ§Ã£o"),
    COLD_CALL("LigaÃ§Ã£o a Frio"),
    EMAIL_MARKETING("Email Marketing"),
    SOCIAL_MEDIA("Redes Sociais"),
    GOOGLE_ADS("Google Ads"),
    EVENT("Evento"),
    PARTNER("Parceiro"),
    OTHER("Outro");

    private final String displayName;

    LeadSource(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 
