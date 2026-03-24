package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {

    private UUID id;
    private String plate;
    private String fleetNumber;
    private String model;
    private String brand;
    private Integer year;
    private String color;
    private Vehicle.VehicleStatus status;
    private Vehicle.FuelType fuelType;
    private Integer capacity;
    private Integer currentMileage;

    // Campos adicionais que estavam faltando
    private Integer initialMileage;
    private String assignedDriver;
    private UUID responsibleEmployeeId;
    private String department;
    private UUID departmentId;
    private UUID companyId;
    private UUID workPostId;
    private String location;
    private LocalDate acquisitionDate;
    private BigDecimal acquisitionValue;
    private BigDecimal averageConsumption;
    private BigDecimal averageCostPerKm;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastMaintenanceDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextMaintenanceDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate insuranceExpiryDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate documentationExpiryDate;
    private String notes;
    private String photos; // URLs das fotos do veÃ­culo
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleDTO fromEntity(Vehicle vehicle) {
        try {
            System.out.println(
                    "[DEBUG] VehicleDTO.fromEntity() - Iniciando conversÃ£o para veÃ­culo: " + vehicle.getPlate());

            VehicleDTO dto = new VehicleDTO();

            // Campos bÃ¡sicos
            dto.setId(vehicle.getId());
            dto.setPlate(vehicle.getPlate());
            dto.setFleetNumber(vehicle.getFleetNumber());
            dto.setModel(vehicle.getModel());
            dto.setBrand(vehicle.getBrand());
            dto.setYear(vehicle.getYear());
            dto.setColor(vehicle.getColor());
            dto.setStatus(vehicle.getStatus());
            dto.setFuelType(vehicle.getFuelType());
            dto.setCapacity(vehicle.getCapacity());
            dto.setCurrentMileage(vehicle.getCurrentMileage());

            // Campos adicionais
            dto.setInitialMileage(vehicle.getInitialMileage());
            dto.setAssignedDriver(vehicle.getAssignedDriver());
            dto.setResponsibleEmployeeId(vehicle.getResponsibleEmployeeId());
            dto.setDepartment(vehicle.getDepartment());
            dto.setDepartmentId(vehicle.getDepartmentId());
            dto.setCompanyId(vehicle.getCompanyId());
            dto.setWorkPostId(vehicle.getWorkPostId());
            dto.setLocation(vehicle.getLocation());
            dto.setAcquisitionDate(vehicle.getAcquisitionDate());
            dto.setAcquisitionValue(vehicle.getAcquisitionValue());
            dto.setAverageConsumption(vehicle.getAverageConsumption());
            dto.setAverageCostPerKm(vehicle.getAverageCostPerKm());

            // Campos de data
            System.out.println("[DEBUG] VehicleDTO.fromEntity() - Definindo datas...");
            dto.setLastMaintenanceDate(vehicle.getLastMaintenanceDate());
            dto.setNextMaintenanceDate(vehicle.getNextMaintenanceDate());
            dto.setInsuranceExpiryDate(vehicle.getInsuranceExpiryDate());
            dto.setDocumentationExpiryDate(vehicle.getDocumentationExpiryDate());

            // Campos restantes
            dto.setNotes(vehicle.getNotes());
            dto.setPhotos(vehicle.getPhotos());
            dto.setCreatedAt(vehicle.getCreatedAt());
            dto.setUpdatedAt(vehicle.getUpdatedAt());

            System.out.println("[DEBUG] VehicleDTO.fromEntity() - ConversÃ£o concluÃ­da com sucesso");
            return dto;

        } catch (Exception e) {
            System.err.println("[DEBUG] VehicleDTO.fromEntity() - Erro na conversÃ£o: " + e.getMessage());
            System.err.println("[DEBUG] VehicleDTO.fromEntity() - Stack trace:");
            e.printStackTrace();
            throw e;
        }
    }

    public Vehicle toEntity() {
        Vehicle vehicle = new Vehicle();

        // Campos bÃ¡sicos
        vehicle.setId(this.id);
        vehicle.setPlate(this.plate);
        vehicle.setFleetNumber(this.fleetNumber);
        vehicle.setModel(this.model);
        vehicle.setBrand(this.brand);
        vehicle.setYear(this.year);
        vehicle.setColor(this.color);
        vehicle.setStatus(this.status);
        vehicle.setFuelType(this.fuelType);
        vehicle.setCapacity(this.capacity);
        vehicle.setCurrentMileage(this.currentMileage);

        // Campos adicionais
        vehicle.setInitialMileage(this.initialMileage);
        vehicle.setAssignedDriver(this.assignedDriver);
        vehicle.setResponsibleEmployeeId(this.responsibleEmployeeId);
        vehicle.setDepartment(this.department);
        vehicle.setDepartmentId(this.departmentId);
        vehicle.setCompanyId(this.companyId);
        vehicle.setWorkPostId(this.workPostId);
        vehicle.setLocation(this.location);
        vehicle.setAcquisitionDate(this.acquisitionDate);
        vehicle.setAcquisitionValue(this.acquisitionValue);
        vehicle.setAverageConsumption(this.averageConsumption);
        vehicle.setAverageCostPerKm(this.averageCostPerKm);

        // Campos de data
        vehicle.setLastMaintenanceDate(this.lastMaintenanceDate);
        vehicle.setNextMaintenanceDate(this.nextMaintenanceDate);
        vehicle.setInsuranceExpiryDate(this.insuranceExpiryDate);
        vehicle.setDocumentationExpiryDate(this.documentationExpiryDate);

        // Campos restantes
        vehicle.setNotes(this.notes);
        vehicle.setPhotos(this.photos);
        vehicle.setCreatedAt(this.createdAt);
        vehicle.setUpdatedAt(this.updatedAt);

        return vehicle;
    }
}
