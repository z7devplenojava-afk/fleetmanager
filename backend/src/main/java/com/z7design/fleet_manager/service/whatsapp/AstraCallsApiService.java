package com.z7design.fleet_manager.service.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.z7design.fleet_manager.util.WhatsAppPhoneUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Cliente HTTP do AstraCalls.
 *
 * <p>Rotas usadas:</p>
 * <ul>
 *   <li>{@code POST /api/sessions/{sid}/messages/text}</li>
 *   <li>{@code POST /api/sessions/{sid}/messages/document}</li>
 * </ul>
 *
 * <p>A autenticacao e feita pelo header {@code X-API-Key}. Quando um
 * {@code idempotencyKey} e informado, ele e enviado em
 * {@code X-Message-ID}; reenviar o mesmo id nao duplica a mensagem no
 * WhatsApp.</p>
 */
@Service
@Slf4j
public class AstraCallsApiService {

    private static final String DEFAULT_MIMETYPE = "application/pdf";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${astracalls.api.enabled:false}")
    private boolean enabled;

    @Value("${astracalls.api.url:http://localhost:8090}")
    private String apiUrl;

    @Value("${astracalls.api.key:}")
    private String apiKey;

    @Value("${astracalls.api.session-id:}")
    private String defaultSessionId;

    public AstraCallsApiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Sessao AstraCalls padrao configurada no ambiente. */
    public String defaultSessionId() {
        return resolveSessionId(null);
    }

    /**
     * API acessivel: habilitada, com URL e API key preenchidos.
     * Nao exige sessao (necessario para listar/criar sessoes).
     */
    public boolean isApiConfigured() {
        return enabled && hasText(apiUrl) && hasText(apiKey);
    }

    /** URL base da API do AstraCalls (sem barra final). */
    public String apiUrl() {
        return baseUrl();
    }

    /** API key usada no header {@code X-API-Key}. */
    public String apiKey() {
        return apiKey;
    }

    /**
     * Considera configurado quando habilitado, com URL, API key e uma sessao
     * (global ou por empresa) preenchidos.
     */
    public boolean isConfigured(String sessionId) {
        return isApiConfigured() && hasText(resolveSessionId(sessionId));
    }

    /**
     * Lista as contas (sessoes) pareadas ou disponiveis no AstraCalls.
     */
    public List<AstraCallsSession> listSessions() {
        requireApiConfigured();

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl() + "/api/sessions",
                    HttpMethod.GET,
                    new HttpEntity<>(buildHeaders()),
                    String.class);

            JsonNode root = objectMapper.readTree(response.getBody() == null ? "{}" : response.getBody());
            JsonNode sessions = root.get("sessions");
            List<AstraCallsSession> result = new ArrayList<>();
            if (sessions != null && sessions.isArray()) {
                for (JsonNode node : sessions) {
                    result.add(AstraCallsSession.from(node));
                }
            }
            return result;
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou a listagem de sessoes (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (AstraCallsException e) {
            throw e;
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao listar sessoes no AstraCalls: " + e.getMessage());
        }
    }

    /**
     * Cria uma conta (sessao) no AstraCalls e devolve o id gerado.
     */
    public String createSession(String name) {
        requireApiConfigured();

        ObjectNode body = objectMapper.createObjectNode();
        body.put("name", hasText(name) ? name.trim() : "FleetManager");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl() + "/api/sessions",
                    HttpMethod.POST,
                    new HttpEntity<>(body.toString(), buildHeaders()),
                    String.class);

            JsonNode root = objectMapper.readTree(response.getBody() == null ? "{}" : response.getBody());
            JsonNode id = root.get("id");
            if (id == null || id.isNull() || id.asText().isBlank()) {
                throw new AstraCallsException("AstraCalls nao retornou o id da sessao criada.");
            }
            return id.asText();
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou a criacao da sessao (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (AstraCallsException e) {
            throw e;
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao criar sessao no AstraCalls: " + e.getMessage());
        }
    }

