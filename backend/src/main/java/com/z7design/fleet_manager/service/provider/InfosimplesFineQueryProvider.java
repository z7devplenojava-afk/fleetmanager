package com.z7design.fleet_manager.service.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.VehicleFineQueryRequestDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO;
import com.z7design.fleet_manager.dto.VehicleFineQueryResponseDTO.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class InfosimplesFineQueryProvider implements VehicleFineQueryProvider {

    @Value("${infosimples.api.token:}")
    private String apiToken;

    @Value("${infosimples.api.url:https://api.infosimples.com/api/v2/consultas/detran}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public InfosimplesFineQueryProvider(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderName() {
        return "INFOSIMPLES";
    }

    @Override
    public boolean isAvailable() {
        return apiToken != null && !apiToken.trim().isEmpty() && !apiToken.equals("YOUR_TOKEN_HERE");
    }

    @Override
    public VehicleFineQueryResponseDTO queryVehicleData(VehicleFineQueryRequestDTO request) {
        String cleanPlate = request.getPlaca().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        log.info("[InfosimplesFineQueryProvider] Executando chamada para a placa: {}", cleanPlate);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiToken);

            String requestBody = objectMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl + (request.getUf() != null ? "/" + request.getUf().toLowerCase() : "/multas"),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseInfosimplesResponse(cleanPlate, response.getBody());
            }

            throw new RuntimeException("Resposta inesperada da API externa: HTTP " + response.getStatusCode());
        } catch (Exception e) {
            log.error("[InfosimplesFineQueryProvider] Falha ao consultar API externa: {}", e.getMessage(), e);
            throw new RuntimeException("Falha na comunicação com o provedor Infosimples: " + e.getMessage(), e);
        }
    }

    private VehicleFineQueryResponseDTO parseInfosimplesResponse(String plate, String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode dataNode = root.has("data") ? root.get("data") : root;

            DadosVeiculoDTO dadosVeiculo = DadosVeiculoDTO.builder()
                    .placa(plate)
                    .marcaModelo(dataNode.has("marca_modelo") ? dataNode.get("marca_modelo").asText() : "N/D")
                    .renavam(dataNode.has("renavam") ? dataNode.get("renavam").asText() : null)
                    .chassi(dataNode.has("chassi") ? dataNode.get("chassi").asText() : null)
                    .cor(dataNode.has("cor") ? dataNode.get("cor").asText() : null)
                    .anoFabricacao(dataNode.has("ano_fabricacao") ? dataNode.get("ano_fabricacao").asInt() : null)
                    .anoModelo(dataNode.has("ano_modelo") ? dataNode.get("ano_modelo").asInt() : null)
                    .municipio(dataNode.has("municipio") ? dataNode.get("municipio").asText() : null)
                    .uf(dataNode.has("uf") ? dataNode.get("uf").asText() : null)
                    .situacaoVeiculo("CIRCULAÇÃO REGULAR")
                    .build();

            List<InfracaoDetalhadaDTO> infracoes = new ArrayList<>();
            if (dataNode.has("multas") && dataNode.get("multas").isArray()) {
                for (JsonNode m : dataNode.get("multas")) {
                    infracoes.add(InfracaoDetalhadaDTO.builder()
                            .autoInfracao(m.has("auto_infracao") ? m.get("auto_infracao").asText() : "N/A")
                            .codigoInfracao(m.has("codigo_infracao") ? m.get("codigo_infracao").asText() : "")
                            .orgaoAutuador(m.has("orgao_autuador") ? m.get("orgao_autuador").asText() : "DETRAN")
                            .descricao(m.has("descricao") ? m.get("descricao").asText() : "Infração de trânsito")
                            .dataHora(m.has("data_hora") ? m.get("data_hora").asText() : "")
                            .local(m.has("local") ? m.get("local").asText() : "")
                            .valor(m.has("valor") ? new BigDecimal(m.get("valor").asText().replace(",", ".")) : BigDecimal.ZERO)
                            .dataVencimento(m.has("data_vencimento") ? m.get("data_vencimento").asText() : null)
                            .situacao(m.has("situacao") ? m.get("situacao").asText() : "AGUARDANDO PAGAMENTO")
                            .pontos(m.has("pontos") ? m.get("pontos").asInt() : 0)
                            .jaCadastradaNoSistema(false)
                            .build());
                }
            }

            BigDecimal total = infracoes.stream().map(InfracaoDetalhadaDTO::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

            return VehicleFineQueryResponseDTO.builder()
                    .status("success")
                    .message("Consulta externa realizada com sucesso.")
                    .dadosVeiculo(dadosVeiculo)
                    .resumoDebitos(ResumoDebitosDTO.builder()
                            .quantidadeMultas(infracoes.size())
                            .valorTotal(total)
                            .quantidadeAutuacoes(infracoes.size())
                            .temRestricoes(false)
                            .build())
                    .infracoes(infracoes)
                    .consultadoEm(LocalDateTime.now())
                    .origemDados("API_LIVE")
                    .build();
        } catch (Exception e) {
            log.error("Erro ao fazer parse da resposta Infosimples", e);
            throw new RuntimeException("Erro ao processar dados retornados pela API externa", e);
        }
    }
}
