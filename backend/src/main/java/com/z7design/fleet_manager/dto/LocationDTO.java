package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Location;
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
public class LocationDTO {
    
    private UUID id;
    private String name;
    private String description;
    private String address;
    private UnitDTO unit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static LocationDTO fromEntity(Location location) {
        if (location == null) {
            return null;
        }
        
        return LocationDTO.builder()
                .id(location.getId())
                .name(location.getName())
                .description(location.getDescription())
                .address(location.getAddress())
                .unit(location.getUnit() != null ? UnitDTO.fromEntity(location.getUnit()) : null)
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt())
                .build();
    }
    
    public Location toEntity() {
        return Location.builder()
                .id(this.id)
                .name(this.name)
                .description(this.description)
                .address(this.address)
                .unit(this.unit != null ? this.unit.toEntity() : null)
                .build();
    }
}

