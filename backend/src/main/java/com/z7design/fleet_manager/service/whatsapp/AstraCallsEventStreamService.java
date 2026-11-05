package com.z7design.fleet_manager.service.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Consome o canal SSE unico do AstraCalls ({@code GET /api/events}) e mantem
 * em memoria o ultimo QR Code emitido por sessao.
 *
 * <p>O AstraCalls nao expoe o QR por REST: ele so chega no SSE, marcado com o
 * {@code sessionId} de origem. Este servico abre uma unica conexao e guarda o
 * QR mais recente para que o {@link AstraCallsSessionService} possa expo-lo no
 * status da conexao.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AstraCallsEventStreamService {

    private final AstraCallsApiService apiService;
    private final ObjectMapper objectMapper;

    private final Map<String, String> qrBySession = new ConcurrentHashMap<>();
    private final Map<String, String> stateBySession = new ConcurrentHashMap<>();
    private final Map<String, Boolean> pairedBySession = new ConcurrentHashMap<>();

    private final AtomicBoolean connecting = new AtomicBoolean(false);
    private volatile Disposable subscription;

    /**
     * Garante que a conexao com o SSE esta aberta (idempotente). Nao faz nada
     * quando o AstraCalls nao esta configurado.
     */
    public void ensureConnected() {
        if (subscription != null && !subscription.isDisposed()) {
            return;
        }
        if (!apiService.isApiConfigured() || !connecting.compareAndSet(false, true)) {
            return;
        }

        try {
            String eventsUrl = apiService.apiUrl() + "/api/events?apiKey="
                    + URLEncoder.encode(apiService.apiKey(), StandardCharsets.UTF_8);

            subscription = WebClient.create()
                    .get()
                    .uri(URI.create(eventsUrl))
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .doOnNext(this::handleEvent)
                    .doOnError(e -> log.warn("Falha no SSE do AstraCalls: {}", e.getMessage()))
                    .doFinally(signal -> {
                        connecting.set(false);
                        log.info("SSE do AstraCalls encerrado ({}); reconecta na proxima consulta", signal);
                    })
                    .onErrorResume(e -> Mono.empty())
                    .subscribe();
        } catch (Exception e) {
            connecting.set(false);
            log.warn("Nao foi possivel abrir o SSE do AstraCalls: {}", e.getMessage());
        }
    }

    /** Ultimo QR Code conhecido para a sessao (ou {@code null}). */
    public String qr(String sessionId) {
        return sessionId == null ? null : qrBySession.get(sessionId);
    }

    @PreDestroy
    public void shutdown() {
        Disposable current = subscription;
        if (current != null) {
            current.dispose();
        }
    }

    private void handleEvent(String data) {
        if (data == null || data.isBlank()) {
            return;
        }
        try {
            JsonNode event = objectMapper.readTree(data);
            String type = text(event, "type");
            if (type == null) {
                return;
            }

            switch (type) {
                case "session-qr" -> {
                    String sessionId = text(event, "sessionId");
                    String qr = text(event, "qr");
                    if (sessionId != null && qr != null) {
                        qrBySession.put(sessionId, qr);
                    }
                }
                case "auth-state" -> applyAuthState(event);
                case "session-list" -> applySessionList(event);
                default -> {
                    // Eventos de chamada nao interessam para o pareamento.
                }
            }
        } catch (Exception e) {
            log.debug("Evento do SSE do AstraCalls ignorado: {}", e.getMessage());
        }
    }

    private void applyAuthState(JsonNode event) {
        String sessionId = text(event, "sessionId");
        if (sessionId == null) {
            return;
        }

        boolean paired = event.path("paired").asBoolean(false);
        String state = text(event, "state");
        pairedBySession.put(sessionId, paired);
        if (state != null) {
            stateBySession.put(sessionId, state);
        }

        if (paired) {
            qrBySession.remove(sessionId);
            return;
        }

        String qr = text(event, "qr");
        if (qr != null) {
            qrBySession.put(sessionId, qr);
        }
    }

    private void applySessionList(JsonNode event) {
        JsonNode sessions = event.get("sessions");
        if (sessions == null || !sessions.isArray()) {
            return;
        }
        for (JsonNode session : sessions) {
            String id = text(session, "id");
            if (id == null) {
                continue;
            }
            boolean paired = session.path("paired").asBoolean(false);
            pairedBySession.put(id, paired);
            String state = text(session, "state");
            if (state != null) {
                stateBySession.put(id, state);
            }
            if (paired) {
                qrBySession.remove(id);
            }
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
