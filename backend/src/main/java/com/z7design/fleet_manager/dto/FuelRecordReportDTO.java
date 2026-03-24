package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelRecordReportDTO {
    
    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private LocalDate date;
    private Vehicle.FuelType fuelType;
    private BigDecimal quantity;
    private BigDecimal cost;
    private Integer mileage;
    private Integer initialMileage;
    private Integer finalMileage;
    private String station;
    private DriverDTO driver;
    private String notes;
    private String receiptUrl;
    private String costCenter;
    private String costCenterName; // Nome do centro de custo
    private LocalDateTime createdAt;
    
    public static FuelRecordReportDTO fromEntity(FuelRecord fuelRecord, String costCenterName) {
        try {
            FuelRecordReportDTO dto = new FuelRecordReportDTO();
            dto.setId(fuelRecord.getId());
            
            // Verificar se o veÃ­culo nÃ£o Ã© nulo
            if (fuelRecord.getVehicle() != null) {
                dto.setVehicleId(fuelRecord.getVehicle().getId());
                dto.setVehiclePlate(fuelRecord.getVehicle().getPlate());
            }
            
            dto.setDate(fuelRecord.getDate());
            dto.setFuelType(fuelRecord.getFuelType());
            dto.setQuantity(fuelRecord.getQuantity());
            dto.setCost(fuelRecord.getCost());
            dto.setMileage(fuelRecord.getMileage());
            dto.setInitialMileage(fuelRecord.getInitialMileage());
            dto.setFinalMileage(fuelRecord.getFinalMileage());
            dto.setStation(fuelRecord.getStation());
            
            // Verificar se o motorista nÃ£o Ã© nulo antes de converter
            if (fuelRecord.getDriver() != null) {
                try {
                    dto.setDriver(DriverDTO.fromEntity(fuelRecord.getDriver()));
                } catch (Exception driverException) {
                    System.err.println("Erro ao converter motorista: " + driverException.getMessage());
                    // Continuar sem o motorista se houver erro
                }
            }
            
            dto.setNotes(fuelRecord.getNotes());
            dto.setReceiptUrl(fuelRecord.getReceiptUrl());
            dto.setCostCenter(fuelRecord.getCostCenter());
            dto.setCostCenterName(costCenterName);
            
            // Verificar se createdAt nÃ£o Ã© nulo
            if (fuelRecord.getCreatedAt() != null) {
                dto.setCreatedAt(fuelRecord.getCreatedAt());
            }
            
            return dto;
        } catch (Exception e) {
            System.err.println("Erro ao converter FuelRecord para FuelRecordReportDTO: " + e.getMessage());
            throw new RuntimeException("Erro ao converter registro: " + fuelRecord.getId(), e);
        }
    }
}

