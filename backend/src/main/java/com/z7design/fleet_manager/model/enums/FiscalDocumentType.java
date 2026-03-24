package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum FiscalDocumentType {
    NF_E("Nota Fiscal Eletrônica"),
    NFS_E("Nota Fiscal de Serviço Eletrônica"),
    CT_E("Conhecimento de Transporte Eletrônico"),
    NFC_E("Nota Fiscal de Consumidor Eletrônica");

    private final String displayName;

    FiscalDocumentType(String displayName) {
        this.displayName = displayName;
    }
}
