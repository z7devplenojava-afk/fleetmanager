package com.z7design.fleet_manager.converter;

import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * Converter resiliente para VehicleType.
 * Impede que valores legados ou sinônimos gravados no banco (ex: MICROBUS, MICRO_ONIBUS, etc.)
 * disparem exceções e quebrem as consultas de listagem da frota.
 */
@Slf4j
@Converter(autoApply = true)
public class VehicleTypeConverter implements AttributeConverter<VehicleType, String> {

    @Override
    public String convertToDatabaseColumn(VehicleType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public VehicleType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        String raw = dbData.trim();
        String normalized = raw.toUpperCase().replace("-", "_").replace(" ", "_");

        try {
            return VehicleType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Mapeamentos resilientes para sinônimos comuns no banco
            if (normalized.contains("MICRO")) {
                return VehicleType.MINIBUS;
            }
            if (normalized.contains("VAN")) {
                return VehicleType.VAN;
            }
            if (normalized.contains("RODOV")) {
                return VehicleType.BUS_ROAD;
            }
            if (normalized.contains("URBAN")) {
                return VehicleType.BUS_URBAN;
            }
            if (normalized.contains("TURISMO") || normalized.contains("DOUBLE")) {
                return VehicleType.BUS_LUXURY_TOURISM;
            }
            if (normalized.contains("BUS") || normalized.contains("ONIBUS")) {
                return VehicleType.BUS_ROAD;
            }
            if (normalized.contains("CAMINHAO") || normalized.contains("TRUCK") || normalized.contains("CAVALO") || normalized.contains("CARRETA")) {
                return VehicleType.TRUCK;
            }
            if (normalized.contains("UTILITARIO") || normalized.contains("FURGAO")) {
                return VehicleType.CAR_UTILITY;
            }
            if (normalized.contains("PICKUP") || normalized.contains("PICAPE") || normalized.contains("CAMIONETE")) {
                return VehicleType.PICKUP;
            }
            if (normalized.contains("SUV")) {
                return VehicleType.SUV;
            }
            if (normalized.contains("MOTO")) {
                return VehicleType.MOTORCYCLE;
            }
            if (normalized.contains("CARRO") || normalized.contains("PASSEIO") || normalized.contains("AUTO")) {
                return VehicleType.CAR;
            }

            log.warn("Valor desconhecido de vehicle_type no banco: '{}'. Mapeando para VehicleType.OTHER para não quebrar a consulta.", raw);
            return VehicleType.OTHER;
        }
    }
}

