package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import com.z7design.fleet_manager.repository.CompanyWhatsAppConfigRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Mantem a configuracao de WhatsApp por empresa (provedor e sessao).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyWhatsAppConfigService {

    private final CompanyWhatsAppConfigRepository repository;

    @Transactional(readOnly = true)
    public Optional<CompanyWhatsAppConfig> find(UUID companyId) {
        if (companyId == null) {
            return Optional.empty();
        }
        return repository.findByCompanyId(companyId);
    }

    @Transactional
    public CompanyWhatsAppConfig upsert(
            UUID companyId,
            WhatsAppProviderType provider,
            Boolean enabled,
            String sessionId) {

        if (companyId == null) {
            throw new IllegalArgumentException("Empresa nao informada para a configuracao de WhatsApp.");
        }

        UUID currentTenant = TenantContext.get();
        if (currentTenant != null && !currentTenant.equals(companyId)) {
            throw new IllegalArgumentException("Configuracao de WhatsApp nao pode ser alterada para outra empresa.");
        }

        CompanyWhatsAppConfig config = repository.findByCompanyId(companyId)
                .orElseGet(() -> CompanyWhatsAppConfig.builder()
                        .companyId(companyId)
                        .provider(WhatsAppProviderType.ASTRACALLS)
                        .enabled(true)
                        .build());

        if (provider != null) {
            config.setProvider(provider);
        }
        if (enabled != null) {
            config.setEnabled(enabled);
        }
        if (sessionId != null) {
            config.setSessionId(sessionId.trim());
        }

        CompanyWhatsAppConfig saved = repository.save(config);
        log.info("Configuracao de WhatsApp da empresa {} atualizada: provedor={}, sessao={}",
                companyId, saved.getProvider(), saved.getSessionId());
        return saved;
    }

    @Transactional
    public void clearSession(UUID companyId) {
        CompanyWhatsAppConfig config = repository.findByCompanyId(companyId).orElse(null);
        if (config == null) {
            return;
        }
        config.setSessionId(null);
        repository.save(config);
    }
}
