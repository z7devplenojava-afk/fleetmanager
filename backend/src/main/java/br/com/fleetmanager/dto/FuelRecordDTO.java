package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.model.Vehicle;
import jakarta.persistence.EntityNotFoundException;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelRecordDTO {
    
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
    private LocalDateTime createdAt;
    
    public static FuelRecordDTO fromEntity(FuelRecord fuelRecord) {
        try {
            FuelRecordDTO dto = new FuelRecordDTO();
            dto.setId(fuelRecord.getId());
            
            // Verificar se o veículo não é nulo
            if (fuelRecord.getVehicle() != null) {
                dto.setVehicleId(fuelRecord.getVehicle().getId());
                // Proteger contra proxies inválidos ou entidades ausentes
                try {
                    dto.setVehiclePlate(fuelRecord.getVehicle().getPlate());
                } catch (EntityNotFoundException e) {
                    System.err.println("Veículo não encontrado ao acessar plate para FuelRecord " + fuelRecord.getId() + ": " + e.getMessage());
                    dto.setVehiclePlate(null);
                } catch (org.hibernate.ObjectNotFoundException e) {
                    System.err.println("Veículo não encontrado (ObjectNotFoundException) para FuelRecord " + fuelRecord.getId() + ": " + e.getMessage());
                    dto.setVehiclePlate(null);
                } catch (org.hibernate.LazyInitializationException e) {
                    System.err.println("LazyInitialization ao acessar plate do veículo para FuelRecord " + fuelRecord.getId() + ": " + e.getMessage());
                    dto.setVehiclePlate(null);
                }
            }
            
            dto.setDate(fuelRecord.getDate());
            dto.setFuelType(fuelRecord.getFuelType());
            dto.setQuantity(fuelRecord.getQuantity());
            dto.setCost(fuelRecord.getCost());
            dto.setMileage(fuelRecord.getMileage());
            dto.setInitialMileage(fuelRecord.getInitialMileage());
            dto.setFinalMileage(fuelRecord.getFinalMileage());
            dto.setStation(fuelRecord.getStation());
            
            // Verificar se o motorista não é nulo antes de converter
            if (fuelRecord.getDriver() != null) {
                try {
                    dto.setDriver(DriverDTO.fromEntity(fuelRecord.getDriver()));
                } catch (Exception driverException) {
                    System.err.println("Erro ao converter motorista para FuelRecord " + fuelRecord.getId() + ": " + driverException.getMessage());
                    // Continuar sem o motorista se houver erro
                    dto.setDriver(null);
                }
            } else {
                dto.setDriver(null);
            }
            
            dto.setNotes(fuelRecord.getNotes());
            dto.setReceiptUrl(fuelRecord.getReceiptUrl());
            dto.setCostCenter(fuelRecord.getCostCenter());
            
            // Verificar se createdAt não é nulo
            if (fuelRecord.getCreatedAt() != null) {
                dto.setCreatedAt(fuelRecord.getCreatedAt());
            }
            
            return dto;
        } catch (Exception e) {
            System.err.println("Erro ao converter FuelRecord para DTO: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 