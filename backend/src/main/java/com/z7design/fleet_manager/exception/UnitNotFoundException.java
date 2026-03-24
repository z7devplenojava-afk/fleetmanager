package com.z7design.fleet_manager.exception;

public class UnitNotFoundException extends RuntimeException {
    public UnitNotFoundException(String message) {
        super(message);
    }
    
    public UnitNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
