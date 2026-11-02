package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Cid10Entry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cid10DTO {
    private String code;
    private String description;
    private String category;

    public static Cid10DTO fromEntity(Cid10Entry entry) {
        if (entry == null) return null;
        return Cid10DTO.builder()
                .code(entry.getCode())
                .description(entry.getDescription())
                .category(entry.getCategory())
                .build();
    }
}
