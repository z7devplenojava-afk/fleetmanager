package br.com.fleetmanager.model.enums;

/**
 * Categorias de EPIs (Equipamentos de Proteção Individual)
 */
public enum EPICategory {
    CABECA("Cabeça"),
    OLHOS("Olhos"),
    AUDITIVO("Auditivo"),
    RESPIRATORIO("Respiratório"),
    MAOS("Mãos"),
    PES("Pés"),
    CORPO("Corpo");

    private final String description;

    EPICategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
