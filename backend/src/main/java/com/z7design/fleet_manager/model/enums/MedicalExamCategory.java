package com.z7design.fleet_manager.model.enums;

/**
 * Categorias de exames mÃ©dicos conforme PCMSO
 */
public enum MedicalExamCategory {
    ADMISSIONAL("Admissional"),
    PERIODICO("PeriÃ³dico"),
    RETORNO("Retorno ao Trabalho"),
    MUDANCA_FUNCAO("MudanÃ§a de FunÃ§Ã£o"),
    DEMISSIONAL("Demissional");

    private final String description;

    MedicalExamCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

