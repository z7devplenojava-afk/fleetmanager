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
    private UUID clientId;
    private String clientName;
    private UUID workPostId;
    private String obraName;
    private UUID contractId;
    private String contractNumber;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal pricePerLiter;
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

            // Novas propriedades de alocação e fornecedor
            dto.setPricePerLiter(fuelRecord.getPricePerLiter());
            
            if (fuelRecord.getClient() != null) {
                try {
                    dto.setClientId(fuelRecord.getClient().getId());
                    dto.setClientName(fuelRecord.getClient().getName());
                } catch (Exception e) {
                    dto.setClientName(fuelRecord.getClientName());
                }
            } else {
                dto.setClientName(fuelRecord.getClientName());
            }

            if (fuelRecord.getWorkPost() != null) {
                try {
                    dto.setWorkPostId(fuelRecord.getWorkPost().getId());
                    dto.setObraName(fuelRecord.getWorkPost().getName());
                } catch (Exception e) {
                    dto.setObraName(fuelRecord.getObraName());
                }
            } else {
                dto.setObraName(fuelRecord.getObraName());
            }

            if (fuelRecord.getContract() != null) {
                try {
                    dto.setContractId(fuelRecord.getContract().getId());
                    dto.setContractNumber(fuelRecord.getContract().getContractNumber());
                } catch (Exception e) {
                    dto.setContractNumber(fuelRecord.getContractNumber());
                }
            } else {
                dto.setContractNumber(fuelRecord.getContractNumber());
            }

            if (fuelRecord.getSupplier() != null) {
                try {
                    dto.setSupplierId(fuelRecord.getSupplier().getId());
                    dto.setSupplierName(fuelRecord.getSupplier().getName());
                } catch (Exception e) {
                    dto.setSupplierName(fuelRecord.getStation());
                }
            } else {
                dto.setSupplierName(fuelRecord.getStation());
            }
            
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
