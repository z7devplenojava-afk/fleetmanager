package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.CAEPIResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

/**
 * ServiÃ§o para consultar informaÃ§Ãµes de CA (Certificado de AprovaÃ§Ã£o) de EPIs
 * Utiliza a API pÃºblica do MinistÃ©rio do Trabalho ou API alternativa
 */
@Service
@Slf4j
public class CAEPIService {

    @Value("${app.caepi.api.url:https://api.caepi.mte.gov.br}")
    private String caepiApiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public CAEPIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Busca informaÃ§Ãµes do CA pelo nÃºmero
     * @param caNumber NÃºmero do CA (ex: "12345" ou "CA-12345")
     * @return DTO com informaÃ§Ãµes do CA ou null se nÃ£o encontrado
     */
    public CAEPIResponseDTO buscarCA(String caNumber) {
        if (caNumber == null || caNumber.trim().isEmpty()) {
            return null;
        }

        try {
            // Remove prefixos e formata o nÃºmero do CA
            String numeroLimpo = caNumber.replaceAll("[^0-9]", "");
            
            if (numeroLimpo.isEmpty()) {
                log.warn("NÃºmero de CA invÃ¡lido: {}", caNumber);
                return null;
            }

            log.info("ðŸ” Consultando CA: {}", numeroLimpo);

            // Tenta consultar na API do MTE (se disponÃ­vel)
            // Por enquanto, vamos usar uma abordagem que busca em mÃºltiplas fontes
            CAEPIResponseDTO resultado = consultarMTEAPI(numeroLimpo);
            
            if (resultado == null) {
                // Fallback: tenta API alternativa (API_BaseCAEPI se estiver disponÃ­vel)
                resultado = consultarAPIAlternativa(numeroLimpo);
            }

            if (resultado != null) {
                log.info("âœ… CA encontrado: {} - {}", resultado.getNumero(), resultado.getNome());
            } else {
                log.warn("âš ï¸ CA nÃ£o encontrado: {}", numeroLimpo);
            }

            return resultado;

        } catch (Exception e) {
            log.error("âŒ Erro ao consultar CA {}: {}", caNumber, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Busca mÃºltiplos CAs por termo de busca (nome ou nÃºmero)
     * @param searchTerm Termo de busca
     * @return Lista de CAs encontrados
     */
    public List<CAEPIResponseDTO> buscarCAs(String searchTerm) {
        List<CAEPIResponseDTO> resultados = new ArrayList<>();
        
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return resultados;
        }

        try {
            log.info("ðŸ” Buscando CAs com termo: {}", searchTerm);
            
            // Tenta buscar na API do MTE
            List<CAEPIResponseDTO> resultadosMTE = consultarMTEAPIBusca(searchTerm);
            if (resultadosMTE != null && !resultadosMTE.isEmpty()) {
                resultados.addAll(resultadosMTE);
            }

            // Se nÃ£o encontrou, tenta API alternativa
            if (resultados.isEmpty()) {
                List<CAEPIResponseDTO> resultadosAlt = consultarAPIAlternativaBusca(searchTerm);
                if (resultadosAlt != null && !resultadosAlt.isEmpty()) {
                    resultados.addAll(resultadosAlt);
                }
            }

            log.info("âœ… Encontrados {} CAs para o termo: {}", resultados.size(), searchTerm);
            return resultados;

        } catch (Exception e) {
            log.error("âŒ Erro ao buscar CAs com termo {}: {}", searchTerm, e.getMessage(), e);
            return resultados;
        }
    }

    /**
     * Consulta a API oficial do MTE
     */
    private CAEPIResponseDTO consultarMTEAPI(String numeroCA) {
        try {
            // URL da API do MTE (ajustar conforme documentaÃ§Ã£o oficial)
            String url = String.format("%s/api/ca/%s", caepiApiUrl, numeroCA);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                
                return CAEPIResponseDTO.builder()
                    .numero(jsonNode.path("numero").asText())
                    .nome(jsonNode.path("nome").asText())
                    .descricao(jsonNode.path("descricao").asText())
                    .situacao(jsonNode.path("situacao").asText())
                    .validade(jsonNode.path("validade").asText())
                    .fabricante(jsonNode.path("fabricante").asText())
                    .equipamento(jsonNode.path("equipamento").asText())
                    .build();
            }
        } catch (RestClientException e) {
            log.debug("API MTE nÃ£o disponÃ­vel ou CA nÃ£o encontrado: {}", e.getMessage());
        } catch (Exception e) {
            log.debug("Erro ao consultar API MTE: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Consulta API alternativa (API_BaseCAEPI)
     */
    private CAEPIResponseDTO consultarAPIAlternativa(String numeroCA) {
        try {
            // URL da API alternativa (ajustar conforme necessÃ¡rio)
            String url = String.format("https://api-caepi.example.com/api/ca/%s", numeroCA);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                
                return CAEPIResponseDTO.builder()
                    .numero(jsonNode.path("numero").asText())
                    .nome(jsonNode.path("nome").asText())
                    .descricao(jsonNode.path("descricao").asText())
                    .situacao(jsonNode.path("situacao").asText())
                    .validade(jsonNode.path("validade").asText())
                    .fabricante(jsonNode.path("fabricante").asText())
                    .equipamento(jsonNode.path("equipamento").asText())
                    .build();
            }
        } catch (RestClientException e) {
            log.debug("API alternativa nÃ£o disponÃ­vel: {}", e.getMessage());
        } catch (Exception e) {
            log.debug("Erro ao consultar API alternativa: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Busca mÃºltiplos CAs na API do MTE
     */
    private List<CAEPIResponseDTO> consultarMTEAPIBusca(String searchTerm) {
        List<CAEPIResponseDTO> resultados = new ArrayList<>();
        
        try {
            String url = String.format("%s/api/ca/search?q=%s", caepiApiUrl, searchTerm);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonArray = objectMapper.readTree(response.getBody());
                
                if (jsonArray.isArray()) {
                    for (JsonNode item : jsonArray) {
                        CAEPIResponseDTO dto = CAEPIResponseDTO.builder()
                            .numero(item.path("numero").asText())
                            .nome(item.path("nome").asText())
                            .descricao(item.path("descricao").asText())
                            .situacao(item.path("situacao").asText())
                            .validade(item.path("validade").asText())
                            .fabricante(item.path("fabricante").asText())
                            .equipamento(item.path("equipamento").asText())
                            .build();
                        resultados.add(dto);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Erro ao buscar CAs na API MTE: {}", e.getMessage());
        }
        
        return resultados;
    }

    /**
     * Busca mÃºltiplos CAs na API alternativa
     */
    private List<CAEPIResponseDTO> consultarAPIAlternativaBusca(String searchTerm) {
        List<CAEPIResponseDTO> resultados = new ArrayList<>();
        
        try {
            String url = String.format("https://api-caepi.example.com/api/ca/search?q=%s", searchTerm);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonArray = objectMapper.readTree(response.getBody());
                
                if (jsonArray.isArray()) {
                    for (JsonNode item : jsonArray) {
                        CAEPIResponseDTO dto = CAEPIResponseDTO.builder()
                            .numero(item.path("numero").asText())
                            .nome(item.path("nome").asText())
                            .descricao(item.path("descricao").asText())
                            .situacao(item.path("situacao").asText())
                            .validade(item.path("validade").asText())
                            .fabricante(item.path("fabricante").asText())
                            .equipamento(item.path("equipamento").asText())
                            .build();
                        resultados.add(dto);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Erro ao buscar CAs na API alternativa: {}", e.getMessage());
        }
        
        return resultados;
    }
}


