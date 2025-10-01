package br.com.fleetmanager.model.enums;

/**
 * Tipos de alertas do sistema SST
 */
public enum SSTAlertType {
    EPI_VENCIMENTO("Vencimento de EPI"),
    EXAME_VENCIMENTO("Vencimento de Exame Médico"),
    TREINAMENTO_VENCIMENTO("Vencimento de Treinamento"),
    ACIDENTE("Registro de Acidente"),
    QUASE_ACIDENTE("Registro de Quase-Acidente"),
    NAO_CONFORMIDADE("Não Conformidade"),
    CIPA_MANDATO("Renovação de Mandato CIPA"),
    INSPECAO_PENDENTE("Inspeção Pendente");

    private final String description;

    SSTAlertType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
