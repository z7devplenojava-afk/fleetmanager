package com.z7design.fleet_manager.model.enums;

public enum JustificationType {
    MEDICAL_CERTIFICATE("Atestado Médico"),
    COMPENSATORY_DAY_OFF("Folga Compensatória"),
    LEGAL_ABSENCE("Falta Legal"),
    UNJUSTIFIED("Não Justificada"),
    VACATION("Férias"),
    MATERNITY_LEAVE("Licença Maternidade"),
    PATERNITY_LEAVE("Licença Paternidade");

    private final String description;

    JustificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
