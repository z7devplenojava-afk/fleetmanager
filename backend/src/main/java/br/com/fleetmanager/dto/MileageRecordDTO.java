package br.com.fleetmanager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.MileageRecord;

@Data
@Schema(description = "DTO para transferência de dados de registro de quilometragem")
public class MileageRecordDTO {
    
    @Schema(description = "ID do registro", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;
    
    @NotNull(message = "ID do veículo é obrigatório")
    @Schema(description = "ID do veículo", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID vehicleId;
    
    @NotBlank(message = "Placa do veículo é obrigatória")
    @Schema(description = "Placa do veículo", example = "ABC-1234")
    private String vehiclePlate;
    
    @NotNull(message = "Data é obrigatória")
    @Schema(description = "Data do registro", example = "2024-01-15")
    private LocalDate date;
    
    @NotNull(message = "Quilometragem inicial é obrigatória")
    @Min(value = 0, message = "Quilometragem inicial deve ser maior ou igual a zero")
    @Schema(description = "Quilometragem inicial", example = "45000")
    private Integer initialMileage;
    
    @NotNull(message = "Quilometragem final é obrigatória")
    @Min(value = 0, message = "Quilometragem final deve ser maior ou igual a zero")
    @Schema(description = "Quilometragem final", example = "45250")
    private Integer finalMileage;
    
    @NotNull(message = "Distância percorrida é obrigatória")
    @Min(value = 0, message = "Distância percorrida deve ser maior ou igual a zero")
    @Schema(description = "Distância percorrida em km", example = "250")
    private Integer distanceTraveled;
    
    @NotNull(message = "Combustível consumido é obrigatório")
    @DecimalMin(value = "0.01", message = "Combustível consumido deve ser maior que zero")
    @Schema(description = "Combustível consumido em litros", example = "25.5")
    private BigDecimal fuelConsumed;
    
    @NotNull(message = "Custo do combustível é obrigatório")
    @DecimalMin(value = "0.01", message = "Custo do combustível deve ser maior que zero")
    @Schema(description = "Custo do combustível", example = "150.00")
    private BigDecimal fuelCost;
    
    @Schema(description = "Custo por km", example = "0.60")
    private BigDecimal costPerKm;
    
    @Schema(description = "Consumo médio em km/l", example = "9.8")
    private BigDecimal averageConsumption;
    
    @NotNull(message = "Tipo de viagem é obrigatório")
    @Schema(description = "Tipo de viagem", example = "URBAN")
    private MileageRecord.TripType tripType;
    
    @NotNull(message = "Tipo de combustível é obrigatório")
    @Schema(description = "Tipo de combustível", example = "GASOLINE")
    private MileageRecord.FuelType fuelType;
    
    @Schema(description = "Motorista", example = "João Silva")
    private String driver;
    
    @Schema(description = "Destino", example = "Centro da cidade")
    private String destination;
    
    @Schema(description = "Propósito da viagem", example = "Patrulha de segurança")
    private String purpose;
    
    @Schema(description = "Observações")
    private String notes;
    
    // Campos calculados para exibição
    @Schema(description = "Marca do veículo", example = "Toyota")
    private String vehicleBrand;
    
    @Schema(description = "Modelo do veículo", example = "Corolla")
    private String vehicleModel;
    
    @Schema(description = "Ano do veículo", example = "2020")
    private Integer vehicleYear;
} 