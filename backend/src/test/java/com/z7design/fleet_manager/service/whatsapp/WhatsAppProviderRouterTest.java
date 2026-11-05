package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import com.z7design.fleet_manager.repository.CompanyWhatsAppConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhatsAppProviderRouterTest {

    @Mock
    private CompanyWhatsAppConfigRepository configRepository;

    @Mock
    private AstraCallsWhatsAppProvider astraCallsProvider;

    @Mock
    private EvolutionWhatsAppProvider evolutionProvider;

    private WhatsAppProviderRouter router;
    private UUID companyId;

    @BeforeEach
    void setUp() {
        router = new WhatsAppProviderRouter(configRepository, astraCallsProvider, evolutionProvider);
        ReflectionTestUtils.setField(router, "defaultProvider", "astracalls");
        companyId = UUID.randomUUID();
    }

    @Test
    @DisplayName("empresa com AstraCalls configurado usa a sessao da empresa")
    void usesCompanyAstraCallsSession() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .provider(WhatsAppProviderType.ASTRACALLS)
                .enabled(true)
                .sessionId("sessao-empresa")
                .build();

        when(configRepository.findByCompanyId(companyId)).thenReturn(Optional.of(config));
        when(astraCallsProvider.isConfigured("sessao-empresa")).thenReturn(true);

        WhatsAppProviderRouter.ResolvedProvider resolved = router.resolve(companyId);

        assertEquals(astraCallsProvider, resolved.provider());
        assertEquals("sessao-empresa", resolved.sessionId());
        assertEquals(AstraCallsWhatsAppProvider.PROVIDER_ID, resolved.providerId());
    }

    @Test
    @DisplayName("configuracao da empresa desabilitada cai para o provedor global")
    void disabledCompanyConfigFallsBackToGlobal() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .provider(WhatsAppProviderType.ASTRACALLS)
                .enabled(false)
                .build();

        when(configRepository.findByCompanyId(companyId)).thenReturn(Optional.of(config));
        when(astraCallsProvider.isConfigured(null)).thenReturn(true);

        WhatsAppProviderRouter.ResolvedProvider resolved = router.resolve(companyId);

        assertEquals(astraCallsProvider, resolved.provider());
        assertNull(resolved.sessionId());
    }

    @Test
    @DisplayName("AstraCalls global sem configuracao cai para Evolution")
    void fallsBackToEvolutionWhenAstraCallsIsNotConfigured() {
        when(astraCallsProvider.isConfigured(null)).thenReturn(false);

        WhatsAppProviderRouter.ResolvedProvider resolved = router.resolve(null);

        assertEquals(evolutionProvider, resolved.provider());
        assertEquals(EvolutionWhatsAppProvider.PROVIDER_ID, resolved.providerId());
    }

    @Test
    @DisplayName("provedor global Evolution e respeitado")
    void respectsGlobalEvolutionProvider() {
        ReflectionTestUtils.setField(router, "defaultProvider", "evolution");
        when(evolutionProvider.isAvailable()).thenReturn(true);

        WhatsAppProviderRouter.ResolvedProvider resolved = router.resolve(companyId);

        assertEquals(evolutionProvider, resolved.provider());
    }

    @Test
    @DisplayName("configuracao AstraCalls da empresa sem sessao usa sessao global")
    void companyConfigWithoutSessionUsesGlobalSession() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .provider(WhatsAppProviderType.ASTRACALLS)
                .enabled(true)
                .build();

        when(configRepository.findByCompanyId(companyId)).thenReturn(Optional.of(config));
        when(astraCallsProvider.isConfigured(null)).thenReturn(true);

        WhatsAppProviderRouter.ResolvedProvider resolved = router.resolve(companyId);

        assertEquals(astraCallsProvider, resolved.provider());
        assertNull(resolved.sessionId());
    }
}
