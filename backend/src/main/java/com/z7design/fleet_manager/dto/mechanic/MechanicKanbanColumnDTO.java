package com.z7design.fleet_manager.dto.mechanic;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MechanicKanbanColumnDTO {
    private String id;
    private String title;
    private List<MechanicTaskDTO> tasks;
}
