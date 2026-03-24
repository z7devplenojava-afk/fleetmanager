package com.z7design.fleet_manager.model.enums;

public enum DailySummaryStatus {
    OK("Normal"),
    ABSENCE("Falta"),
    DELAY("Atraso"),
    INCOMPLETE("Incompleto");

    private final String description;

    DailySummaryStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
