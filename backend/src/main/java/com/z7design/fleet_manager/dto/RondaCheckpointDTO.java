package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RondaCheckpointDTO {
    private UUID id;
    private UUID rondaId;
    private String nome;
    private String descricao;
    private Integer ordem;
    private Double latitude;
    private Double longitude;
    private String endereco;
    private Boolean obrigatorio;
    private Integer tempoEstimado;
    private Integer tempoReal;
    private String status; // PENDENTE, VISITADO, PULADO, ATRASADO
    private LocalDateTime dataVisita;
    private String observacoes;
    private List<String> fotos;
    private String assinatura;
}


