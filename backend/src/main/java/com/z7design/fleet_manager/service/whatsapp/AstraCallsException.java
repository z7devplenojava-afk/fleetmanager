package com.z7design.fleet_manager.service.whatsapp;

/**
 * Erro de comunicacao/configuracao com o AstraCalls.
 *
 * <p>A mensagem ja vem formatada para exibicao ao usuario.</p>
 */
public class AstraCallsException extends RuntimeException {

    public AstraCallsException(String message) {
        super(message);
    }

    public AstraCallsException(String message, Throwable cause) {
        super(message, cause);
    }
}
