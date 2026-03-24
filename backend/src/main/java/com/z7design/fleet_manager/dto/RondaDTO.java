package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.RondaPrioridade;
import com.z7design.fleet_manager.model.enums.RondaStatus;
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
public class RondaDTO {
    
    private UUID id;
    private String nome;
    private String descricao;
    private RondaTipo tipo;
    private RondaPrioridade prioridade;
    private RondaStatus status;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private Integer duracaoEstimada;
    private Integer duracaoReal;
    private UUID responsavelId;
    private String responsavelNome;
    private UUID supervisorId;
    private String supervisorNome;
    private UUID localId;
    private String localNome;
    private String endereco;
    private String observacoes;
    private List<RondaCheckpointDTO> checkpoints;
    private List<RondaEquipamentoDTO> equipamentos;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}


