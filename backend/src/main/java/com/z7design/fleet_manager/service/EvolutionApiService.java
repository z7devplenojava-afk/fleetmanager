package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.nio.file.Files;
import java.util.Base64;
import java.util.Map;

@Service
public class EvolutionApiService {

    private static final Logger logger = LoggerFactory.getLogger(EvolutionApiService.class);

    @Value("${evolution.api.url:http://localhost:8080}")
    private String evolutionApiUrl;

    @Value("${evolution.api.key:}")
    private String apiKey;

    @Value("${evolution.api.instance:securedguard}")
    private String instanceName;

    @Value("${evolution.api.enabled:false}")
    private boolean evolutionEnabled;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final BaileysRestService baileysRestService;
    private String lastErrorMessage;

    public EvolutionApiService(RestTemplate restTemplate, ObjectMapper objectMapper, BaileysRestService baileysRestService) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.baileysRestService = baileysRestService;
        this.lastErrorMessage = null;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public String getServiceUrl() {
        return evolutionApiUrl;
    }

    public boolean isEnabled() {
        return evolutionEnabled;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.set("apikey", apiKey);
        }
        return headers;
    }

    public boolean createInstance() {
        try {
            String url = evolutionApiUrl + "/instance/create/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            logger.info("Criando instância Evolution API: {}", instanceName);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                logger.info("Instância criada/verificada com sucesso: {}", instanceName);
                return true;
            }
            logger.warn("Resposta inesperada ao criar instância: {}", response.getStatusCode());
            return false;
        } catch (HttpClientErrorException.Conflict e) {
            logger.info("Instância já existe: {}", instanceName);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao criar instância: {}", e.getMessage());
            lastErrorMessage = "Erro ao criar instância: " + e.getMessage();
            return false;
        }
    }

    public boolean deleteInstance() {
        try {
            String url = evolutionApiUrl + "/instance/delete/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            logger.info("Removendo instância Evolution API: {}", instanceName);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpClientErrorException.NotFound e) {
            logger.info("Instância não encontrada para deleção: {}", instanceName);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao deletar instância: {}", e.getMessage());
            return false;
        }
    }

    public boolean isServiceAvailable() {
        try {
            if (!evolutionEnabled) {
                logger.warn("Evolution API não está habilitada.");
                lastErrorMessage = "Evolution API não está habilitada.";
                return false;
            }

            String url = evolutionApiUrl + "/instance/connectionState/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Evolution API está disponível");
                lastErrorMessage = null;
                return true;
            }
            return false;
        } catch (ResourceAccessException e) {
            logger.warn("Evolution API não acessível: {}", e.getMessage());
            lastErrorMessage = "Evolution API não acessível: " + e.getMessage();
            return false;
        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("Instância Evolution não encontrada, tentando criar...");
            boolean created = createInstance();
            if (created) {
                lastErrorMessage = null;
                return true;
            }
            lastErrorMessage = "Instância Evolution não encontrada e não foi possível criar.";
            return false;
        } catch (Exception e) {
            logger.warn("Evolution API não disponível: {}", e.getMessage());
            lastErrorMessage = "Evolution API não disponível: " + e.getMessage();
            return false;
        }
    }

    public String getConnectionState() {
        try {
            String url = evolutionApiUrl + "/instance/connectionState/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                try {
                    JsonNode json = objectMapper.readTree(response.getBody());
                    String state = json.has("state") ? json.get("state").asText() : null;
                    if (state == null && json.has("instance")) {
                        state = json.get("instance").get("state").asText();
                    }
                    logger.info("Estado da conexão Evolution: {}", state);
                    return state;
                } catch (Exception e) {
                    logger.warn("Erro ao parsear estado da conexão");
                    return "unknown";
                }
            }
            return "closed";
        } catch (ResourceAccessException e) {
            logger.debug("Evolution API não acessível: {}", e.getMessage());
            return "closed";
        } catch (HttpClientErrorException.NotFound e) {
            logger.debug("Instância não encontrada: {}", instanceName);
            return "closed";
        } catch (Exception e) {
            logger.warn("Erro ao verificar conexão Evolution: {}", e.getMessage());
            return "unknown";
        }
    }

    public boolean checkConnection() {
        String state = getConnectionState();
        return "open".equals(state);
    }

    public String getQRCode() {
        try {
            if (!evolutionEnabled) {
                logger.warn("Evolution API não habilitada");
                return null;
            }

            boolean instanceCreated = createInstance();
            if (!instanceCreated) {
                logger.error("Não foi possível criar/verificar instância");
                return null;
            }

            String url = evolutionApiUrl + "/instance/connect/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());

            logger.info("Solicitando QR Code da Evolution API: {}", url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                String body = response.getBody();
                if (body != null) {
                    try {
                        JsonNode json = objectMapper.readTree(body);
                        if (json.has("base64")) {
                            String base64 = json.get("base64").asText();
                            logger.info("QR Code obtido via Evolution (base64, {} chars)", base64.length());
                            return base64;
                        }
                        if (json.has("code")) {
                            String code = json.get("code").asText();
                            logger.info("QR Code obtido via Evolution (code, {} chars)", code.length());
                            return code;
                        }
                        if (json.has("qrcode")) {
                            return json.get("qrcode").asText();
                        }
                        logger.warn("QR Code response sem campo conhecido: {}", body.substring(0, Math.min(200, body.length())));
                        return body;
                    } catch (Exception e) {
                        logger.warn("Resposta QR Code não-JSON, retornando raw");
                        return body;
                    }
                }
            }
            logger.warn("Resposta inesperada ao obter QR Code: {}", response.getStatusCode());
            return null;
        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            if (errorBody != null && errorBody.contains("QR")) {
                logger.debug("QR Code ainda não disponível (Evolution)");
                throw e;
            }
            logger.warn("Erro ao obter QR Code Evolution: {} - {}", e.getMessage(), errorBody);
            return null;
        } catch (ResourceAccessException e) {
            logger.error("Evolution API não acessível: {}", e.getMessage());
            lastErrorMessage = "Evolution API não acessível: " + e.getMessage();
            return null;
        } catch (Exception e) {
            logger.error("Erro ao obter QR Code Evolution: {}", e.getMessage());
            return null;
        }
    }

    public boolean disconnectInstance() {
        try {
            String url = evolutionApiUrl + "/instance/logout/" + instanceName;
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpClientErrorException.NotFound e) {
            logger.info("Instância não encontrada para logout: {}", instanceName);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao desconectar instância Evolution: {}", e.getMessage());
            return false;
        }
    }

    public boolean resetInstance() {
        boolean disconnected = disconnectInstance();
        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
        boolean deleted = deleteInstance();
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}
        return disconnected && deleted;
    }

    public boolean initializeInstance() {
        if (!evolutionEnabled) {
            logger.debug("Evolution API não habilitada");
            return false;
        }
        String state = getConnectionState();
        if ("open".equals(state)) {
            logger.info("Instância Evolution já está conectada");
            return true;
        }
        if ("close".equals(state) || "closed".equals(state)) {
            resetInstance();
            try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
        }
        return createInstance();
    }

    private String normalizePhoneNumber(String phoneNumber) {
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");
        if (cleanNumber.startsWith("55")) {
            if (cleanNumber.length() == 13 && cleanNumber.charAt(4) == '9') {
                return cleanNumber.substring(0, 4) + cleanNumber.substring(5);
            }
            return cleanNumber;
        }
        if (cleanNumber.length() == 10 || cleanNumber.length() == 11 || cleanNumber.length() == 12) {
            String normalized = "55" + cleanNumber;
            if (normalized.length() == 13 && normalized.charAt(4) == '9') {
                return normalized.substring(0, 4) + normalized.substring(5);
            }
            return normalized;
        }
        logger.warn("Número com formato não padrão: {} (tamanho: {})", cleanNumber, cleanNumber.length());
        return cleanNumber;
    }

    public boolean sendTextMessage(String phoneNumber, String message) {
        lastErrorMessage = null;
        try {
            if (!checkConnection()) {
                lastErrorMessage = "WhatsApp Evolution não está conectado.";
                logger.error("Tentativa de envio com Evolution desconectado");
                return false;
            }

            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            String url = evolutionApiUrl + "/message/sendText/" + instanceName;

            HttpHeaders headers = createHeaders();
            ObjectNode body = objectMapper.createObjectNode();
            body.put("number", normalizedNumber);
            body.put("text", message);
            if (!message.contains("\n")) {
                body.put("delay", 1200);
            }

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            logger.info("Enviando texto via Evolution para: {} (normalizado: {})", phoneNumber, normalizedNumber);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                logger.info("Mensagem enviada com sucesso via Evolution");
                return true;
            }
            lastErrorMessage = "Erro HTTP " + response.getStatusCode();
            logger.error("Erro ao enviar mensagem Evolution: {}", response.getStatusCode());
            return false;
        } catch (ResourceAccessException e) {
            lastErrorMessage = "Evolution API não acessível: " + e.getMessage();
            logger.error("Erro de conexão Evolution: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            lastErrorMessage = "Erro ao enviar mensagem Evolution: " + e.getMessage();
            logger.error("Erro ao enviar mensagem Evolution", e);
            return false;
        }
    }

    public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
        lastErrorMessage = null;
        try {
            if (!evolutionEnabled) {
                lastErrorMessage = "Evolution API não habilitada";
                logger.error("Evolution desabilitado - envio cancelado");
                return false;
            }

            if (!checkConnection()) {
                lastErrorMessage = "WhatsApp Evolution não está conectado.";
                logger.error("Tentativa de envio com Evolution desconectado");
                return false;
            }

            File file = new File(filePath);
            if (!file.exists()) {
                lastErrorMessage = "Arquivo não encontrado: " + filePath;
                logger.error("Arquivo não existe: {}", filePath);
                return false;
            }

            long maxFileSizeBytes = 10L * 1024L * 1024L;
            if (file.length() > maxFileSizeBytes) {
                lastErrorMessage = "Arquivo muito grande (máximo 10MB)";
                logger.error("Arquivo excede limite: {} bytes", file.length());
                return false;
            }

            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            String url = evolutionApiUrl + "/message/sendMedia/" + instanceName;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            if (apiKey != null && !apiKey.isEmpty()) {
                headers.set("apikey", apiKey);
            }

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("number", normalizedNumber);
            if (message != null && !message.isEmpty()) {
                body.add("caption", message);
            }
            body.add("mediatype", "document");

            byte[] fileBytes = Files.readAllBytes(file.toPath());
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return file.getName();
                }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            logger.info("Enviando arquivo via Evolution para: {} - {}", normalizedNumber, file.getName());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                logger.info("Arquivo enviado com sucesso via Evolution");
                return true;
            }
            lastErrorMessage = "Erro HTTP " + response.getStatusCode();
            logger.error("Erro ao enviar arquivo Evolution: {}", response.getStatusCode());
            return false;
        } catch (ResourceAccessException e) {
            lastErrorMessage = "Evolution API não acessível: " + e.getMessage();
            logger.error("Erro de conexão Evolution: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            lastErrorMessage = "Erro ao enviar arquivo Evolution: " + e.getMessage();
            logger.error("Erro ao enviar arquivo Evolution", e);
            return false;
        }
    }

    public String checkWhatsAppNumber(String phoneNumber) {
        try {
            String normalized = normalizePhoneNumber(phoneNumber);
            String url = evolutionApiUrl + "/chat/whatsappNumbers/" + instanceName;
            HttpHeaders headers = createHeaders();
            ObjectNode body = objectMapper.createObjectNode();
            body.putArray("numbers").add(normalized);
            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            if (response.getBody() != null) {
                return response.getBody();
            }
            return null;
        } catch (Exception e) {
            logger.warn("Erro ao verificar número WhatsApp: {}", e.getMessage());
            return null;
        }
    }

    public String getInstanceInfo() {
        try {
            String url = evolutionApiUrl + "/instance/fetchInstances";
            HttpEntity<String> request = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (Exception e) {
            logger.warn("Erro ao buscar instâncias: {}", e.getMessage());
            return null;
        }
    }

    private String sendViaBaileysFallback(String phoneNumber, String message, String filePath) {
        try {
            boolean ok;
            if (filePath != null && !filePath.isEmpty()) {
                ok = baileysRestService.sendFileMessage(phoneNumber, message, filePath);
            } else {
                ok = baileysRestService.sendTextMessage(phoneNumber, message);
            }
            if (ok) {
                return "sent_via_baileys";
            }
            return "fallback_failed";
        } catch (Exception e) {
            logger.error("Fallback Baileys também falhou: {}", e.getMessage());
            return "fallback_failed";
        }
    }

    public Map<String, Object> getServiceStatus() {
        try {
            boolean available = isServiceAvailable();
            String state = available ? getConnectionState() : "closed";
            return Map.of(
                "enabled", evolutionEnabled,
                "available", available,
                "connected", "open".equals(state),
                "state", state != null ? state : "unknown",
                "serviceUrl", evolutionApiUrl,
                "instance", instanceName
            );
        } catch (Exception e) {
            return Map.of(
                "enabled", evolutionEnabled,
                "available", false,
                "connected", false,
                "state", "error",
                "error", e.getMessage()
            );
        }
    }
}
