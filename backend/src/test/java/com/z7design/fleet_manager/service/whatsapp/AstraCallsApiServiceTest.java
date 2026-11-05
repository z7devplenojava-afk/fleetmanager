package com.z7design.fleet_manager.service.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AstraCallsApiServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AstraCallsApiService service;

    @BeforeEach
    void setUp() {
        service = new AstraCallsApiService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "apiUrl", "http://astracalls.local:8090");
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "defaultSessionId", "session-1");
    }

    @Test
    @DisplayName("envia texto com sessao, API key e idempotencia")
    void sendsTextWithExpectedHeadersAndBody() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"id\":\"wamid.123\"}"));

        WhatsAppSendResult result = service.sendText(
                "session-2", "(11) 99999-9999", "Ola motorista", "idem-1");

        assertTrue(result.success());
        assertEquals("wamid.123", result.providerMessageId());

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

        HttpEntity<?> request = captor.getValue();
        assertEquals("test-key", request.getHeaders().getFirst("X-API-Key"));
        assertEquals("idem-1", request.getHeaders().getFirst("X-Message-ID"));

        JsonNode body = objectMapper.readTree((String) request.getBody());
        assertEquals("5511999999999", body.get("to").asText());
        assertEquals("Ola motorista", body.get("text").asText());
    }

    @Test
    @DisplayName("envia PDF em base64 com nome e mimetype")
    void sendsDocumentAsBase64() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"id\":\"doc-1\"}"));

        byte[] pdf = "conteudo-pdf".getBytes(StandardCharsets.UTF_8);
        WhatsAppSendResult result = service.sendDocument(
                null, "11999999999", pdf, "OS-1.pdf", "application/pdf", "Resumo da OS", "idem-2");

        assertTrue(result.success());

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));

        JsonNode body = objectMapper.readTree((String) captor.getValue().getBody());
        assertEquals("5511999999999", body.get("to").asText());
        assertEquals(Base64.getEncoder().encodeToString(pdf), body.get("base64").asText());
        assertEquals("application/pdf", body.get("mimetype").asText());
        assertEquals("OS-1.pdf", body.get("filename").asText());
        assertEquals("Resumo da OS", body.get("caption").asText());
    }

    @Test
    @DisplayName("nao chama a API quando desabilitado")
    void doesNotCallApiWhenDisabled() {
        ReflectionTestUtils.setField(service, "enabled", false);

        WhatsAppSendResult result = service.sendText(null, "11999999999", "teste", null);

        assertFalse(result.success());
        assertFalse(result.retryable());
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("nao chama a API para telefone invalido")
    void doesNotCallApiForInvalidPhone() {
        WhatsAppSendResult result = service.sendText(null, "abc", "teste", null);

        assertFalse(result.success());
        assertFalse(result.retryable());
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("marca 429 como falha temporaria")
    void marksRateLimitAsRetryable() {
        HttpClientErrorException error = HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                HttpHeaders.EMPTY,
                "{\"error\":\"rate limit\"}".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(error);

        WhatsAppSendResult result = service.sendText(null, "11999999999", "teste", null);

        assertFalse(result.success());
        assertTrue(result.retryable());
        assertNotNull(result.errorMessage());
    }

    @Test
    @DisplayName("marca 400 como falha definitiva")
    void marksBadRequestAsPermanent() {
        HttpClientErrorException error = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                "{\"error\":\"invalid\"}".getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(error);

        WhatsAppSendResult result = service.sendText(null, "11999999999", "teste", null);

        assertFalse(result.success());
        assertFalse(result.retryable());
    }

    @Test
    @DisplayName("resposta sem JSON nao impede o envio")
    void succeedsWhenResponseHasNoJson() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(""));

        WhatsAppSendResult result = service.sendText(null, "11999999999", "teste", null);

        assertTrue(result.success());
        assertEquals(null, result.providerMessageId());
    }

    @Test
    @DisplayName("lista as contas pareadas")
    void listsSessions() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("""
                        {"sessions":[
                          {"id":"abc123","name":"FleetManager","jid":"5511999999999:12@s.whatsapp.net",
                           "state":"open","paired":true}
                        ]}
                        """));

        var sessions = service.listSessions();

        assertEquals(1, sessions.size());
        assertEquals("abc123", sessions.get(0).id());
        assertEquals("open", sessions.get(0).state());
        assertTrue(sessions.get(0).paired());
        assertEquals("5511999999999", sessions.get(0).phoneNumber());
    }

    @Test
    @DisplayName("cria conta e devolve o id da sessao")
    void createsSession() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"id\":\"sessao-nova\"}"));

        String sessionId = service.createSession("Frota Norte");

        assertEquals("sessao-nova", sessionId);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));
        JsonNode body = objectMapper.readTree((String) captor.getValue().getBody());
        assertEquals("Frota Norte", body.get("name").asText());
        assertEquals("test-key", captor.getValue().getHeaders().getFirst("X-API-Key"));
    }

    @Test
    @DisplayName("gera codigo de pareamento com o numero informado")
    void requestsPairCode() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"code\":\"ABCD1234\"}"));

        String code = service.requestPairCode("session-1", "(11) 99999-9999");

        assertEquals("ABCD1234", code);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), captor.capture(), eq(String.class));
        JsonNode body = objectMapper.readTree((String) captor.getValue().getBody());
        assertEquals("5511999999999", body.get("phone").asText());
    }

    @Test
    @DisplayName("desconecta a conta mantendo a sessao")
    void logsOut() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(""));

        service.logout("session-1");

        verify(restTemplate).exchange(
                eq("http://astracalls.local:8090/api/sessions/session-1/logout"),
                eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("falha clara quando o AstraCalls nao esta configurado")
    void throwsWhenNotConfigured() {
        ReflectionTestUtils.setField(service, "enabled", false);

        AstraCallsException error = assertThrows(AstraCallsException.class, () -> service.listSessions());

        assertTrue(error.getMessage().contains("AstraCalls nao configurado"));
        verifyNoInteractions(restTemplate);
    }
}
