package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import com.z7design.fleet_manager.repository.CompanyWhatsAppConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Resolve qual provedor usar para uma empresa.
 *
 * <p>Precedencia:</p>
 * <ol>
 *   <li>configuracao explicita em {@code company_whatsapp_configs};</li>
 *   <li>propriedade global {@code whatsapp.notifications.provider};</li>
 *   <li>Evolution como ultimo recurso.</li>
 * </ol>
 *
 * <p>Se o provedor configurado nao estiver pronto (URL/API key/sessao
 * ausentes), a resolucao cai para o proximo da lista em vez de falhar em
 * silencio.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppProviderRouter {

    private final CompanyWhatsAppConfigRepository configRepository;
    private final AstraCallsWhatsAppProvider astraCallsProvider;
    private final EvolutionWhatsAppProvider evolutionProvider;

    @Value("${whatsapp.notifications.provider:astracalls}")
    private String defaultProvider;

    public ResolvedProvider resolve(UUID companyId) {
        CompanyWhatsAppConfig config = null;
        if (companyId != null) {
            config = configRepository.findByCompanyId(companyId).orElse(null);
        }

        if (config != null && Boolean.TRUE.equals(config.getEnabled())) {
            ResolvedProvider configured = build(config.getProvider(), config.getSessionId());
            if (configured != null) {
                return configured;
            }
            log.warn("Provedor {} configurado para a empresa {} nao esta pronto; usando fallback.",
                    config.getProvider(), companyId);
        }

        ResolvedProvider global = build(parseProvider(defaultProvider), null);
        if (global != null) {
            return global;
        }

        log.warn("Nenhum provedor de WhatsApp configurado; usando Evolution como ultimo recurso.");
        return new ResolvedProvider(evolutionProvider, null, EvolutionWhatsAppProvider.PROVIDER_ID);
    }

    private ResolvedProvider build(WhatsAppProviderType providerType, String sessionId) {
        if (providerType == WhatsAppProviderType.ASTRACALLS
                && astraCallsProvider.isConfigured(sessionId)) {
            return new ResolvedProvider(astraCallsProvider, sessionId, AstraCallsWhatsAppProvider.PROVIDER_ID);
        }
        if (providerType == WhatsAppProviderType.EVOLUTION
                && evolutionProvider.isAvailable()) {
            return new ResolvedProvider(evolutionProvider, null, EvolutionWhatsAppProvider.PROVIDER_ID);
        }
        return null;
    }

    private WhatsAppProviderType parseProvider(String value) {
        if (value == null || value.isBlank()) {
            return WhatsAppProviderType.ASTRACALLS;
        }
        try {
            return WhatsAppProviderType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Provedor de WhatsApp desconhecido na configuracao: {}", value);
            return WhatsAppProviderType.ASTRACALLS;
        }
    }

    public record ResolvedProvider(WhatsAppProvider provider, String sessionId, String providerId) {
    }
}
