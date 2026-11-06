package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.CompanyWhatsAppConfig;
import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Orquestra o pareamento da conta WhatsApp no AstraCalls.
 *
 * <p>A sessao usada pela empresa e a informada em
 * {@code company_whatsapp_configs}; quando nao existe, usa a sessao global
 * ({@code astracalls.api.session-id}).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AstraCallsSessionService {

    private final AstraCallsApiService apiService;
    private final CompanyWhatsAppConfigService configService;
    private final AstraCallsEventStreamService eventStreamService;

    /**
     * Situacao da conexao AstraCalls para uma empresa.
     *
     * @param enabled     AstraCalls habilitado no ambiente
     * @param configured  URL/API key preenchidos
     * @param connected   conta pareada e conectada
     * @param sessionId   sessao em uso
     * @param sessionName nome da conta
     * @param state       estado da sessao (open, qr, logged_out...)
     * @param phoneNumber numero conectado
     * @param error       mensagem de erro (quando houver)
     * @param qr          QR Code atual da sessao (quando aguardando leitura)
     */
    public record ConnectionStatus(
            boolean enabled,
            boolean configured,
            boolean connected,
            String sessionId,
            String sessionName,
            String state,
            String phoneNumber,
            String error,
            String qr) {
    }

    public boolean isEnabled() {
        return apiService.isEnabled();
    }

    public boolean isConfigured() {
        return apiService.isApiConfigured();
    }

    public String resolveSessionId(UUID companyId) {
        CompanyWhatsAppConfig config = configService.find(companyId).orElse(null);
        if (config != null && hasText(config.getSessionId())) {
            return config.getSessionId().trim();
        }
        return apiService.defaultSessionId();
    }

    @Transactional(readOnly = true)
    public ConnectionStatus status(UUID companyId) {
        boolean enabled = apiService.isEnabled();
        boolean configured = apiService.isApiConfigured();
        String sessionId = resolveSessionId(companyId);

        if (!configured) {
            return new ConnectionStatus(enabled, false, false, sessionId, null, null, null,
                    "AstraCalls nao configurado. Defina ASTRACALLS_API_URL, ASTRACALLS_API_KEY e ASTRACALLS_SESSION_ID.",
                    null);
        }

        eventStreamService.ensureConnected();

        try {
            List<AstraCallsSession> sessions = apiService.listSessions();
            AstraCallsSession session = findSession(sessions, sessionId);

            if (session == null) {
                return new ConnectionStatus(enabled, true, false, sessionId, null, null, null,
                        sessionId == null
                                ? "Nenhuma sessao AstraCalls configurada."
                                : "Sessao AstraCalls " + sessionId + " nao encontrada.",
                        null);
            }

            boolean connected = "open".equalsIgnoreCase(session.state()) || session.paired();
            return new ConnectionStatus(
                    enabled,
                    true,
                    connected,
                    session.id(),
                    session.name(),
                    session.displayState(),
                    session.phoneNumber(),
                    null,
                    connected ? null : eventStreamService.qr(session.id()));
        } catch (AstraCallsException e) {
            log.warn("Falha ao consultar o status do AstraCalls: {}", e.getMessage());
            return new ConnectionStatus(enabled, true, false, sessionId, null, null, null, e.getMessage(), null);
        }
    }

    public List<AstraCallsSession> listSessions() {
        return apiService.listSessions();
    }

    /**
     * Cria uma conta no AstraCalls e passa a usa-la para a empresa.
     */
    @Transactional
    public String createSession(UUID companyId, String name) {
        String sessionId = apiService.createSession(hasText(name) ? name : "FleetManager");
        configService.upsert(companyId, WhatsAppProviderType.ASTRACALLS, true, sessionId);
        log.info("Sessao AstraCalls {} criada para a empresa {}", sessionId, companyId);
        return sessionId;
    }

    /**
     * Dispara o pareamento por QR Code da sessao da empresa.
     *
     * <p>Garante o SSE aberto antes, pois o QR so chega por esse canal.</p>
     */
    @Transactional
    public void requestPairing(UUID companyId) {
        eventStreamService.ensureConnected();
        apiService.requestPairing(ensureSessionId(companyId));
    }

    /**
     * Gera o codigo de pareamento (8 caracteres) da sessao da empresa.
     */
    @Transactional
    public String requestPairCode(UUID companyId, String phone) {
        return apiService.requestPairCode(ensureSessionId(companyId), phone);
    }

    private String ensureSessionId(UUID companyId) {
        String sessionId = resolveSessionId(companyId);
        if (hasText(sessionId)) {
            return sessionId;
        }
        if (companyId != null) {
            return createSession(companyId, "FleetManager");
        }
        return sessionId;
    }

    /**
     * Desconecta a conta, mantendo a sessao cadastrada.
     */
    public void logout(UUID companyId) {
        apiService.logout(resolveSessionId(companyId));
    }

    /**
     * Remove a conta do AstraCalls e limpa a sessao da empresa.
     */
    @Transactional
    public void deleteSession(UUID companyId) {
        String sessionId = resolveSessionId(companyId);
        apiService.deleteSession(sessionId);
        configService.clearSession(companyId);
    }

    private AstraCallsSession findSession(List<AstraCallsSession> sessions, String sessionId) {
        if (sessions == null || sessions.isEmpty()) {
            return null;
        }
        if (!hasText(sessionId)) {
            return sessions.size() == 1 ? sessions.get(0) : null;
        }
        for (AstraCallsSession session : sessions) {
            if (session != null && sessionId.equalsIgnoreCase(session.id())) {
                return session;
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
