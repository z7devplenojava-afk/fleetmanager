package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum ShiftChangeStatus {
    PENDING("Pendente"),
    APPROVED("Aprovada"),
    REJECTED("Rejeitada");

    private final String description;

    ShiftChangeStatus(String description) {
        this.description = description;
    }
}

