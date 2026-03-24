package com.z7design.fleet_manager.model.enums;

import lombok.Getter;

@Getter
public enum ShiftTime {
    SHIFT_6H_18H("6h Ã s 18h"),
    SHIFT_18H_6H("18h Ã s 6h"),
    SHIFT_7H_19H("7h Ã s 19h"),
    SHIFT_19H_7H("19h Ã s 7h");

    private final String description;

    ShiftTime(String description) {
        this.description = description;
    }
}

