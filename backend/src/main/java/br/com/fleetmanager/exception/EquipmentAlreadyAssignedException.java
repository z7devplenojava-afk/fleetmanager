package br.com.fleetmanager.exception;

public class EquipmentAlreadyAssignedException extends RuntimeException {
    public EquipmentAlreadyAssignedException(String message) {
        super(message);
    }
    
    public EquipmentAlreadyAssignedException(String message, Throwable cause) {
        super(message, cause);
    }
}