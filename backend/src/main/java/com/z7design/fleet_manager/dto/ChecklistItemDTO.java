package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ChecklistItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemDTO {
    private UUID id;
    private String descricao;
    private String categoria;
    private String tipoManutencao;
    private Integer ordem;
    private Boolean ativo;

    public static ChecklistItemDTO fromEntity(ChecklistItem entity) {
        if (entity == null) return null;
        return ChecklistItemDTO.builder()
                .id(entity.getId())
                .descricao(entity.getDescricao())
                .categoria(entity.getCategoria())
                .tipoManutencao(entity.getTipoManutencao())
                .ordem(entity.getOrdem())
                .ativo(entity.getAtivo())
                .build();
    }
}
