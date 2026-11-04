package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.Vehicle.FuelType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Converter resiliente para FuelType.
 */
@Slf4j
@Converter(autoApply = true)
public class FuelTypeConverter implements AttributeConverter<FuelType, String> {

    @Override
    public String convertToDatabaseColumn(FuelType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public FuelType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return FuelType.DIESEL;
        }

        String raw = dbData.trim();
        String normalized = raw.toUpperCase()
                .replace("-", "_")
                .replace(" ", "_")
                .replace("Á", "A")
                .replace("É", "E")
                .replace("Í", "I");

        try {
            return FuelType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("DIESEL")) return FuelType.DIESEL;
            if (normalized.contains("GASOL")) return FuelType.GASOLINE;
            if (normalized.contains("ETANOL") || normalized.contains("ALCOOL")) return FuelType.ETHANOL;
            if (normalized.contains("FLEX")) return FuelType.FLEX;
            if (normalized.contains("ELET")) return FuelType.ELECTRIC;
            if (normalized.contains("HIB")) return FuelType.HYBRID;
            if (normalized.contains("GNV") || normalized.contains("GAS")) return FuelType.CNG;

            log.warn("Combustível não reconhecido: '{}'. Usando DIESEL como padrão.", raw);
            return FuelType.DIESEL;
        }
    }
}
