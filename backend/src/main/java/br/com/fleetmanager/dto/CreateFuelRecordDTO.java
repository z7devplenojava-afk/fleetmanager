package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.Vehicle;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateFuelRecordDTO {
    
    @NotNull(message = "ID do veículo não pode ser nulo")
    private UUID vehicleId;
    
    @NotNull(message = "Data não pode ser nula")
    private LocalDate date;
    
    @NotNull(message = "Tipo de combustível é obrigatório")
    private Vehicle.FuelType fuelType;
    
    @NotNull(message = "Quantidade é obrigatória")
    @Positive(message = "Quantidade deve ser positiva")
    private Double quantity;
    
    @NotNull(message = "Custo é obrigatório")
    @Positive(message = "Custo deve ser positivo")
    private Double cost;
    
    @NotNull(message = "Quilometragem é obrigatória")
    @PositiveOrZero(message = "Quilometragem não pode ser negativa")
    private Integer mileage;
    
    @PositiveOrZero(message = "Quilometragem inicial não pode ser negativa")
    private Integer initialMileage;
    
    @PositiveOrZero(message = "Quilometragem final não pode ser negativa")
    private Integer finalMileage;
    
    @NotBlank(message = "Posto é obrigatório")
    private String station;
    
    private UUID driverId;
    
    private String notes;

    private String receiptUrl;
    
    private String costCenter;
} 