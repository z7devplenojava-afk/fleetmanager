package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RondaEquipamentoDTO {
    private UUID id;
    private UUID rondaId;
    private UUID equipamentoId;
    private String equipamentoNome;
    private String equipamentoTipo;
    private String numeroSerie;
    private String status; // DISPONIVEL, EM_USO, MANUTENCAO, DANIFICADO
    private LocalDateTime dataRetirada;
    private LocalDateTime dataDevolucao;
    private String observacoes;
}


