package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.MileageRecord;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Schema(description = "DTO para transferÃªncia de dados de registro de quilometragem")
public class MileageRecordDTO {
    
    @Schema(description = "ID do registro", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @NotNull(message = "ID do veÃ­culo Ã© obrigatÃ³rio")
    @Schema(description = "ID do veÃ­culo", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID vehicleId;
    
    @NotBlank(message = "Placa do veÃ­culo Ã© obrigatÃ³ria")
    @Schema(description = "Placa do veÃ­culo", example = "ABC-1234")
    private String vehiclePlate;
    
    @NotNull(message = "Data Ã© obrigatÃ³ria")
    @Schema(description = "Data do registro", example = "2024-01-15")
    private LocalDate date;
    
    @NotNull(message = "Quilometragem inicial Ã© obrigatÃ³ria")
    @Min(value = 0, message = "Quilometragem inicial deve ser maior ou igual a zero")
    @Schema(description = "Quilometragem inicial", example = "45000")
    private Integer initialMileage;
    
    @NotNull(message = "Quilometragem final Ã© obrigatÃ³ria")
    @Min(value = 0, message = "Quilometragem final deve ser maior ou igual a zero")
    @Schema(description = "Quilometragem final", example = "45250")
    private Integer finalMileage;
    
    @NotNull(message = "DistÃ¢ncia percorrida Ã© obrigatÃ³ria")
    @Min(value = 0, message = "DistÃ¢ncia percorrida deve ser maior ou igual a zero")
    @Schema(description = "DistÃ¢ncia percorrida em km", example = "250")
    private Integer distanceTraveled;
    
    @NotNull(message = "CombustÃ­vel consumido Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.01", message = "CombustÃ­vel consumido deve ser maior que zero")
    @Schema(description = "CombustÃ­vel consumido em litros", example = "25.5")
    private BigDecimal fuelConsumed;
    
    @NotNull(message = "Custo do combustÃ­vel Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.01", message = "Custo do combustÃ­vel deve ser maior que zero")
    @Schema(description = "Custo do combustÃ­vel", example = "150.00")
    private BigDecimal fuelCost;
    
    @Schema(description = "Custo por km", example = "0.60")
    private BigDecimal costPerKm;
    
    @Schema(description = "Consumo mÃ©dio em km/l", example = "9.8")
    private BigDecimal averageConsumption;
    
    @NotNull(message = "Tipo de viagem Ã© obrigatÃ³rio")
    @Schema(description = "Tipo de viagem", example = "URBAN")
    private MileageRecord.TripType tripType;
    
    @NotNull(message = "Tipo de combustÃ­vel Ã© obrigatÃ³rio")
    @Schema(description = "Tipo de combustÃ­vel", example = "GASOLINE")
    private MileageRecord.FuelType fuelType;
    
    @Schema(description = "Motorista", example = "JoÃ£o Silva")
    private String driver;
    
    @Schema(description = "Destino", example = "Centro da cidade")
    private String destination;
    
    @Schema(description = "PropÃ³sito da viagem", example = "Patrulha de seguranÃ§a")
    private String purpose;
    
    @Schema(description = "ObservaÃ§Ãµes")
    private String notes;
    
    // Campos calculados para exibiÃ§Ã£o
    @Schema(description = "Marca do veÃ­culo", example = "Toyota")
    private String vehicleBrand;
    
    @Schema(description = "Modelo do veÃ­culo", example = "Corolla")
    private String vehicleModel;
    
    @Schema(description = "Ano do veÃ­culo", example = "2020")
    private Integer vehicleYear;
} 
