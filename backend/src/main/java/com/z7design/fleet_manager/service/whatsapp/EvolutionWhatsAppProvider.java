package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.service.EvolutionApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Adaptador do servico Evolution existente para o contrato de provedor.
 *
 * <p>Nao altera o comportamento da Evolution: textos continuam usando
 * {@code sendTextMessage} e documentos usam {@code sendFileMessage} com um
 * arquivo temporario.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EvolutionWhatsAppProvider implements WhatsAppProvider {

    public static final String PROVIDER_ID = "evolution";

    private final EvolutionApiService evolutionApiService;

    @Override
    public String id() {
        return PROVIDER_ID;
    }

    @Override
    public boolean isAvailable() {
        return evolutionApiService.isEnabled();
    }

    @Override
    public boolean isConfigured(String sessionId) {
        return evolutionApiService.isEnabled();
    }

    @Override
    public WhatsAppSendResult sendText(String sessionId, String phone, String text, String idempotencyKey) {
        boolean sent = evolutionApiService.sendTextMessage(phone, text);
        if (sent) {
            return WhatsAppSendResult.success(null);
        }
        String error = evolutionApiService.getLastErrorMessage();
        return WhatsAppSendResult.failure(
                error != null ? error : "Falha ao enviar texto pela Evolution.", true);
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

        Path directory = null;
        Path file = null;
        try {
            directory = Files.createTempDirectory("fleet-whatsapp-");
            String safeName = sanitizeFilename(filename);
            file = directory.resolve(safeName);
            Files.write(file, content);

            boolean sent = evolutionApiService.sendFileMessage(phone, caption, file.toString());
            if (sent) {
                return WhatsAppSendResult.success(null);
            }
            String error = evolutionApiService.getLastErrorMessage();
            return WhatsAppSendResult.failure(
                    error != null ? error : "Falha ao enviar documento pela Evolution.", true);
        } catch (Exception e) {
            log.error("Erro ao preparar documento para a Evolution: {}", e.getMessage(), e);
            return WhatsAppSendResult.failure("Erro ao preparar documento para a Evolution: " + e.getMessage(), true);
        } finally {
            try {
                if (file != null) {
                    Files.deleteIfExists(file);
                }
                if (directory != null) {
                    Files.deleteIfExists(directory);
                }
            } catch (Exception e) {
                log.debug("Nao foi possivel remover arquivo temporario do WhatsApp: {}", e.getMessage());
            }
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "documento.pdf";
        }
        String safe = filename.replaceAll("[^A-Za-z0-9._-]", "_");
        return safe.isBlank() ? "documento.pdf" : safe;
    }
}
