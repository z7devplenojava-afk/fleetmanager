package com.z7design.fleet_manager.service.whatsapp;

/**
 * Resultado de um envio de WhatsApp.
 *
 * @param success           true quando o provedor confirmou o envio
 * @param providerMessageId id da mensagem no provedor (quando disponivel)
 * @param errorMessage      descricao do erro (quando success = false)
 * @param retryable         indica se faz sentido tentar novamente
 */
public record WhatsAppSendResult(
        boolean success,
        String providerMessageId,
        String errorMessage,
        boolean retryable) {

    public static WhatsAppSendResult success(String providerMessageId) {
        return new WhatsAppSendResult(true, providerMessageId, null, false);
    }

    public static WhatsAppSendResult failure(String errorMessage, boolean retryable) {
        return new WhatsAppSendResult(false, null, errorMessage, retryable);
    }
}
