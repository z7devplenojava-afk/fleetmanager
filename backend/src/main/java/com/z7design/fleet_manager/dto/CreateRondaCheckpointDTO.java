package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRondaCheckpointDTO {
    private String nome;
    private String descricao;
    private Integer ordem;
    private Double latitude;
    private Double longitude;
    private String endereco;
    private Boolean obrigatorio;
    private Integer tempoEstimado;
}


