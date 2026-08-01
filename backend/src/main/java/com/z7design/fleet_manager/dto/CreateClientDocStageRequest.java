package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClientDocStageRequest {
    @NotNull
    private UUID documentationId;

    @NotBlank(message = "Nome da etapa é obrigatório")
    private String name;

    private Integer sortOrder;
}
