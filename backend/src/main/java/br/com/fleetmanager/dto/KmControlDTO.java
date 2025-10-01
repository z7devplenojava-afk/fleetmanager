package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import br.com.fleetmanager.model.Vehicle.FuelType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KmControlDTO {
    
    private String id;
    private LocalDate date;
    private String supervisor;
    private FuelType fuelType;
    private Integer initialKm;
    private Integer finalKm;
    private Integer totalKm;
    private BigDecimal value;
    private LocalTime shiftStart;
    private LocalTime shiftEnd;
    private String workPost;
    private String problemDescription;
    private String workPostPerformance;
    private String observations;
    private String initialKmJustification;
    private String finalKmJustification;
    private String vehicleId;
    private String vehiclePlate;
    private String dashboardPhotoUrl;
    private String dashboardPhotoDescription;
    private String fuelQuantity; // Novo campo para quantidade de combustível
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Construtor para criação
    public KmControlDTO(LocalDate date, String supervisor, FuelType fuelType, 
                       Integer initialKm, Integer finalKm, BigDecimal value,
                       LocalTime shiftStart, LocalTime shiftEnd, String workPost) {
        this.date = date;
        this.supervisor = supervisor;
        this.fuelType = fuelType;
        this.initialKm = initialKm;
        this.finalKm = finalKm;
        this.value = value;
        this.shiftStart = shiftStart;
        this.shiftEnd = shiftEnd;
        this.workPost = workPost;
    }

    public KmControlDTO(LocalDate date, String supervisor, FuelType fuelType, 
                       Integer initialKm, Integer finalKm, BigDecimal value,
                       LocalTime shiftStart, LocalTime shiftEnd, String workPost, String fuelQuantity) {
        this.date = date;
        this.supervisor = supervisor;
        this.fuelType = fuelType;
        this.initialKm = initialKm;
        this.finalKm = finalKm;
        this.value = value;
        this.shiftStart = shiftStart;
        this.shiftEnd = shiftEnd;
        this.workPost = workPost;
        this.fuelQuantity = fuelQuantity;
    }
}
