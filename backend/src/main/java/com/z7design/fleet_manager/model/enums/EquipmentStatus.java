package com.z7design.fleet_manager.model.enums;

public enum EquipmentStatus {
    EM_USO("Em uso"),
    EM_MANUTENCAO("Em manutenÃ§Ã£o"),
    AGUARDANDO_DESCARTE("Aguardando descarte"),
    EM_ESTOQUE("Em estoque"),
    BAIXADO("Baixado");

    private final String description;

    EquipmentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 
