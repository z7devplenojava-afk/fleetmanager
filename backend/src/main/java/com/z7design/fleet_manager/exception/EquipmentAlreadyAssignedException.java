package com.z7design.fleet_manager.exception;

public class EquipmentAlreadyAssignedException extends RuntimeException {
    public EquipmentAlreadyAssignedException(String message) {
        super(message);
    }
    
    public EquipmentAlreadyAssignedException(String message, Throwable cause) {
        super(message, cause);
    }
}
