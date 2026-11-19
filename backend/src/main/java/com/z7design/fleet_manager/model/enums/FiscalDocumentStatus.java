package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum FiscalDocumentStatus {
    PENDING("Pendente"),
    IMPORTED("Importado"),
    VALIDATED("Validado"),
    ISSUED("Emitido"),
    CANCELLED("Cancelado"),
    ERROR("Erro processamento");

    private final String displayName;

    FiscalDocumentStatus(String displayName) {
        this.displayName = displayName;
    }
}
