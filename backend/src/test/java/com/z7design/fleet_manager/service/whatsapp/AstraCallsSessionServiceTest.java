package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AstraCallsSessionServiceTest {

    @Mock
    private AstraCallsApiService apiService;

    @Mock
    private CompanyWhatsAppConfigService configService;

    private AstraCallsSessionService service;
    private UUID companyId;

    @BeforeEach
    void setUp() {
        service = new AstraCallsSessionService(apiService, configService);
        companyId = UUID.randomUUID();
    }

    @Test
    @DisplayName("usa a sessao configurada na empresa")
    void resolvesCompanySession() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .provider(WhatsAppProviderType.ASTRACALLS)
                .enabled(true)
                .sessionId("sessao-empresa")
                .build();
        when(configService.find(companyId)).thenReturn(Optional.of(config));

        assertEquals("sessao-empresa", service.resolveSessionId(companyId));
    }

    @Test
    @DisplayName("usa a sessao global quando a empresa nao tem sessao propria")
    void fallsBackToGlobalSession() {
        when(configService.find(companyId)).thenReturn(Optional.empty());
        when(apiService.defaultSessionId()).thenReturn("sessao-global");

        assertEquals("sessao-global", service.resolveSessionId(companyId));
    }

    @Test
    @DisplayName("status conectado quando a sessao esta aberta")
    void reportsConnectedSession() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .sessionId("sessao-1")
                .build();
        when(configService.find(companyId)).thenReturn(Optional.of(config));
        when(apiService.isEnabled()).thenReturn(true);
        when(apiService.isApiConfigured()).thenReturn(true);
        when(apiService.listSessions()).thenReturn(List.of(new AstraCallsSession(
                "sessao-1", "Frota", "5511999999999:12@s.whatsapp.net", null, "open", true)));

        AstraCallsSessionService.ConnectionStatus status = service.status(companyId);

        assertTrue(status.connected());
        assertTrue(status.configured());
        assertEquals("open", status.state());
        assertEquals("5511999999999", status.phoneNumber());
        assertNull(status.error());
    }

    @Test
    @DisplayName("status desconectado quando o AstraCalls nao esta configurado")
    void reportsNotConfigured() {
        when(configService.find(companyId)).thenReturn(Optional.empty());
        when(apiService.isEnabled()).thenReturn(false);
        when(apiService.isApiConfigured()).thenReturn(false);
        when(apiService.defaultSessionId()).thenReturn(null);

        AstraCallsSessionService.ConnectionStatus status = service.status(companyId);

        assertFalse(status.connected());
        assertFalse(status.configured());
        assertTrue(status.error().contains("AstraCalls nao configurado"));
    }

    @Test
    @DisplayName("cria a sessao e passa a usa-la na empresa")
    void createsAndStoresSession() {
        when(apiService.createSession("Frota Norte")).thenReturn("sessao-nova");

        String sessionId = service.createSession(companyId, "Frota Norte");

        assertEquals("sessao-nova", sessionId);
        verify(configService).upsert(companyId, WhatsAppProviderType.ASTRACALLS, true, "sessao-nova");
    }

    @Test
    @DisplayName("gera codigo de pareamento usando a sessao da empresa")
    void generatesPairCode() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .sessionId("sessao-1")
                .build();
        when(configService.find(companyId)).thenReturn(Optional.of(config));
        when(apiService.requestPairCode("sessao-1", "11999999999")).thenReturn("ABCD1234");

        assertEquals("ABCD1234", service.requestPairCode(companyId, "11999999999"));
    }

    @Test
    @DisplayName("remove a sessao e limpa a configuracao da empresa")
    void deletesSession() {
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .sessionId("sessao-1")
                .build();
        when(configService.find(companyId)).thenReturn(Optional.of(config));

        service.deleteSession(companyId);

        verify(apiService).deleteSession("sessao-1");
        verify(configService).clearSession(companyId);
    }
}
