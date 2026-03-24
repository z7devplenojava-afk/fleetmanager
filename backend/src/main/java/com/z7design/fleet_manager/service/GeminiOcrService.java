package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.GeminiOcrResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class GeminiOcrService {
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String apiKey;
    
    private static final String PROMPT = """
        VocÃª Ã© um parser especializado em holerites e comprovantes brasileiros.
        Analise este documento com atenÃ§Ã£o e extraia as seguintes informaÃ§Ãµes em JSON vÃ¡lido:
        
        INSTRUÃ‡Ã•ES IMPORTANTES:
        - Procure cuidadosamente pelo NOME COMPLETO do funcionÃ¡rio (geralmente aparece prÃ³ximo ao CPF ou no topo do documento)
        - O nome pode aparecer em diferentes formatos: "Nome: JoÃ£o Silva", "FuncionÃ¡rio: Maria Santos", ou simplesmente "JOSE DA SILVA"
        - Se encontrar mÃºltiplos nomes, use o que estiver mais prÃ³ximo do CPF ou no cabeÃ§alho principal
        - CPF: extraia apenas os 11 dÃ­gitos (sem pontos ou traÃ§os)
        - PerÃ­odo: formato MM/YYYY (ex: 10/2025)
        - Valor lÃ­quido: procure por "LÃ­quido a Receber", "Valor LÃ­quido", "Total LÃ­quido" ou similar
        - EMPRESA: Procure pelo nome da empresa/empregador no cabeÃ§alho do documento (geralmente no topo)
        - CNPJ: Procure pelo CNPJ da empresa (14 dÃ­gitos, pode estar formatado ou nÃ£o)
        - SETOR: Procure pelo setor/cargo/local de trabalho (pode aparecer como "Setor", "Cargo", "Local", "Posto de Trabalho" ou similar)
        - Se nÃ£o conseguir extrair algum campo, use null
        
        {
          "document_type": "holerite" | "comprovante",
          "cpf": "apenas dÃ­gitos ou null",
          "name": "NOME COMPLETO EM UPPERCASE SEM ACENTOS (ex: JOSE DA SILVA)",
          "period": "MM/YYYY",
          "value_liquid": "decimal com ponto (ex: 2539.50)",
          "company_name": "NOME DA EMPRESA EM UPPERCASE (ex: PROMOVER VIGILANCIA PATRIMONIAL LTDA)",
          "company_cnpj": "apenas 14 dÃ­gitos ou null",
          "sector": "NOME DO SETOR/CARGO (ex: VIGILANCIA, ADMINISTRACAO)",
          "items_earnings": [{"code": "001", "desc": "SalÃ¡rio Base", "value": "2395.54"}],
          "items_deductions": [{"code": "101", "desc": "INSS", "value": "200.00"}],
          "page_continues": true | false,
          "confidence": 0.0 a 1.0
        }
        
        Retorne APENAS o JSON vÃ¡lido, sem comentÃ¡rios ou texto adicional.
        """;
    
    public GeminiOcrService(
            @Value("${gemini.api.url}") String apiUrl,
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.api.enabled:false}") boolean enabled,
            @Value("${gemini.api.timeout:30000}") long timeout) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.objectMapper = new ObjectMapper();
        
        if (enabled && apiKey != null && !apiKey.isEmpty()) {
            this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
        } else {
            this.webClient = null;
            log.warn("Gemini API estÃ¡ desabilitada ou sem chave. Usando fallback Tesseract.");
        }
    }
    
    public Mono<GeminiOcrResponse> extractTextFromImage(byte[] imageBytes) {
        if (!enabled || webClient == null) {
            return Mono.empty();
        }
        
        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            
            part.put("text", PROMPT);
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", "image/png");
            inlineData.put("data", base64Image);
            part.put("inline_data", inlineData);
            
            contents.put("parts", java.util.List.of(part));
            requestBody.put("contents", java.util.List.of(contents));
            
            return webClient.post()
                .uri("/models/gemini-pro-vision:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(30))
                .retry(3)
                .map(this::parseResponse)
                .doOnError(error -> log.error("Erro ao chamar Gemini API", error))
                .onErrorReturn(createEmptyResponse());
                
        } catch (Exception e) {
            log.error("Erro ao processar imagem com Gemini", e);
            return Mono.just(createEmptyResponse());
        }
    }
    
    private GeminiOcrResponse parseResponse(JsonNode jsonNode) {
        try {
            JsonNode candidates = jsonNode.get("candidates");
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        String text = parts.get(0).get("text").asText();
                        // Extrair JSON do texto
                        String jsonText = extractJsonFromText(text);
                        return objectMapper.readValue(jsonText, GeminiOcrResponse.class);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao parsear resposta do Gemini", e);
        }
        return createEmptyResponse();
    }
    
    private String extractJsonFromText(String text) {
        // Tentar encontrar JSON no texto
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return "{}";
    }
    
    private GeminiOcrResponse createEmptyResponse() {
        GeminiOcrResponse response = new GeminiOcrResponse();
        response.setConfidence(0.0);
        return response;
    }
}


