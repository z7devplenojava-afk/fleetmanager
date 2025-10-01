package br.com.fleetmanager.model.enums;

import lombok.Getter;

@Getter
public enum ShiftTime {
    SHIFT_6H_18H("6h às 18h"),
    SHIFT_18H_6H("18h às 6h"),
    SHIFT_7H_19H("7h às 19h"),
    SHIFT_19H_7H("19h às 7h");

    private final String description;

    ShiftTime(String description) {
        this.description = description;
    }
}
