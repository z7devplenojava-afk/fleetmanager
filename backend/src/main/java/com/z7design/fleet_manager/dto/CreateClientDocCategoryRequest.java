package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClientDocCategoryRequest {
    @NotBlank(message = "Nome da categoria é obrigatório")
    private String name;

    private String description;
}
