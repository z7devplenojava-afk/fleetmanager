package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.Vehicle.BusType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Converter resiliente para BusType.
 * Mapeia com segurança variações salvas no banco (ex: CONVENCIONAL, MICROS, VIP, acentuações)
 * impedindo que falhas de Enum no JDBC quebrem a listagem de veículos da frota.
 */
@Slf4j
@Converter(autoApply = true)
public class BusTypeConverter implements AttributeConverter<BusType, String> {

    @Override
    public String convertToDatabaseColumn(BusType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public BusType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        String raw = dbData.trim();
        String normalized = raw.toUpperCase()
                .replace("-", "_")
                .replace(" ", "_")
                .replace("Á", "A")
                .replace("À", "A")
                .replace("Ã", "A")
                .replace("É", "E")
                .replace("Í", "I")
                .replace("Ó", "O")
                .replace("Õ", "O")
                .replace("Ú", "U")
                .replace("Ç", "C");

        try {
            return BusType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("RODOV")) {
                return BusType.RODOVIARIO;
            }
            if (normalized.contains("URBAN")) {
                return BusType.URBANO;
            }
            if (normalized.contains("TURISMO") || normalized.contains("LUXO")) {
                return BusType.LUXO_TURISMO;
            }
            if (normalized.contains("DOUBLE") || normalized.contains("DD")) {
                return BusType.DOUBLE_DECKER;
            }
            if (normalized.contains("MICRO")) {
                return BusType.MICRO_ONIBUS;
            }
            if (normalized.contains("ARTICULADO")) {
                return normalized.contains("BI") ? BusType.BIARTICULADO : BusType.ARTICULADO;
            }
            if (normalized.contains("PADRON") || normalized.contains("CONVENCIONAL")) {
                return BusType.PADRON;
            }
            if (normalized.contains("ELET")) {
                return BusType.ELETRICO;
            }
            if (normalized.contains("HIB")) {
                return BusType.HIBRIDO;
            }
            if (normalized.contains("ESCO")) {
                return BusType.ESCOLA;
            }
            if (normalized.contains("FRET")) {
                return BusType.FRETADO;
            }
            if (normalized.contains("INTER")) {
                return BusType.INTERMUNICIPAL;
            }
            if (normalized.contains("VIP")) {
                return BusType.LUXO_TURISMO;
            }

            log.warn("Valor desconhecido de bus_type no banco: '{}'. Retornando RODOVIARIO como padrão seguro.", raw);
            return BusType.RODOVIARIO;
        }
    }
}

