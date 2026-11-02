package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum MedicalCertificateType {
    ATESTADO_AFASTAMENTO("Atestado de Afastamento / Doença"),
    DECLARACAO_COMPARECIMENTO("Declaração de Comparecimento"),
    ATESTADO_ACOMPANHAMENTO("Atestado de Acompanhamento"),
    ATESTADO_APTIDAO("Atestado de Aptidão Física ou Sanidade"),
    ATESTADO_DOENCA_ACIDENTE("Atestado por Doença ou Acidente"),
    AFASTAMENTO_INSS("Afastamento pelo INSS"),
    ACIDENTE_TRABALHO("Acidente de Trabalho"),
    LICENCA_MATERNIDADE_PATERNIDADE("Licença Maternidade ou Paternidade"),
    LICENCA_MATRIMONIAL("Licença Matrimonial"),
    TESTEMUNHA_JUDICIAL("Afastamento como Testemunha Judicial"),
    PROCESSO_TRABALHISTA("Processos Trabalhistas");

    private final String description;

    MedicalCertificateType(String description) {
        this.description = description;
    }
}
