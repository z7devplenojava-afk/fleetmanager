package br.com.fleetmanager.model.enums;

/**
 * Status de participação em treinamentos
 */
public enum TrainingStatus {
    AGENDADO("Agendado"),
    EM_ANDAMENTO("Em Andamento"),
    CONCLUIDO("Concluído"),
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
