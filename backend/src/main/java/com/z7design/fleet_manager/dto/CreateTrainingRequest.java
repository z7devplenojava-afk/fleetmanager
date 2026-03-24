package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTrainingRequest {
    
    @NotBlank(message = "Training name is required")
    @Size(min = 3, max = 255, message = "Training name must be between 3 and 255 characters")
    private String name;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    @NotBlank(message = "Provider name is required")
    @Size(min = 3, max = 255, message = "Provider name must be between 3 and 255 characters")
    private String provider;
    
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1")
    private Integer duration;

    @Min(value = 1, message = "Renewal period must be at least 1 month")
    private Integer renewalPeriodMonths = 12;

    private Boolean mandatoryForGuards = Boolean.TRUE;
}

