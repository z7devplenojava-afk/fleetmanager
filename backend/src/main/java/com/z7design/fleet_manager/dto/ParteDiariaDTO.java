package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class ParteDiariaDTO {
    private UUID id;
    private UUID companyId;
    private String number;
    private LocalDate date;
    private UUID clientId;
    private String clientName;
    private UUID contractId;
    private String contractNumber;
    private String obraName;
    private String serviceName;
    private String routeName;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
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
        private UUID id;
        private String startTime;
        private String endTime;
        private String description;
        private String activityType;
        private String notes;
    }
}
