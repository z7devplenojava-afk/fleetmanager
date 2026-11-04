package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.Vehicle.VehicleStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Converter resiliente para VehicleStatus.
 */
@Slf4j
@Converter(autoApply = true)
public class VehicleStatusConverter implements AttributeConverter<VehicleStatus, String> {

    @Override
    public String convertToDatabaseColumn(VehicleStatus attribute) {
        if (attribute == null) {
            return VehicleStatus.ACTIVE.name();
        }
        return attribute.name();
    }

    @Override
    public VehicleStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return VehicleStatus.ACTIVE;
        }

        String raw = dbData.trim();
        String normalized = raw.toUpperCase()
                .replace("-", "_")
                .replace(" ", "_")
                .replace("Ç", "C")
                .replace("Ã", "A");

        try {
            return VehicleStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("ATIV") || normalized.contains("OPERA")) return VehicleStatus.ACTIVE;
            if (normalized.contains("INAT")) return VehicleStatus.INACTIVE;
            if (normalized.contains("MANUT") || normalized.contains("OFICINA")) return VehicleStatus.MAINTENANCE;
            if (normalized.contains("BLOQ")) return VehicleStatus.BLOCKED;
            if (normalized.contains("VEND")) return VehicleStatus.SOLD;
            if (normalized.contains("BAIX")) return VehicleStatus.BAIXADO;
            if (normalized.contains("LOC") || normalized.contains("ARREND")) return VehicleStatus.LEASED;
            if (normalized.contains("RESERV")) return VehicleStatus.RESERVED;

            return VehicleStatus.ACTIVE;
        }
    }
}

