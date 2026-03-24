package com.z7design.fleet_manager.model.enums;

public enum ExpenseType {
    FIXA("Fixa"),
    VARIAVEL("VariÃ¡vel");
    
    private final String displayName;
    
    ExpenseType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
} 
