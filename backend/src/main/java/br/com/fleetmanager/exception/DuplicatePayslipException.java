package br.com.fleetmanager.exception;

public class DuplicatePayslipException extends RuntimeException {
    public DuplicatePayslipException(String message) { super(message); }
} 