package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.z7design.fleet_manager.model.Fine.FineStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineReportDTO {
    
    private UUID id;
    private String vehiclePlate;
    private String vehicleBrand;
    private String vehicleModel;
    private String driverName;
    private String driverLicenseNumber;
    private LocalDate infractionDate;
    private LocalDate dueDate;
    private String description;
    private String location;
    private BigDecimal amount;
    private String status;
    private String statusDescription;
    private LocalDate paymentDate;
    private String notes;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private boolean overdue;
    
    // MÃ©todos auxiliares para formataÃ§Ã£o
    public String getFormattedAmount() {
        return String.format("R$ %.2f", amount);
    }
    
    public String getFormattedInfractionDate() {
        return infractionDate != null ? infractionDate.toString() : "";
    }
    
    public String getFormattedDueDate() {
        return dueDate != null ? dueDate.toString() : "";
    }
    
    public String getFormattedPaymentDate() {
        return paymentDate != null ? paymentDate.toString() : "";
    }
    
    public String getFormattedCreatedAt() {
        return createdAt != null ? createdAt.toString() : "";
    }
    
    public String getFormattedUpdatedAt() {
        return updatedAt != null ? updatedAt.toString() : "";
    }
    
    public String getStatusColor() {
        switch (status != null ? status.toUpperCase() : "") {
            case "PAID":
                return "green";
            case "PENDING":
                return "orange";
            case "CANCELLED":
                return "red";
            default:
                return "gray";
        }
    }
    
    public boolean isOverdue() {
        return dueDate != null && dueDate.isBefore(LocalDate.now()) && !"PAID".equals(status);
    }
    
    public static FineReportDTO fromEntity(com.z7design.fleet_manager.model.Fine fine) {
        FineReportDTO dto = new FineReportDTO();
        dto.setId(fine.getId());
        dto.setVehiclePlate(fine.getVehicle().getPlate());
        dto.setVehicleBrand(fine.getVehicle().getBrand());
        dto.setVehicleModel(fine.getVehicle().getModel());
        dto.setDriverName(fine.getDriver() != null ? fine.getDriver().getName() : null);
        dto.setDriverLicenseNumber(fine.getDriver() != null ? fine.getDriver().getLicenseNumber() : null);
        dto.setInfractionDate(fine.getDate());
        dto.setDescription(fine.getDescription());
        dto.setAmount(fine.getAmount());
        dto.setLocation(fine.getLocation());
        dto.setStatus(translateStatus(fine.getStatus()));
        dto.setDueDate(fine.getDueDate());
        dto.setPaymentDate(fine.getPaymentDate());
        dto.setCreatedAt(fine.getCreatedAt().toLocalDate());
        dto.setOverdue(fine.getDueDate() != null && fine.getDueDate().isBefore(LocalDate.now()) && fine.getStatus() != FineStatus.PAID);
        return dto;
    }
    
    private static String translateStatus(FineStatus status) {
        switch (status) {
            case PENDING:
                return "Pendente";
            case PAID:
                return "Paga";
            case CANCELLED:
                return "Cancelada";
            default:
                return status.toString();
        }
    }
}

