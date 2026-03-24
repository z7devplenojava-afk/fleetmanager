package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RondaStatsDTO {
    private Long total;
    private Long agendadas;
    private Long emAndamento;
    private Long concluidas;
    private Long canceladas;
    private Long atrasadas;
    private Double percentualConclusao;
    private Double tempoMedioConclusao;
    private Long rondasHoje;
    private Long rondasSemana;
}


