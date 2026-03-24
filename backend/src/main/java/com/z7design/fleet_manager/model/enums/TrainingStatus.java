package com.z7design.fleet_manager.model.enums;

/**
 * Status de participaÃ§Ã£o em treinamentos
 */
public enum TrainingStatus {
    AGENDADO("Agendado"),
    EM_ANDAMENTO("Em Andamento"),
    CONCLUIDO("ConcluÃ­do"),
    REPROVADO("Reprovado"),
    CANCELADO("Cancelado");

    private final String description;

    TrainingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

