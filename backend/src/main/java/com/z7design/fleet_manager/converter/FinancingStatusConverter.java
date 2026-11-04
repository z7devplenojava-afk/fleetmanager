package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.Vehicle.FinancingStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Converter resiliente para FinancingStatus.
 */
@Slf4j
@Converter(autoApply = true)
public class FinancingStatusConverter implements AttributeConverter<FinancingStatus, String> {

    @Override
    public String convertToDatabaseColumn(FinancingStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public FinancingStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return FinancingStatus.OWNED;
        }

        String raw = dbData.trim();
        String normalized = raw.toUpperCase()
                .replace("-", "_")
                .replace(" ", "_")
                .replace("Ó", "O")
                .replace("Á", "A");

        try {
            return FinancingStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("PROPR") || normalized.contains("QUIT")) return FinancingStatus.OWNED;
            if (normalized.contains("FINANC")) return FinancingStatus.FINANCED;
            if (normalized.contains("ALUG") || normalized.contains("LOCA") || normalized.contains("LEASE")) return FinancingStatus.LEASED;
            if (normalized.contains("CEDID") || normalized.contains("EMPREST")) return FinancingStatus.RENTED;

            log.warn("Status de financiamento desconhecido: '{}'. Usando OWNED.", raw);
            return FinancingStatus.OWNED;
        }
    }
}

