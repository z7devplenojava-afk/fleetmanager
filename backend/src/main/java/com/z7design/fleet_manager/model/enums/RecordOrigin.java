package com.z7design.fleet_manager.model.enums;

public enum RecordOrigin {
    MOBILE_APP("Aplicativo Mobile"),
    WEB("Sistema Web"),
    BIOMETRY("Biometria"),
    MANUAL_ADJUSTMENT("Ajuste Manual");

    private final String description;

    RecordOrigin(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
