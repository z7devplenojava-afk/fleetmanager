package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CalculationMemory;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CalculationMemoryDTO {
    private UUID id;
    private String details;
    private String evidencePath;
    private String monthReference; // Campo adicionado
    private List<String> calculationItems; // Campo alterado para List<String>
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID bulletinId;

    public static CalculationMemoryDTO fromEntity(CalculationMemory entity) {
        CalculationMemoryDTO dto = new CalculationMemoryDTO();
        dto.setId(entity.getId());
        dto.setDetails(entity.getDetails());
        dto.setEvidencePath(entity.getEvidencePath());
        dto.setMonthReference(entity.getMonthReference());
        // calculationItems jÃ¡ Ã© List<String> na entidade
        dto.setCalculationItems(entity.getCalculationItems());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setBulletinId(entity.getBulletin() != null ? entity.getBulletin().getId() : null);
        return dto;
    }

    public static CalculationMemory toEntity(CalculationMemoryDTO dto) {
        CalculationMemory memory = new CalculationMemory();
        memory.setId(dto.getId());
        memory.setDetails(dto.getDetails());
        memory.setEvidencePath(dto.getEvidencePath());
        memory.setMonthReference(dto.getMonthReference());
        // calculationItems jÃ¡ Ã© List<String> no DTO e na entidade
        memory.setCalculationItems(dto.getCalculationItems());
        memory.setCreatedAt(dto.getCreatedAt());
        memory.setUpdatedAt(dto.getUpdatedAt());
        return memory;
    }
}
