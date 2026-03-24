package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.nio.file.Files;
import java.util.Objects;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
public class BaileysRestService {
    
    private static final Logger logger = LoggerFactory.getLogger(BaileysRestService.class);
    
    @Value("${baileys.rest.url:http://localhost:3333}")
    private String baileysRestUrl;
    
    @Value("${baileys.rest.token:}")
    private String baileysToken;
    
    @Value("${baileys.rest.instance.key:securedguard}")
    private String instanceKey;
    
    @Value("${baileys.enabled:false}")
    private boolean baileysEnabled;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final com.z7design.fleet_manager.config.WhatsAppTestConfig testConfig;
    private String lastErrorMessage;
    
    public BaileysRestService(RestTemplate restTemplate, ObjectMapper objectMapper,
                             com.z7design.fleet_manager.config.WhatsAppTestConfig testConfig) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.testConfig = testConfig;
        this.lastErrorMessage = null;
    }
    
    /**
     * Retorna a Ãºltima mensagem de erro registrada
     */
    public String getLastErrorMessage() {
        return lastErrorMessage;
    }
    
    /**
     * Retorna a URL configurada do serviÃ§o Baileys REST
     */
    public String getServiceUrl() {
        return baileysRestUrl;
    }
    
    /**
     * Retorna se o Baileys estÃ¡ habilitado
     */
    public boolean isEnabled() {
        return baileysEnabled;
    }
    
    /**
     * Faz logout e limpa a sessÃ£o do Baileys REST API
     * Isso forÃ§a uma nova conexÃ£o que gerarÃ¡ um novo QR Code
     */
    public boolean resetInstance() {
        try {
            String url = baileysRestUrl + "/instance/logout?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            logger.info("ðŸ”„ Fazendo logout e resetando instÃ¢ncia Baileys REST: {}", instanceKey);
            restTemplate.postForEntity(url, request, String.class);
            
            // Aguardar um pouco para garantir que a sessÃ£o foi limpa
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            logger.info("âœ… InstÃ¢ncia Baileys REST resetada com sucesso");
            return true;
            
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            // Se a conexÃ£o jÃ¡ estÃ¡ fechada, isso Ã© esperado e nÃ£o Ã© um erro
            if (e.getStatusCode().value() == 500 && e.getResponseBodyAsString() != null 
                && e.getResponseBodyAsString().contains("Connection Closed")) {
                logger.info("â„¹ï¸ ConexÃ£o jÃ¡ estava fechada, continuando com reset");
                return true;
            }
            logger.warn("âš ï¸ Erro ao resetar instÃ¢ncia: {}", e.getMessage());
            return true; // Continuar mesmo com erro, pois a instÃ¢ncia pode nÃ£o existir
        } catch (Exception e) {
            logger.warn("âš ï¸ Erro ao resetar instÃ¢ncia (pode nÃ£o existir): {}", e.getMessage());
            // NÃ£o retornar false, pois a instÃ¢ncia pode nÃ£o existir
            return true;
        }
    }
    
    /**
     * Inicializa uma nova instÃ¢ncia do Baileys REST API
     * Apenas faz logout se a conexÃ£o estiver fechada para otimizar performance
     */
    public boolean initializeInstance() {
        try {
            // Se Baileys nÃ£o estiver habilitado, retornar false sem tentar inicializar
            if (!baileysEnabled) {
                logger.debug("Baileys nÃ£o estÃ¡ habilitado. NÃ£o Ã© possÃ­vel inicializar instÃ¢ncia.");
                return false;
            }
            
            // Verificar estado da conexÃ£o - sÃ³ fazer logout se necessÃ¡rio (conexÃ£o fechada)
            String connectionState = checkConnectionState();
            if ("closed".equals(connectionState) || "close".equals(connectionState)) {
                logger.info("ðŸ”„ ConexÃ£o estÃ¡ fechada. Resetando instÃ¢ncia...");
                resetInstance();
                // Aguardar apenas o tempo mÃ­nimo necessÃ¡rio
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            
            String url = baileysRestUrl + "/instance/init";
            if (!baileysToken.isEmpty()) {
                url += "?key=" + instanceKey + "&token=" + baileysToken;
            } else {
                url += "?key=" + instanceKey;
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            logger.info("ðŸ”„ Inicializando instÃ¢ncia Baileys REST: {}", instanceKey);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("âœ… InstÃ¢ncia Baileys REST inicializada com sucesso");
                return true;
            } else {
                logger.error("âŒ Erro ao inicializar instÃ¢ncia. Status: {}", response.getStatusCode());
                lastErrorMessage = "Erro ao inicializar instÃ¢ncia. Status: " + response.getStatusCode();
                return false;
            }
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // ServiÃ§o nÃ£o disponÃ­vel - nÃ£o Ã© um erro crÃ­tico
            logger.warn("âš ï¸ ServiÃ§o Baileys REST nÃ£o disponÃ­vel: {}", e.getMessage());
            lastErrorMessage = "ServiÃ§o WhatsApp nÃ£o disponÃ­vel: " + e.getMessage();
            return false;
        } catch (Exception e) {
            logger.error("âŒ Erro ao inicializar instÃ¢ncia Baileys REST: {}", e.getMessage());
            lastErrorMessage = "Erro ao inicializar instÃ¢ncia: " + e.getMessage();
            return false;
        }
    }
    
    /**
     * Verifica o estado da conexÃ£o (open, close, connecting)
     */
    private String checkConnectionState() {
        try {
            // Se Baileys nÃ£o estiver habilitado, retornar "closed"
            if (!baileysEnabled) {
                return "closed";
            }
            
            String url = baileysRestUrl + "/instance/connectionState?key=" + instanceKey;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode jsonNode = mapper.readTree(response.getBody());
                    String state = jsonNode.get("state").asText();
                    logger.info("ðŸ“Š Estado da conexÃ£o: {}", state);
                    return state;
                } catch (Exception e) {
                    logger.warn("âš ï¸ NÃ£o foi possÃ­vel fazer parse do estado da conexÃ£o");
                    return "unknown";
                }
            }
            
            return "unknown";
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // ServiÃ§o nÃ£o disponÃ­vel - nÃ£o Ã© um erro crÃ­tico
            logger.debug("ServiÃ§o Baileys REST nÃ£o disponÃ­vel ao verificar estado: {}", e.getMessage());
            return "closed";
        } catch (Exception e) {
            logger.warn("âš ï¸ Erro ao verificar estado da conexÃ£o: {}", e.getMessage());
            return "unknown";
        }
    }
    
    /**
     * Verifica se o serviÃ§o Baileys REST estÃ¡ disponÃ­vel (health check)
     * Retorna true se o serviÃ§o estÃ¡ rodando, independente do estado da conexÃ£o WhatsApp
     */
    public boolean isServiceAvailable() {
        try {
            // Se Baileys nÃ£o estiver habilitado, retornar false
            if (!baileysEnabled) {
                logger.warn("âš ï¸ Baileys nÃ£o estÃ¡ habilitado. Verifique a configuraÃ§Ã£o baileys.enabled. URL configurada: {}", baileysRestUrl);
                lastErrorMessage = "Baileys nÃ£o estÃ¡ habilitado. Verifique a configuraÃ§Ã£o.";
                return false;
            }
            
            logger.info("ðŸ” Verificando disponibilidade do Baileys REST em: {}", baileysRestUrl);
            logger.info("ðŸ” ConfiguraÃ§Ã£o: enabled={}, instanceKey={}", baileysEnabled, instanceKey);
            
            // Tentar primeiro o endpoint /health
            try {
                String healthUrl = baileysRestUrl + "/health";
                logger.info("ðŸ” Tentando health check em: {}", healthUrl);
                ResponseEntity<String> healthResponse = restTemplate.getForEntity(healthUrl, String.class);
                if (healthResponse.getStatusCode() == HttpStatus.OK) {
                    logger.info("âœ… ServiÃ§o Baileys REST estÃ¡ disponÃ­vel (health check OK) - URL: {}", baileysRestUrl);
                    lastErrorMessage = null;
                    return true;
                }
            } catch (org.springframework.web.client.ResourceAccessException e) {
                logger.error("âŒ Endpoint /health nÃ£o acessÃ­vel - Erro de conexÃ£o: {}", e.getMessage());
                logger.error("   Verifique se o container 'whatsapp-service-ci' estÃ¡ rodando e acessÃ­vel em: {}", baileysRestUrl);
                logger.error("   No ambiente CI, o serviÃ§o deve estar na rede Docker 'secured-guard-ci-network' ou 'z7network'");
            } catch (Exception e) {
                logger.warn("âš ï¸ Endpoint /health nÃ£o disponÃ­vel, tentando endpoint alternativo: {}", e.getMessage());
            }
            
            // Se /health falhar, tentar um endpoint bÃ¡sico que sempre existe
            try {
                String url = baileysRestUrl + "/instance/connectionState?key=" + instanceKey;
                logger.debug("ðŸ” Tentando connectionState em: {}", url);
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    logger.info("âœ… ServiÃ§o Baileys REST estÃ¡ disponÃ­vel (connectionState OK)");
                    lastErrorMessage = null;
                    return true;
                }
            } catch (org.springframework.web.client.ResourceAccessException e) {
                logger.warn("âš ï¸ Endpoint connectionState nÃ£o acessÃ­vel: {}", e.getMessage());
                lastErrorMessage = "ServiÃ§o WhatsApp nÃ£o disponÃ­vel. Verifique se o container Docker do Baileys REST estÃ¡ rodando em: " + baileysRestUrl;
            } catch (Exception e) {
                logger.warn("âš ï¸ Erro ao verificar connectionState: {}", e.getMessage());
            }
            
            logger.warn("âŒ ServiÃ§o Baileys REST nÃ£o estÃ¡ disponÃ­vel em: {}", baileysRestUrl);
            lastErrorMessage = "ServiÃ§o WhatsApp nÃ£o disponÃ­vel. Verifique se o container Docker do Baileys REST estÃ¡ rodando.";
            return false;
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // ServiÃ§o nÃ£o disponÃ­vel - nÃ£o estÃ¡ rodando ou nÃ£o Ã© acessÃ­vel
            logger.error("âŒ Erro de conexÃ£o com Baileys REST em {}: {}", baileysRestUrl, e.getMessage());
            lastErrorMessage = "ServiÃ§o WhatsApp nÃ£o disponÃ­vel. Erro de conexÃ£o: " + e.getMessage();
            return false;
        } catch (Exception e) {
            // Outros erros - logar mas nÃ£o crashar
            logger.error("âŒ Erro ao verificar disponibilidade do serviÃ§o Baileys REST: {}", e.getMessage(), e);
            lastErrorMessage = "Erro ao verificar disponibilidade: " + e.getMessage();
            return false;
        }
    }
    
    /**
     * Verifica o estado da conexÃ£o e retorna o estado como string
     * Retorna: "open", "close", "connecting", "closed", ou null se nÃ£o disponÃ­vel
     */
    public String getConnectionState() {
        try {
            // Se Baileys nÃ£o estiver habilitado, retornar "closed"
            if (!baileysEnabled) {
                logger.debug("Baileys nÃ£o estÃ¡ habilitado. Retornando closed.");
                return "closed";
            }
            
            String url = baileysRestUrl + "/instance/connectionState?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                if (responseBody != null) {
                    // Extrair o estado da conexÃ£o do JSON
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode jsonNode = mapper.readTree(responseBody);
                        String state = jsonNode.get("state").asText();
                        logger.debug("ðŸ“± Estado da conexÃ£o WhatsApp: {}", state);
                        return state;
                    } catch (Exception e) {
                        // Se nÃ£o conseguir fazer parse, verificar se contÃ©m "open"
                        if (responseBody.contains("\"open\"") || responseBody.contains("open")) {
                            return "open";
                        } else if (responseBody.contains("\"close\"") || responseBody.contains("close")) {
                            return "close";
                        } else if (responseBody.contains("\"connecting\"") || responseBody.contains("connecting")) {
                            return "connecting";
                        }
                    }
                }
            }
            
            return "closed";
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.debug("ServiÃ§o Baileys REST nÃ£o disponÃ­vel: {}", e.getMessage());
            lastErrorMessage = "ServiÃ§o WhatsApp nÃ£o disponÃ­vel: " + e.getMessage();
            return null;
        } catch (Exception e) {
            logger.warn("âš ï¸ Erro ao verificar conexÃ£o Baileys REST: {}", e.getMessage());
            lastErrorMessage = "Erro ao verificar conexÃ£o: " + e.getMessage();
            return null;
        }
    }
    
    /**
     * Verifica se a instÃ¢ncia estÃ¡ conectada (mÃ©todo legado para compatibilidade)
     */
    public boolean checkConnection() {
        String state = getConnectionState();
        return "open".equals(state);
    }
    
    /**
     * Normaliza nÃºmero de telefone para formato WhatsApp com DDI
     * Exemplo: 31971731747 -> 5531971731747
     */
    private String normalizePhoneNumber(String phoneNumber) {
        // Remover caracteres especiais
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");
        
        // Se jÃ¡ comeÃ§ar com 55 (DDI Brasil), tratar e retornar
        if (cleanNumber.startsWith("55")) {
            // Regra BR: se for 55 + DDD + 9 + 8 dÃ­gitos (13 no total), remover o 9 extra
            if (cleanNumber.length() == 13 && cleanNumber.charAt(4) == '9') {
                String adjusted = cleanNumber.substring(0, 4) + cleanNumber.substring(5);
                logger.info("ðŸ“ž BR ajuste (removendo 9 extra): {} -> {}", cleanNumber, adjusted);
                return adjusted;
            }
            logger.info("ðŸ“ž NÃºmero jÃ¡ tem DDI: {}", cleanNumber);
            return cleanNumber;
        }
        
        // Se tiver 10/11/12 dÃ­gitos (formatos nacionais), adicionar DDI 55
        if (cleanNumber.length() == 10 || cleanNumber.length() == 11 || cleanNumber.length() == 12) {
            String normalized = "55" + cleanNumber;
            // ApÃ³s adicionar 55, aplicar regra do 9 extra se aplicÃ¡vel
            if (normalized.length() == 13 && normalized.charAt(4) == '9') {
                String adjusted = normalized.substring(0, 4) + normalized.substring(5);
                logger.info("ðŸ“ž BR ajuste (removendo 9 extra): {} -> {}", normalized, adjusted);
                return adjusted;
            }
            logger.info("ðŸ“ž NÃºmero normalizado: {} -> {}", cleanNumber, normalized);
            return normalized;
        }
        
        // Se tiver outro tamanho, assumir que jÃ¡ Ã© internacional
        logger.warn("âš ï¸ NÃºmero com formato nÃ£o padrÃ£o: {} (tamanho: {})", cleanNumber, cleanNumber.length());
        return cleanNumber;
    }
    
    /**
     * Envia mensagem de texto via Baileys REST API
     */
    public boolean sendTextMessage(String phoneNumber, String message) {
        lastErrorMessage = null; // Limpar erro anterior
        
        try {
            // Verificar se estÃ¡ conectado
            if (!checkConnection()) {
                lastErrorMessage = "WhatsApp nÃ£o estÃ¡ conectado. Verifique a conexÃ£o e tente novamente.";
                logger.error("âŒ Tentativa de envio com WhatsApp desconectado");
                return false;
            }
            
            // Normalizar nÃºmero com DDI
            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            
            String url = baileysRestUrl + "/message/text?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Criar body JSON
            ObjectNode body = objectMapper.createObjectNode();
            body.put("id", normalizedNumber);
            body.put("message", message);
            
            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            
            logger.info("ðŸ“¤ Enviando mensagem via Baileys REST para: {} (normalizado: {})", phoneNumber, normalizedNumber);
            logger.info("ðŸ“ Mensagem: {}", message);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("âœ… Mensagem enviada com sucesso via Baileys REST para: {}", normalizedNumber);
                lastErrorMessage = null; // Limpar erro em caso de sucesso
                return true;
            } else {
                String errorMsg = String.format("Erro HTTP %s: %s", response.getStatusCode(), response.getBody());
                lastErrorMessage = errorMsg;
                logger.error("âŒ Erro ao enviar mensagem. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                return false;
            }
            
        } catch (org.springframework.web.client.RestClientException e) {
            lastErrorMessage = "Erro ao comunicar com serviÃ§o Baileys: " + e.getMessage() + ". Verifique se o serviÃ§o estÃ¡ rodando na porta 3333.";
            logger.error("âŒ Erro ao enviar mensagem via Baileys REST", e);
            logger.error("ðŸ’¥ Erro detalhe: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            lastErrorMessage = "Erro inesperado: " + e.getMessage();
            logger.error("âŒ Erro ao enviar mensagem via Baileys REST", e);
            logger.error("ðŸ’¥ Erro detalhe: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Converte caminho do sistema de arquivos local para caminho do Docker
     * Exemplo: C:\dev\secured-guard\backend\holerites\9-2025\arquivo.pdf -> /app/holerites/9-2025/arquivo.pdf
     * Exemplo: /app/backend/holerites/... -> /app/holerites/...
     */
    private String convertToDockerPath(String localPath) {
        // Substituir backslashes por forward slashes
        String normalizedPath = localPath.replace("\\", "/");
        
        // Se jÃ¡ estiver no formato Docker com /app/backend/holerites, remover /backend
        if (normalizedPath.startsWith("/app/backend/holerites")) {
            String dockerPath = normalizedPath.replace("/app/backend/holerites", "/app/holerites");
            logger.info("ðŸ”„ Convertendo caminho Docker: {} -> {}", localPath, dockerPath);
            return dockerPath;
        }
        
        // Encontrar "backend/holerites" e substituir pelo caminho do Docker
        int index = normalizedPath.indexOf("backend/holerites");
        if (index != -1) {
            // Pegar a parte apÃ³s "backend/"
            String relativePath = normalizedPath.substring(index + "backend/".length());
            String dockerPath = "/app/" + relativePath;
            logger.info("ðŸ”„ Convertendo caminho: {} -> {}", localPath, dockerPath);
            return dockerPath;
        }
        
        // Se jÃ¡ comeÃ§ar com /app/holerites, retornar como estÃ¡
        if (normalizedPath.startsWith("/app/holerites")) {
            logger.info("âœ… Caminho jÃ¡ estÃ¡ no formato Docker: {}", normalizedPath);
            return normalizedPath;
        }
        
        // Se nÃ£o encontrar, retornar o caminho original
        logger.warn("âš ï¸ NÃ£o foi possÃ­vel converter o caminho para Docker: {}", localPath);
        return normalizedPath;
    }
    
    /**
     * Envia arquivo via Baileys REST API
     * MODIFICADO: Converte caminho local para caminho Docker antes de enviar
     * CORRIGIDO: Adiciona DDI 55 para evitar redirecionamento
     */
    public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
        lastErrorMessage = null; // Limpar erro anterior
        
        if (!baileysEnabled) {
            lastErrorMessage = "WhatsApp nÃ£o estÃ¡ habilitado. Verifique a configuraÃ§Ã£o baileys.enabled.";
            logger.error("âŒ Baileys desabilitado - envio cancelado");
            return false;
        }

        if (!checkConnection()) {
            lastErrorMessage = "WhatsApp nÃ£o estÃ¡ conectado. Verifique a conexÃ£o e tente novamente.";
            logger.error("âŒ Tentativa de envio com WhatsApp desconectado");
            return false;
        }

        // âš ï¸ PROTEÃ‡ÃƒO: Verificar limite de envios (modo teste Baileys)
        if (!testConfig.canSendMessage(phoneNumber)) {
            lastErrorMessage = "Limite de testes atingido. Migre para WhatsApp Cloud API oficial.";
            logger.error("ðŸš« Envio bloqueado - Limite de testes atingido");
            logger.warn("ðŸ’¡ SOLUÃ‡ÃƒO: Migre para WhatsApp Cloud API (oficial)");
            logger.warn("ðŸ“„ Guia: MIGRACAO_WHATSAPP_BUSINESS_API_OFICIAL.md");
            return false;
        }
        
        try {
            // Verificar se arquivo existe no caminho original
            File file = new File(filePath);
            if (!file.exists()) {
                lastErrorMessage = "Arquivo nÃ£o encontrado no backend: " + filePath;
                logger.error("âŒ Arquivo nÃ£o existe no backend: {}", filePath);
                logger.info("ðŸ’¡ O arquivo precisa existir no backend antes de ser enviado ao WhatsApp");
                return false;
            }

            long maxFileSizeBytes = 10L * 1024L * 1024L;
            if (file.length() > maxFileSizeBytes) {
                lastErrorMessage = "Arquivo muito grande para envio (mÃ¡ximo 10MB).";
                logger.error("âŒ Arquivo excede o limite: {} bytes", file.length());
                return false;
            }
            
            logger.info("ðŸ“¤ Preparando envio do arquivo: {}", file.getName());
            logger.info("ðŸ“Š Tamanho: {} bytes", file.length());
            logger.info("ðŸ“‚ Caminho original (backend): {}", filePath);
            
            // CORREÃ‡ÃƒO: Normalizar nÃºmero com DDI 55
            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            
            String url = baileysRestUrl + "/message/document?key=" + instanceKey;
            
            // Enviar arquivo via multipart para evitar dependÃªncia de volume compartilhado
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("id", normalizedNumber);  // â† NÃšMERO NORMALIZADO COM DDI
            if (message != null && !message.isEmpty()) {
                body.add("message", message);
            }

            byte[] fileBytes = Files.readAllBytes(file.toPath());
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return file.getName();
                }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            logger.info("ðŸ“¤ Enviando arquivo via Baileys REST para: {}", normalizedNumber);
            logger.info("ðŸ”— URL: {}", url);
            logger.info("ðŸ“„ Envio via multipart: {}", file.getName());
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("âœ… Arquivo enviado com sucesso via Baileys REST");
                logger.info("ðŸ“‹ Response: {}", response.getBody());
                
                // Incrementar contador (proteÃ§Ã£o)
                testConfig.incrementMessageCount();
                
                // Avisar sobre migraÃ§Ã£o se prÃ³ximo do limite
                if (testConfig.getRemainingMessages() <= 5) {
                    testConfig.showMigrationWarning();
                }
                
                lastErrorMessage = null; // Limpar erro em caso de sucesso
                return true;
            } else {
                String errorMsg = String.format("Erro HTTP %s: %s", response.getStatusCode(), response.getBody());
                lastErrorMessage = errorMsg;
                logger.error("âŒ Erro ao enviar arquivo. Status: {}", response.getStatusCode());
                logger.error("ðŸ“‹ Response body: {}", response.getBody());
                return false;
            }
            
        } catch (org.springframework.web.client.RestClientException e) {
            lastErrorMessage = "Erro ao comunicar com serviÃ§o Baileys: " + e.getMessage() + ". Verifique se o serviÃ§o estÃ¡ rodando na porta 3333.";
            logger.error("âŒ Erro ao enviar arquivo via Baileys REST", e);
            logger.error("ðŸ’¥ Erro detalhe: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            lastErrorMessage = "Erro inesperado: " + e.getMessage();
            logger.error("âŒ Erro ao enviar arquivo via Baileys REST", e);
            logger.error("ðŸ’¥ Erro detalhe: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * ObtÃ©m QR Code para conexÃ£o
     */
    public String getQRCode() {
        try {
            // Solicita QR Code em formato base64
            String url = baileysRestUrl + "/instance/qr?key=" + instanceKey + "&format=base64";
            
            logger.info("ðŸ“¸ Solicitando QR Code de: {}", url);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            logger.info("ðŸ“Š Status da resposta QR Code: {}", response.getStatusCode());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String body = response.getBody();
                logger.info("âœ… QR Code recebido. Tamanho: {} caracteres", body != null ? body.length() : 0);
                
                if (body != null) {
                    try {
                        // Parse do JSON para extrair o campo base64
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode jsonNode = mapper.readTree(body);
                        String base64 = jsonNode.get("base64").asText();
                        
                        logger.info("ðŸ“¸ QR Code base64 extraÃ­do. Tamanho: {} caracteres", base64.length());
                        return base64;
                    } catch (Exception parseEx) {
                        logger.warn("âš ï¸ NÃ£o foi possÃ­vel fazer parse do JSON, retornando corpo direto", parseEx);
                        return body;
                    }
                }
            } else {
                logger.warn("âš ï¸ Status inesperado ao obter QR Code: {}", response.getStatusCode());
            }
            
            return null;
            
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            // QR Code ainda nÃ£o estÃ¡ disponÃ­vel - isso Ã© esperado apÃ³s inicializaÃ§Ã£o
            // NÃ£o logar como ERROR, apenas como DEBUG/WARNING
            String errorBody = e.getResponseBodyAsString();
            if (errorBody != null && errorBody.contains("QR not available")) {
                logger.debug("â³ QR Code ainda nÃ£o disponÃ­vel (esperado apÃ³s inicializaÃ§Ã£o) - URL: {}", baileysRestUrl);
            } else {
                logger.warn("âš ï¸ QR Code nÃ£o encontrado: {} - URL: {}", e.getMessage(), baileysRestUrl);
            }
            // Re-lanÃ§ar a exceÃ§Ã£o para que o controller possa tratar adequadamente
            throw e;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Outros erros HTTP 4xx
            String errorBody = e.getResponseBodyAsString();
            if (errorBody != null && errorBody.contains("QR not available")) {
                logger.debug("â³ QR Code ainda nÃ£o disponÃ­vel (esperado apÃ³s inicializaÃ§Ã£o) - URL: {}", baileysRestUrl);
            } else {
                logger.warn("âš ï¸ Erro HTTP ao obter QR Code: {} - URL: {}", e.getMessage(), baileysRestUrl);
            }
            throw e;
        } catch (Exception e) {
            // Apenas logar como ERROR se nÃ£o for um erro esperado de QR nÃ£o disponÃ­vel
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("QR not available")) {
                logger.debug("â³ QR Code ainda nÃ£o disponÃ­vel (esperado apÃ³s inicializaÃ§Ã£o) - URL: {}", baileysRestUrl);
            } else {
                logger.error("âŒ Erro ao obter QR Code de {}", baileysRestUrl, e);
                logger.error("ðŸ’¥ Detalhes do erro: {}", e.getMessage());
            }
            return null;
        }
    }
    
    /**
     * Desconecta a instÃ¢ncia
     */
    public boolean disconnectInstance() {
        try {
            String url = baileysRestUrl + "/instance/logout?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            return response.getStatusCode() == HttpStatus.OK;
            
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            // Se a conexÃ£o jÃ¡ estÃ¡ fechada, isso Ã© esperado e nÃ£o Ã© um erro
            if (e.getStatusCode().value() == 500 && e.getResponseBodyAsString() != null 
                && e.getResponseBodyAsString().contains("Connection Closed")) {
                logger.info("â„¹ï¸ ConexÃ£o jÃ¡ estava fechada, logout concluÃ­do");
                return true;
            }
            logger.error("Erro ao desconectar instÃ¢ncia", e);
            return false;
        } catch (Exception e) {
            logger.error("Erro ao desconectar instÃ¢ncia", e);
            return false;
        }
    }
} 
