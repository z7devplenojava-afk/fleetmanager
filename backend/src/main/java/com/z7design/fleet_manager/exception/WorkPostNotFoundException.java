package com.z7design.fleet_manager.exception;

public class WorkPostNotFoundException extends RuntimeException {
    public WorkPostNotFoundException(String message) {
        super(message);
    }
    
    public WorkPostNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
