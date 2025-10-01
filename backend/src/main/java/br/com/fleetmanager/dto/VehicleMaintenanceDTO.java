package br.com.fleetmanager.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.VehicleMaintenance;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleMaintenanceDTO {

    private UUID id;

    @NotNull(message = "ID do veículo é obrigatório")
    private UUID vehicleId;

    private String vehiclePlate;

    @NotNull(message = "Data da manutenção é obrigatória")
    @FutureOrPresent(message = "Data da manutenção deve ser hoje ou uma data futura")
    private LocalDate date;

    @NotNull(message = "Tipo de manutenção é obrigatório")
    @Pattern(regexp = "^(PREVENTIVE|CORRECTIVE|PREDICTIVE|IMPROVEMENT|OTHER)$", 
             message = "Tipo deve ser PREVENTIVE, CORRECTIVE, PREDICTIVE, IMPROVEMENT ou OTHER")
    private String maintenanceType;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(min = 10, max = 1000, message = "Descrição deve ter entre 10 e 1000 caracteres")
    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Custo deve ser maior que zero")
    @Digits(integer = 8, fraction = 2, message = "Custo deve ter no máximo 8 dígitos inteiros e 2 decimais")
    private BigDecimal cost;

    @Size(max = 200, message = "Fornecedor deve ter no máximo 200 caracteres")
    private String provider;

    @DecimalMin(value = "0.0", inclusive = true, message = "Quilometragem deve ser maior ou igual a zero")
    @Digits(integer = 6, fraction = 9, message = "Quilometragem deve ter no máximo 6 dígitos inteiros e 9 decimais")
    private BigDecimal mileage;

    @NotNull(message = "Status é obrigatório")
    @Pattern(regexp = "^(SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED)$", 
             message = "Status deve ser SCHEDULED, IN_PROGRESS, COMPLETED ou CANCELLED")
    private String status;

    @NotNull(message = "Prioridade é obrigatória")
    @Pattern(regexp = "^(LOW|MEDIUM|HIGH|URGENT)$", 
             message = "Prioridade deve ser LOW, MEDIUM, HIGH ou URGENT")
    private String priority;

    @Size(max = 1000, message = "Observações devem ter no máximo 1000 caracteres")
    private String notes;

    private java.util.List<String> photos = new java.util.ArrayList<>();
    private java.util.List<String> documents = new java.util.ArrayList<>();

    private java.util.List<String> removedPhotos = new java.util.ArrayList<>();
    private java.util.List<String> removedDocuments = new java.util.ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Método para converter DTO para entidade
    public static VehicleMaintenance toEntity(VehicleMaintenanceDTO dto) {
        VehicleMaintenance maintenance = new VehicleMaintenance();
        maintenance.setId(dto.getId());
        maintenance.setDate(dto.getDate());
        maintenance.setMaintenanceType(VehicleMaintenance.MaintenanceType.valueOf(dto.getMaintenanceType()));
        maintenance.setDescription(dto.getDescription());
        maintenance.setCost(dto.getCost());
        maintenance.setProvider(dto.getProvider());
        maintenance.setMileage(dto.getMileage());
        maintenance.setStatus(VehicleMaintenance.MaintenanceStatus.valueOf(dto.getStatus()));
        maintenance.setPriority(VehicleMaintenance.MaintenancePriority.valueOf(dto.getPriority()));
        maintenance.setNotes(dto.getNotes());
        maintenance.setPhotos(dto.getPhotos());
        maintenance.setDocuments(dto.getDocuments());
        return maintenance;
    }

    // Método para converter entidade para DTO
    public static VehicleMaintenanceDTO fromEntity(VehicleMaintenance maintenance) {
        VehicleMaintenanceDTO dto = new VehicleMaintenanceDTO();
        dto.setId(maintenance.getId());
        
        // Tratar relacionamento com veículo de forma segura
        if (maintenance.getVehicle() != null) {
            dto.setVehicleId(maintenance.getVehicle().getId());
            dto.setVehiclePlate(maintenance.getVehicle().getPlate());
        }
        
        dto.setDate(maintenance.getDate());
        dto.setMaintenanceType(maintenance.getMaintenanceType().name());
        dto.setDescription(maintenance.getDescription());
        dto.setCost(maintenance.getCost());
        dto.setProvider(maintenance.getProvider());
        dto.setMileage(maintenance.getMileage());
        dto.setStatus(maintenance.getStatus().name());
        dto.setPriority(maintenance.getPriority().name());
        dto.setNotes(maintenance.getNotes());
        dto.setCreatedAt(maintenance.getCreatedAt());
        dto.setUpdatedAt(maintenance.getUpdatedAt());
        dto.setPhotos(maintenance.getPhotos());
        dto.setDocuments(maintenance.getDocuments());
        return dto;
    }
}
