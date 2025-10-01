package br.com.fleetmanager.exception;

public class EquipmentExpiredException extends RuntimeException {
    public EquipmentExpiredException(String message) {
        super(message);
    }
    
    public EquipmentExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}