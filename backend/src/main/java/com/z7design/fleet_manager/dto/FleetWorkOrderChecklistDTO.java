package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.FleetWorkOrderChecklist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FleetWorkOrderChecklistDTO {
    private UUID id;
    private UUID workOrderId;
    private UUID checklistItemId;
    private String checklistItemDescricao;
    private String checklistItemCategoria;
    private FleetWorkOrderChecklist.ChecklistStatus situacao;
    private String observacao;
    private String reparoRealizado;

    public static FleetWorkOrderChecklistDTO fromEntity(FleetWorkOrderChecklist entity) {
        if (entity == null) return null;
        return FleetWorkOrderChecklistDTO.builder()
                .id(entity.getId())
                .workOrderId(entity.getWorkOrder() != null ? entity.getWorkOrder().getId() : null)
                .checklistItemId(entity.getChecklistItem() != null ? entity.getChecklistItem().getId() : null)
                .checklistItemDescricao(entity.getChecklistItem() != null ? entity.getChecklistItem().getDescricao() : null)
                .checklistItemCategoria(entity.getChecklistItem() != null ? entity.getChecklistItem().getCategoria() : null)
                .situacao(entity.getSituacao())
                .observacao(entity.getObservacao())
                .reparoRealizado(entity.getReparoRealizado())
                .build();
    }
}
