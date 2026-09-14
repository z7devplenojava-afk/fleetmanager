package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFuelRecordDTO {
    
    @NotNull(message = "ID do veÃ­culo nÃ£o pode ser nulo")
    private UUID vehicleId;
    
    @NotNull(message = "Data nÃ£o pode ser nula")
    private LocalDate date;
    
    @NotNull(message = "Tipo de combustÃ­vel Ã© obrigatÃ³rio")
    private Vehicle.FuelType fuelType;
    
    @NotNull(message = "Quantidade Ã© obrigatÃ³ria")
    @Positive(message = "Quantidade deve ser positiva")
    private Double quantity;
    
    @NotNull(message = "Custo Ã© obrigatÃ³rio")
    @Positive(message = "Custo deve ser positivo")
    private Double cost;
    
    @NotNull(message = "Quilometragem Ã© obrigatÃ³ria")
    @PositiveOrZero(message = "Quilometragem nÃ£o pode ser negativa")
    private Integer mileage;
    
    @PositiveOrZero(message = "Quilometragem inicial nÃ£o pode ser negativa")
    private Integer initialMileage;
    
    @PositiveOrZero(message = "Quilometragem final nÃ£o pode ser negativa")
    private Integer finalMileage;
    
    @NotBlank(message = "Posto Ã© obrigatÃ³rio")
    private String station;
    
    private UUID driverId;
    
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
    private Double pricePerLiter;
} 
