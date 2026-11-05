package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Fachada de envio de WhatsApp usada pelos fluxos de negocio.
 *
 * <p>Resolve o provedor da empresa (AstraCalls ou Evolution) via
 * {@link WhatsAppProviderRouter} em vez de chamar a Evolution diretamente,
 * garantindo que a escolha feita em Configuracoes &gt; WhatsApp seja respeitada
 * por 2FA, recuperacao de senha, multas, lavajato, limpeza, mobilizacao e
 * holerites.</p>
 *
 * <p>Quando o {@code companyId} nao e informado, o gateway usa o tenant da
 * requisicao atual ({@link TenantContext}); se nao houver, cai para o provedor
 * global configurado em {@code whatsapp.notifications.provider}.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppGateway {

    private final WhatsAppProviderRouter providerRouter;

    /** Envia texto resolvendo a empresa pelo contexto atual. */
    public WhatsAppSendResult sendText(String phone, String text) {
        return sendText(TenantContext.get(), phone, text);
    }

    /** Envia texto para a empresa indicada. */
    public WhatsAppSendResult sendText(UUID companyId, String phone, String text) {
        WhatsAppProviderRouter.ResolvedProvider resolved = providerRouter.resolve(companyId);
        return resolved.provider().sendText(
                resolved.sessionId(), phone, text, UUID.randomUUID().toString());
    }

    /** Envia documento resolvendo a empresa pelo contexto atual. */
    public WhatsAppSendResult sendDocument(
            String phone, byte[] content, String filename, String mimetype, String caption) {
        return sendDocument(TenantContext.get(), phone, content, filename, mimetype, caption);
    }

    /** Envia documento para a empresa indicada. */
    public WhatsAppSendResult sendDocument(
            UUID companyId,
            String phone,
            byte[] content,
            String filename,
            String mimetype,
            String caption) {
        WhatsAppProviderRouter.ResolvedProvider resolved = providerRouter.resolve(companyId);
        return resolved.provider().sendDocument(
                resolved.sessionId(), phone, content, filename, mimetype, caption,
                UUID.randomUUID().toString());
    }
}
