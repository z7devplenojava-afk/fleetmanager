package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.RondaPrioridade;
import com.z7design.fleet_manager.model.enums.RondaTipo;
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
public class CreateRondaDTO {
    
    private String nome;
    private String descricao;
    private RondaTipo tipo;
    private RondaPrioridade prioridade;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private Integer duracaoEstimada;
    private UUID responsavelId;
    private UUID supervisorId;
    private UUID localId;
    private String endereco;
    private String observacoes;
    private List<CreateRondaCheckpointDTO> checkpoints;
    private List<CreateRondaEquipamentoDTO> equipamentos;
}


