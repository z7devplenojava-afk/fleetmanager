package br.com.fleetmanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BaileysRestService {
    
    private static final Logger logger = LoggerFactory.getLogger(BaileysRestService.class);
    
    @Value("${baileys.rest.url:http://localhost:3333}")
    private String baileysRestUrl;
    
    @Value("${baileys.rest.token:}")
    private String baileysToken;
    
    @Value("${baileys.rest.instance.key:securedguard}")
    private String instanceKey;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public BaileysRestService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Inicializa uma nova instância do Baileys REST API
     */
    public boolean initializeInstance() {
        try {
            String url = baileysRestUrl + "/instance/init";
            if (!baileysToken.isEmpty()) {
                url += "?key=" + instanceKey + "&token=" + baileysToken;
            } else {
                url += "?key=" + instanceKey;
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            logger.info("Inicializando instância Baileys REST: {}", instanceKey);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Instância Baileys REST inicializada com sucesso");
                return true;
            } else {
                logger.error("Erro ao inicializar instância. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao inicializar instância Baileys REST", e);
            return false;
        }
    }
    
    /**
     * Verifica se a instância está conectada
     */
    public boolean checkConnection() {
        try {
            String url = baileysRestUrl + "/instance/connectionState?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                // Verificar se está conectado
                String responseBody = response.getBody();
                return responseBody != null && responseBody.contains("open");
            }
            
            return false;
            
        } catch (Exception e) {
            logger.error("Erro ao verificar conexão Baileys REST", e);
            return false;
        }
    }
    
    /**
     * Envia mensagem de texto via Baileys REST API
     */
    public boolean sendTextMessage(String phoneNumber, String message) {
        try {
            String url = baileysRestUrl + "/message/text?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String body = "id=" + phoneNumber + "&message=" + message;
            
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            
            logger.info("Enviando mensagem via Baileys REST para: {}", phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Mensagem enviada com sucesso via Baileys REST");
                return true;
            } else {
                logger.error("Erro ao enviar mensagem. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao enviar mensagem via Baileys REST", e);
            return false;
        }
    }
    
    /**
     * Envia arquivo via Baileys REST API
     */
    public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
        try {
            String url = baileysRestUrl + "/message/document?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String body = "id=" + phoneNumber + 
                         "&message=" + message + 
                         "&filepath=" + filePath;
            
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            
            logger.info("Enviando arquivo via Baileys REST para: {}", phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Arquivo enviado com sucesso via Baileys REST");
                return true;
            } else {
                logger.error("Erro ao enviar arquivo. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao enviar arquivo via Baileys REST", e);
            return false;
        }
    }
    
    /**
     * Obtém QR Code para conexão
     */
    public String getQRCode() {
        try {
            String url = baileysRestUrl + "/instance/qr?key=" + instanceKey;
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
            
            return null;
            
        } catch (Exception e) {
            logger.error("Erro ao obter QR Code", e);
            return null;
        }
    }
    
    /**
     * Desconecta a instância
     */
    public boolean disconnectInstance() {
        try {
            String url = baileysRestUrl + "/instance/logout?key=" + instanceKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            return response.getStatusCode() == HttpStatus.OK;
            
        } catch (Exception e) {
            logger.error("Erro ao desconectar instância", e);
            return false;
        }
    }
} 