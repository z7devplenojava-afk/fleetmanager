package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class WPPConnectService {
    
    private static final Logger logger = LoggerFactory.getLogger(WPPConnectService.class);
    
    @Value("${wppconnect.enabled:false}")
    private boolean wppconnectEnabled;
    
    @Value("${wppconnect.url:http://localhost:8080}")
    private String wppconnectUrl;
    
    @Value("${wppconnect.session:securedguard}")
    private String session;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public WPPConnectService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Verifica se o WPPConnect estÃ¡ conectado
     */
    public boolean checkConnection() {
        try {
            String url = wppconnectUrl + "/api/status";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                return responseBody != null && responseBody.contains("\"connected\":true");
            }
            
            return false;
            
        } catch (Exception e) {
            logger.error("Erro ao verificar conexÃ£o WPPConnect", e);
            return false;
        }
    }
    
    /**
     * Envia mensagem de texto via WPPConnect
     */
    public boolean sendTextMessage(String phoneNumber, String message) {
        try {
            String url = wppconnectUrl + "/api/send-message";
            
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("number", phoneNumber);
            payload.put("text", message);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);
            
            logger.info("Enviando mensagem via WPPConnect para: {}", phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Mensagem enviada com sucesso via WPPConnect");
                return true;
            } else {
                logger.error("Erro ao enviar mensagem. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao enviar mensagem via WPPConnect", e);
            return false;
        }
    }
    
    /**
     * Envia arquivo via WPPConnect
     */
    public boolean sendFileMessage(String phoneNumber, String message, String filePath) {
        try {
            String url = wppconnectUrl + "/api/send-file";
            
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("number", phoneNumber);
            payload.put("path", filePath);
            payload.put("caption", message);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);
            
            logger.info("Enviando arquivo via WPPConnect para: {}", phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Arquivo enviado com sucesso via WPPConnect");
                return true;
            } else {
                logger.error("Erro ao enviar arquivo. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao enviar arquivo via WPPConnect", e);
            return false;
        }
    }
} 
