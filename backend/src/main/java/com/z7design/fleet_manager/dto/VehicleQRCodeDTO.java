package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleQRCodeDTO {
    private UUID id;
    private String plate;
    private String fleetNumber;
    private String brand;
    private String model;
    private Integer year;
    private String status;
    private String fuelType;
    private Integer currentMileage;
    
    // Garagem
    private String garageName;
    private UUID garageId;
    
    // Cliente e Obra
    private String clientName;
    private UUID clientId;
    private String workPostName;
    private UUID workPostId;
    
    // Motorista / Responsável
    private String assignedDriver;
    private String responsibleEmployeeName;
    private UUID responsibleEmployeeId;
    
    // Última Ordem de Serviço
    private String lastOsNumber;
    private String lastOsStatus;
    private String lastOsType;
    private LocalDate lastOsDate;
    private BigDecimal lastOsCost;
    private String lastOsMaintenancePerformed;
    
    // QR Code metadata
    private String qrCodeText;
    private String qrCodeImageUrl;
    private LocalDateTime generatedAt;
}
