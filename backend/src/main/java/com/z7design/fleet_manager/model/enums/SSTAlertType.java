package com.z7design.fleet_manager.model.enums;

/**
 * Tipos de alertas do sistema SST
 */
public enum SSTAlertType {
    EPI_VENCIMENTO("Vencimento de EPI"),
    EXAME_VENCIMENTO("Vencimento de Exame MÃ©dico"),
    TREINAMENTO_VENCIMENTO("Vencimento de Treinamento"),
    ACIDENTE("Registro de Acidente"),
    QUASE_ACIDENTE("Registro de Quase-Acidente"),
    NAO_CONFORMIDADE("NÃ£o Conformidade"),
    CIPA_MANDATO("RenovaÃ§Ã£o de Mandato CIPA"),
    INSPECAO_PENDENTE("InspeÃ§Ã£o Pendente");

    private final String description;

    SSTAlertType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

