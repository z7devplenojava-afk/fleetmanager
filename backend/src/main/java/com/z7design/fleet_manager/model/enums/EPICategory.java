package com.z7design.fleet_manager.model.enums;

/**
 * Categorias de EPIs (Equipamentos de ProteÃ§Ã£o Individual)
 */
public enum EPICategory {
    CABECA("CabeÃ§a"),
    OLHOS("Olhos"),
    AUDITIVO("Auditivo"),
    RESPIRATORIO("RespiratÃ³rio"),
    MAOS("MÃ£os"),
    PES("PÃ©s"),
    CORPO("Corpo");

    private final String description;

    EPICategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

