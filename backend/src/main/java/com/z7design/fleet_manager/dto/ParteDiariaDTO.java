package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class ParteDiariaDTO {
    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID id;

    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID companyId;

    private String number;
    private LocalDate date;

    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID clientId;

    private String clientName;

    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID contractId;

    private String contractNumber;
    private String obraName;
    private String serviceName;
    private String routeName;

    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID vehicleId;

    private String vehiclePlate;
    private String vehicleModel;

    @JsonDeserialize(using = LenientUuidDeserializer.class)
    private UUID driverId;

    private String driverName;
    private String startTime;
    private String endTime;
    private BigDecimal startKm;
    private BigDecimal endKm;
    private BigDecimal drivenKm;
    private BigDecimal disregardedKm;
    private BigDecimal consideredKm;
    private String disregardReason;
    private String status;
    private String notes;
    private String createdBy;
    private List<ParteDiariaAtividadeDTO> atividades;

    @Data
    public static class ParteDiariaAtividadeDTO {
        @JsonDeserialize(using = LenientUuidDeserializer.class)
        private UUID id;
        private String startTime;
        private String endTime;
        private String description;
        private String activityType;
        private String routeCode;
        private String companyName;
        private Integer startKm;
        private Integer endKm;
        private Integer passengersCount;
        private String notes;
    }

    /**
     * Deserializador tolerante para campos UUID enviados pelo frontend.
     * Caso o frontend envie um identificador de preset/mock (ex: "preset-geraesmin",
     * "cli-01", "contract-veh-0-RUR7A78"), retorna null em vez de lançar erro 400/500,
     * permitindo que o serviço resolva pelo nome/placa.
     */
    public static class LenientUuidDeserializer extends JsonDeserializer<UUID> {
        @Override
        public UUID deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String value = p.getValueAsString();
            if (value == null || value.isBlank()) {
                return null;
            }
            try {
                return UUID.fromString(value.trim());
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }
}
