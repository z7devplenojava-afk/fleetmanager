package br.com.fleetmanager.model.enums;

public enum LeadSource {
    WEBSITE("Website"),
    REFERRAL("Indicação"),
    COLD_CALL("Ligação a Frio"),
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