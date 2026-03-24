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
public class N8nWebhookService {
    
    private static final Logger logger = LoggerFactory.getLogger(N8nWebhookService.class);
    
    @Value("${n8n.webhook.url:}")
    private String n8nWebhookUrl;
    
    @Value("${n8n.whatsapp.provider:wppconnect}")
    private String whatsappProvider;
    
    @Value("${n8n.wppconnect.url:}")
    private String wppconnectUrl;
    
    @Value("${n8n.baileys.url:}")
    private String baileysUrl;
    
    @Value("${n8n.twilio.url:}")
    private String twilioUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public N8nWebhookService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Envia mensagem WhatsApp via n8n com provedor configurÃ¡vel
     */
    public boolean sendWhatsAppMessage(String phoneNumber, String message, String pdfPath) {
        try {
            String webhookUrl = getWebhookUrl();
            if (webhookUrl == null || webhookUrl.isEmpty()) {
                logger.error("URL do webhook n8n nÃ£o configurada");
                return false;
            }
            
            ObjectNode payload = createWhatsAppPayload(phoneNumber, message, pdfPath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);
            
            logger.info("Enviando mensagem WhatsApp via {} para {}", whatsappProvider, phoneNumber);
            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                logger.info("Mensagem WhatsApp enviada com sucesso via {}", whatsappProvider);
                return true;
            } else {
                logger.error("Erro ao enviar mensagem WhatsApp. Status: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("Erro ao enviar mensagem WhatsApp via n8n", e);
            return false;
        }
    }
    
    /**
     * ObtÃ©m a URL do webhook baseada no provedor configurado
     */
    private String getWebhookUrl() {
        switch (whatsappProvider.toLowerCase()) {
            case "wppconnect":
                return wppconnectUrl.isEmpty() ? n8nWebhookUrl : wppconnectUrl;
            case "baileys":
                return baileysUrl.isEmpty() ? n8nWebhookUrl : baileysUrl;
            case "twilio":
                return twilioUrl.isEmpty() ? n8nWebhookUrl : twilioUrl;
            default:
                return n8nWebhookUrl;
        }
    }
    
    /**
     * Cria payload especÃ­fico para cada provedor
     */
    private ObjectNode createWhatsAppPayload(String phoneNumber, String message, String pdfPath) {
        ObjectNode payload = objectMapper.createObjectNode();
        
        // Dados comuns
        payload.put("phoneNumber", phoneNumber);
        payload.put("message", message);
        payload.put("provider", whatsappProvider);
        
        if (pdfPath != null && !pdfPath.isEmpty()) {
            payload.put("pdfPath", pdfPath);
        }
        
        // ConfiguraÃ§Ãµes especÃ­ficas por provedor
        switch (whatsappProvider.toLowerCase()) {
            case "wppconnect":
                payload.put("sessionName", "securedguard");
                payload.put("useGroup", false);
                break;
                
            case "baileys":
                payload.put("sessionId", "securedguard-session");
                payload.put("useGroup", false);
                break;
                
            case "twilio":
                payload.put("from", "whatsapp:+14155238886"); // NÃºmero do Twilio
                payload.put("to", "whatsapp:" + phoneNumber);
                break;
        }
        
        return payload;
    }
    
    /**
     * Verifica status da conexÃ£o WhatsApp
     */
    public boolean checkWhatsAppConnection() {
        try {
            String webhookUrl = getWebhookUrl();
            if (webhookUrl == null || webhookUrl.isEmpty()) {
                return false;
            }
            
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("action", "checkConnection");
            payload.put("provider", whatsappProvider);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);
            
            return response.getStatusCode() == HttpStatus.OK;
            
        } catch (Exception e) {
            logger.error("Erro ao verificar conexÃ£o WhatsApp", e);
            return false;
        }
    }
} 
