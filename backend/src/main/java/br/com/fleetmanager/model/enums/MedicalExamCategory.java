package br.com.fleetmanager.model.enums;

/**
 * Categorias de exames médicos conforme PCMSO
 */
public enum MedicalExamCategory {
    ADMISSIONAL("Admissional"),
    PERIODICO("Periódico"),
    RETORNO("Retorno ao Trabalho"),
    MUDANCA_FUNCAO("Mudança de Função"),
    DEMISSIONAL("Demissional");

    private final String description;

    MedicalExamCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
