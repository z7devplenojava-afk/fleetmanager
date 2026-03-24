package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret.key:}")
    private String secretKey;

    @Value("${recaptcha.verify.url:https://www.google.com/recaptcha/api/siteverify}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean verifyToken(String token, String clientIp) {
        if (secretKey == null || secretKey.isEmpty()) {
            // Se nÃ£o configurado, aceita o token (para desenvolvimento)
            return true;
        }

        if (token == null || token.isEmpty()) {
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", token);
            if (clientIp != null && !clientIp.isEmpty()) {
                body.add("remoteip", clientIp);
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(verifyUrl, request, String.class);
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());

            boolean success = jsonResponse.get("success").asBoolean();
            double score = jsonResponse.has("score") ? jsonResponse.get("score").asDouble() : 0.0;

            // Para reCAPTCHA v3, verificamos o score (0.0 = bot, 1.0 = humano)
            // Aceitamos scores acima de 0.5 como vÃ¡lidos
            return success && score >= 0.5;

        } catch (Exception e) {
            // Em caso de erro na validaÃ§Ã£o, rejeitamos por seguranÃ§a
            return false;
        }
    }
} 
