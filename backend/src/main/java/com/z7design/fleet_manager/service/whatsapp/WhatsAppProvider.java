package com.z7design.fleet_manager.service.whatsapp;

/**
 * Contrato minimo para provedores de WhatsApp usados pelo fleetmanager.
 *
 * <p>O {@code sessionId} so e relevante para o AstraCalls; a Evolution o
 * ignora e continua usando a instancia configurada globalmente.</p>
 */
public interface WhatsAppProvider {

    String id();

    boolean isAvailable();

    boolean isConfigured(String sessionId);

    WhatsAppSendResult sendText(String sessionId, String phone, String text, String idempotencyKey);

    WhatsAppSendResult sendDocument(
            String sessionId,
            String phone,
            byte[] content,
            String filename,
            String mimetype,
            String caption,
            String idempotencyKey);
}
