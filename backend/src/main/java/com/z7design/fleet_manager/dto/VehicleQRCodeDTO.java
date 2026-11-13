package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleQRCodeDTO {
    // Identificação Básica
    private UUID id;
    private String plate;
    private String fleetNumber;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private String status;
    private String fuelType;
    private Integer currentMileage;
    
    // Garagem
    private String garageName;
    private UUID garageId;
    private String garageAddress;
    
    // Cliente e Obra
    private String clientName;
    private UUID clientId;
    private String clientCnpj;
    private String workPostName;
    private UUID workPostId;
    private String contractNumber;
    
    // Motorista / Responsável
    private String assignedDriver;
    private String responsibleEmployeeName;
    private UUID responsibleEmployeeId;
    private String driverCnh;
    private String driverCpf;
    
    // Última Ordem de Serviço (OS)
    private String lastOsNumber;
    private String lastOsStatus;
    private String lastOsType;
    private LocalDate lastOsDate;
    private BigDecimal lastOsCost;
    private String lastOsMaintenancePerformed;
    
    // Documentos & Dados Cadastrais
    private String chassisNumber;
    private String renavan;
    private LocalDate documentationExpiryDate;
    private String documentationStatus; // OK, EXPIRING_SOON, EXPIRED
    private Long documentationDaysRemaining;
    private LocalDate insuranceExpiryDate;
    private String insuranceStatus;
    private Long insuranceDaysRemaining;
    private String insuranceCompany;
    private String insurancePolicyNumber;
    
    // Último Abastecimento
    private LocalDate lastFuelDate;
    private BigDecimal lastFuelLiters;
    private BigDecimal lastFuelCost;
    private String lastFuelStation;
    private String lastFuelType;
    private Integer lastFuelMileage;
    
    // Última Rota Executada
    private String lastRouteCode;
    private String lastRouteName;
    private LocalDate lastTripDate;
    private LocalDateTime lastTripStartTime;
    private LocalDateTime lastTripEndTime;
    private String lastTripDriverName;
    private Integer lastTripInitialKm;
    private Integer lastTripFinalKm;
    private String lastTripStatus;
    
    // Gestão de Agregado (SÓ EXIBIDO SE FOR VEÍCULO DE AGREGADO)
    private Boolean isAggregated;
    private String aggregatedOwnerName;
    private String aggregatedOwnerCpfCnpj;
    private String aggregatedOwnerPhone;
    private String aggregatedOwnerEmail;
    private BigDecimal aggregatedDailyRate;
    private BigDecimal aggregatedMonthlyRate;
    private String aggregatedPaymentType;
    private LocalDate aggregatedContractStartDate;
    private LocalDate aggregatedContractEndDate;
    private String aggregatedNotes;
    
    // Localização Atual
    private String currentLocation;
    private Double currentLatitude;
    private Double currentLongitude;
    
    // Manutenção Preventiva & Vencimentos de Componentes
    private Integer preventiveOverdueCount;
    private Integer preventiveUpcomingCount;
    private String preventiveAlertsSummary;
    private List<PreventiveAlertItemDTO> preventiveItems;
    
    // QR Code metadata
    private String qrCodeText;
    private String qrCodeImageUrl;
    private LocalDateTime generatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreventiveAlertItemDTO {
        private String controlType;
        private String componentName;
        private Integer lastServiceKm;
        private Integer nextDueKm;
        private Integer remainingKm;
        private String status; // OVERDUE, UPCOMING, OK
        private LocalDate lastServiceDate;
    }
}