    /**
     * Dispara o pareamento por QR Code (o QR e emitido no SSE do AstraCalls).
     */
    public void requestPairing(String sessionId) {
        requireApiConfigured();
        String sid = requireSessionId(sessionId);

        try {
            restTemplate.exchange(
                    baseUrl() + "/api/sessions/" + sid + "/pair",
                    HttpMethod.POST,
                    new HttpEntity<>(buildHeaders()),
                    String.class);
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou o pareamento (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao iniciar o pareamento no AstraCalls: " + e.getMessage());
        }
    }

    /**
     * Inicia o pareamento por codigo (8 caracteres) usando o numero informado.
     */
    public String requestPairCode(String sessionId, String phone) {
        requireApiConfigured();
        String sid = requireSessionId(sessionId);

        String normalized = WhatsAppPhoneUtils.normalizeBrazilian(phone);
        if (normalized == null) {
            throw new AstraCallsException("Telefone invalido para o pareamento: " + phone);
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("phone", normalized);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl() + "/api/sessions/" + sid + "/pair-code",
                    HttpMethod.POST,
                    new HttpEntity<>(body.toString(), buildHeaders()),
                    String.class);

            JsonNode root = objectMapper.readTree(response.getBody() == null ? "{}" : response.getBody());
            JsonNode code = root.get("code");
            if (code == null || code.isNull() || code.asText().isBlank()) {
                throw new AstraCallsException("AstraCalls nao retornou o codigo de pareamento.");
            }
            return code.asText();
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou o pareamento por codigo (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (AstraCallsException e) {
            throw e;
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao gerar codigo de pareamento: " + e.getMessage());
        }
    }

    /**
     * Desconecta a conta (mantem a sessao criada).
     */
    public void logout(String sessionId) {
        requireApiConfigured();
        String sid = requireSessionId(sessionId);

        try {
            restTemplate.exchange(
                    baseUrl() + "/api/sessions/" + sid + "/logout",
                    HttpMethod.POST,
                    new HttpEntity<>(buildHeaders()),
                    String.class);
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou o logout (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao desconectar a sessao no AstraCalls: " + e.getMessage());
        }
    }

    /**
     * Remove a conta do AstraCalls.
     */
    public void deleteSession(String sessionId) {
        requireApiConfigured();
        String sid = requireSessionId(sessionId);

        try {
            restTemplate.exchange(
                    baseUrl() + "/api/sessions/" + sid,
                    HttpMethod.DELETE,
                    new HttpEntity<>(buildHeaders()),
                    String.class);
        } catch (HttpClientErrorException e) {
            throw new AstraCallsException("AstraCalls recusou a remocao da sessao (HTTP "
                    + e.getStatusCode().value() + "): " + safeBody(e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            throw new AstraCallsException("AstraCalls inacessivel: " + e.getMessage());
        } catch (Exception e) {
            throw new AstraCallsException("Erro ao remover a sessao no AstraCalls: " + e.getMessage());
        }
    }


    public WhatsAppSendResult sendText(String sessionId, String to, String text, String idempotencyKey) {
        if (!isConfigured(sessionId)) {
            return WhatsAppSendResult.failure("AstraCalls nao configurado (URL/API key/sessao ausentes).", false);
        }
        if (!hasText(text)) {
            return WhatsAppSendResult.failure("Texto da mensagem vazio.", false);
        }

        String phone = WhatsAppPhoneUtils.normalizeBrazilian(to);
        if (phone == null) {
            return WhatsAppSendResult.failure("Telefone de destino invalido: " + to, false);
        }

        String url = buildUrl(sessionId, "/messages/text");
        ObjectNode body = objectMapper.createObjectNode();
        body.put("to", phone);
        body.put("text", text);

        return execute(url, sessionId, body, idempotencyKey, "texto", phone);
    }

    public WhatsAppSendResult sendDocument(
            String sessionId,
            String to,
            byte[] content,
            String filename,
            String mimetype,
            String caption,
            String idempotencyKey) {

        if (!isConfigured(sessionId)) {
            return WhatsAppSendResult.failure("AstraCalls nao configurado (URL/API key/sessao ausentes).", false);
        }
        if (content == null || content.length == 0) {
            return WhatsAppSendResult.failure("Documento vazio.", false);
        }

        String phone = WhatsAppPhoneUtils.normalizeBrazilian(to);
        if (phone == null) {
            return WhatsAppSendResult.failure("Telefone de destino invalido: " + to, false);
        }

        String url = buildUrl(sessionId, "/messages/document");
        ObjectNode body = objectMapper.createObjectNode();
        body.put("to", phone);
        body.put("base64", Base64.getEncoder().encodeToString(content));
        body.put("mimetype", hasText(mimetype) ? mimetype : DEFAULT_MIMETYPE);
        body.put("filename", hasText(filename) ? filename : "documento.pdf");
        if (hasText(caption)) {
            body.put("caption", caption);
        }

        return execute(url, sessionId, body, idempotencyKey, "documento", phone);
    }

    private WhatsAppSendResult execute(
            String url,
            String sessionId,
            ObjectNode body,
            String idempotencyKey,
            String tipo,
            String phone) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("X-API-Key", apiKey);
        if (hasText(idempotencyKey)) {
            headers.set("X-Message-ID", idempotencyKey);
        }

        try {
            log.info("Enviando {} via AstraCalls para {} (sessao {})", tipo, maskPhone(phone), resolveSessionId(sessionId));
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body.toString(), headers), String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                String messageId = extractMessageId(response.getBody());
                log.info("AstraCalls confirmou o envio do {} (id={})", tipo, messageId);
                return WhatsAppSendResult.success(messageId);
            }

            String error = "AstraCalls retornou HTTP " + response.getStatusCode();
            log.warn(error);
            return WhatsAppSendResult.failure(error, response.getStatusCode().is5xxServerError());
        } catch (HttpClientErrorException e) {
            String detail = safeBody(e.getResponseBodyAsString());
            boolean retryable = e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS
                    || e.getStatusCode() == HttpStatus.REQUEST_TIMEOUT;
            String error = "AstraCalls HTTP " + e.getStatusCode().value() + ": " + detail;
            log.warn("Falha ao enviar {} via AstraCalls: {}", tipo, error);
            return WhatsAppSendResult.failure(error, retryable);
        } catch (HttpServerErrorException e) {
            String error = "AstraCalls HTTP " + e.getStatusCode().value() + ": " + safeBody(e.getResponseBodyAsString());
            log.warn("Falha temporaria ao enviar {} via AstraCalls: {}", tipo, error);
            return WhatsAppSendResult.failure(error, true);
        } catch (ResourceAccessException e) {
            String error = "AstraCalls inacessivel: " + e.getMessage();
            log.warn(error);
            return WhatsAppSendResult.failure(error, true);
        } catch (Exception e) {
            String error = "Erro ao enviar " + tipo + " via AstraCalls: " + e.getMessage();
            log.error(error, e);
            return WhatsAppSendResult.failure(error, true);
        }
    }

    private String buildUrl(String sessionId, String suffix) {
        return baseUrl() + "/api/sessions/" + resolveSessionId(sessionId) + suffix;
    }

    private String baseUrl() {
        String base = apiUrl == null ? "" : apiUrl.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set("X-API-Key", apiKey);
        return headers;
    }

    private void requireApiConfigured() {
        if (!isApiConfigured()) {
            throw new AstraCallsException(
                    "AstraCalls nao configurado. Verifique ASTRACALLS_API_ENABLED, ASTRACALLS_API_URL e ASTRACALLS_API_KEY.");
        }
    }

    private String requireSessionId(String sessionId) {
        String sid = resolveSessionId(sessionId);
        if (!hasText(sid)) {
            throw new AstraCallsException("Nenhuma sessao AstraCalls configurada para esta empresa.");
        }
        return sid;
    }

    private String resolveSessionId(String override) {
        if (hasText(override)) {
            return override.trim();
        }
        return defaultSessionId != null ? defaultSessionId.trim() : null;
    }

    private String extractMessageId(String body) {
        if (!hasText(body)) {
            return null;
        }
        try {
            JsonNode json = objectMapper.readTree(body);
            JsonNode id = json.get("id");
            return id != null && !id.isNull() ? id.asText() : null;
        } catch (Exception e) {
            log.debug("Resposta do AstraCalls sem JSON valido: {}", safeBody(body));
            return null;
        }
    }

    private String safeBody(String body) {
        if (body == null || body.isBlank()) {
            return "(sem corpo)";
        }
        String clean = body.replaceAll("\\s+", " ").trim();
        return clean.length() > 500 ? clean.substring(0, 500) + "..." : clean;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "****" + phone.substring(phone.length() - 4);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
