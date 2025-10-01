package br.com.fleetmanager.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.CalculationMemory;

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
        dto.setMonthReference(entity.getMonthReference()); // Linha adicionada
        // Converter String para List<String> se necessário
        if (entity.getCalculationItems() != null && !entity.getCalculationItems().isEmpty()) {
            try {
                // Se for JSON array, converter para List
                dto.setCalculationItems(java.util.Arrays.asList(entity.getCalculationItems().split(",")));
            } catch (Exception e) {
                // Se não conseguir converter, usar como string única
                dto.setCalculationItems(java.util.Arrays.asList(entity.getCalculationItems()));
            }
        }
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
        memory.setMonthReference(dto.getMonthReference()); // Linha adicionada
        // Converter List<String> para String se necessário
        if (dto.getCalculationItems() != null && !dto.getCalculationItems().isEmpty()) {
            memory.setCalculationItems(String.join(",", dto.getCalculationItems()));
        }
        memory.setCreatedAt(dto.getCreatedAt());
        memory.setUpdatedAt(dto.getUpdatedAt());
        return memory;
    }
}