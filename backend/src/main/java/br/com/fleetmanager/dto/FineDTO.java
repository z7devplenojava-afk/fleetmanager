package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.Fine;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FineDTO {
    
    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private String driverLicenseNumber;
    private LocalDate date;
    private String description;
    private BigDecimal amount;
    private String location;
    private Fine.FineStatus status;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private LocalDateTime createdAt;
    
    public static FineDTO fromEntity(Fine fine) {
        FineDTO dto = new FineDTO();
        dto.setId(fine.getId());
        // Informações do veículo (proteger contra nulos/lazy)
        if (fine.getVehicle() != null) {
            try {
                dto.setVehicleId(fine.getVehicle().getId());
                dto.setVehiclePlate(fine.getVehicle().getPlate());
            } catch (Exception ignored) {
                // Em caso de lazy/object not found, mantemos campos nulos
                dto.setVehicleId(null);
                dto.setVehiclePlate(null);
            }
        }
        
        // Informações do motorista
        if (fine.getDriver() != null) {
            dto.setDriverId(fine.getDriver().getId());
            dto.setDriverName(fine.getDriver().getName());
            dto.setDriverLicenseNumber(fine.getDriver().getLicenseNumber());
        }
        
        dto.setDate(fine.getDate());
        dto.setDescription(fine.getDescription());
        dto.setAmount(fine.getAmount());
        dto.setLocation(fine.getLocation());
        dto.setStatus(fine.getStatus());
        dto.setDueDate(fine.getDueDate());
        dto.setPaymentDate(fine.getPaymentDate());
        dto.setCreatedAt(fine.getCreatedAt());
        return dto;
    }
} 