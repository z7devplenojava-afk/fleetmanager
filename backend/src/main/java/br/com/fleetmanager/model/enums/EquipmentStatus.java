package br.com.fleetmanager.model.enums;

public enum EquipmentStatus {
    EM_USO("Em uso"),
    EM_MANUTENCAO("Em manutenção"),
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