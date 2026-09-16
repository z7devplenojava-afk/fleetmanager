package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleFineQueryResponseDTO {

    private String status; // success, error
    private String message;

    @JsonProperty("dados_veiculo")
    private DadosVeiculoDTO dadosVeiculo;

    @JsonProperty("resumo_debitos")
    private ResumoDebitosDTO resumoDebitos;

    @Builder.Default
    @JsonProperty("restricoes")
    private List<RestricaoVeicularDTO> restricoes = new ArrayList<>();

    @Builder.Default
    @JsonProperty("infracoes")
    private List<InfracaoDetalhadaDTO> infracoes = new ArrayList<>();

    @JsonProperty("consultado_em")
    private LocalDateTime consultadoEm;

    @JsonProperty("origem_dados")
    private String origemDados; // CACHE, API_LIVE, SIMULADO

    @JsonProperty("total_importadas_sistema")
    private Integer totalImportadasSistema;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DadosVeiculoDTO {
        private UUID vehicleId; // ID interno no sistema caso o veículo já esteja cadastrado
        private String placa;
        private String renavam;
        private String chassi;
        @JsonProperty("marca_modelo")
        private String marcaModelo;
        @JsonProperty("ano_fabricacao")
        private Integer anoFabricacao;
        @JsonProperty("ano_modelo")
        private Integer anoModelo;
        private String cor;
        private String combustivel;
        private String uf;
        private String municipio;
        @JsonProperty("situacao_veiculo")
        private String situacaoVeiculo; // REGULAR, COM RESTRICAO, ETC
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumoDebitosDTO {
        @JsonProperty("quantidade_multas")
        private Integer quantidadeMultas;

        @JsonProperty("valor_total")
        private BigDecimal valorTotal;

        @JsonProperty("quantidade_autuacoes")
        private Integer quantidadeAutuacoes;

        @JsonProperty("tem_restricoes")
        private Boolean temRestricoes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestricaoVeicularDTO {
        private String tipo; // JUDICIAL, FINANCEIRA, ADMINISTRATIVA, GUINCHO, AMBIENTAL
        private String descricao;
        private String orgao;
        private String dataInclusao;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfracaoDetalhadaDTO {
        private UUID fineId; // ID no sistema caso já esteja cadastrado na tabela fines
        @JsonProperty("auto_infracao")
        private String autoInfracao;

        @JsonProperty("codigo_infracao")
        private String codigoInfracao;

        @JsonProperty("orgao_autuador")
        private String orgaoAutuador;

        private String descricao;

        @JsonProperty("data_hora")
        private String dataHora;

        private String local;

        private BigDecimal valor;

        @JsonProperty("data_vencimento")
        private String dataVencimento;

        private String situacao; // AGUARDANDO PAGAMENTO, EM RECURSO, PENALIDADE, PAGO

        private Integer pontos;

        @JsonProperty("ja_cadastrada_no_sistema")
        private Boolean jaCadastradaNoSistema;

        // ==========================================
        // CRUZAMENTO COM A PARTE DIÁRIA
        // ==========================================
        @JsonProperty("motorista_apurado")
        private MotoristaApuradoDTO motoristaApurado;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MotoristaApuradoDTO {
        @JsonProperty("driver_id")
        private UUID driverId;

        @JsonProperty("driver_name")
        private String driverName;

        @JsonProperty("driver_cnh")
        private String driverCnh;

        @JsonProperty("driver_phone")
        private String driverPhone;

        @JsonProperty("parte_diaria_id")
        private UUID parteDiariaId;

        @JsonProperty("parte_diaria_number")
        private String parteDiariaNumber;

        @JsonProperty("obra_nome")
        private String obraNome;

        @JsonProperty("rota_nome")
        private String rotaNome;

        @JsonProperty("horario_inicio")
        private String horarioInicio;

        @JsonProperty("horario_fim")
        private String horarioFim;

        @JsonProperty("confianca_cruzamento")
        private String confiancaCruzamento; // ALTA (horário exato), MEDIA (mesmo dia), BAIXA
    }
}
