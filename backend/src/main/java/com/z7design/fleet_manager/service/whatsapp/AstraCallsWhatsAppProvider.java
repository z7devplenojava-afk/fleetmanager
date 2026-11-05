package com.z7design.fleet_manager.service.whatsapp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AstraCallsWhatsAppProvider implements WhatsAppProvider {

    public static final String PROVIDER_ID = "astracalls";

    private final AstraCallsApiService astraCallsApiService;

    @Override
    public String id() {
        return PROVIDER_ID;
    }

    @Override
    public boolean isAvailable() {
        return astraCallsApiService.isConfigured(null);
    }

    @Override
    public boolean isConfigured(String sessionId) {
        return astraCallsApiService.isConfigured(sessionId);
    }

    @Override
    public WhatsAppSendResult sendText(String sessionId, String phone, String text, String idempotencyKey) {
        return astraCallsApiService.sendText(sessionId, phone, text, idempotencyKey);
    }

    @Override
    public WhatsAppSendResult sendDocument(
            String sessionId,
            String phone,
            byte[] content,
            String filename,
            String mimetype,
            String caption,
            String idempotencyKey) {
        return astraCallsApiService.sendDocument(
                sessionId, phone, content, filename, mimetype, caption, idempotencyKey);
    }
}
