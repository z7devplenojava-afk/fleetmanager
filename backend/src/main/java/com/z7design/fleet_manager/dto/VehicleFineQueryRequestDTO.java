package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleFineQueryRequestDTO {

    @NotBlank(message = "A placa do veículo é obrigatória")
    @Pattern(
        regexp = "^[a-zA-Z]{3}-?[0-9][0-9a-zA-Z][0-9]{2}$",
        message = "Placa em formato inválido. Use o formato tradicional (ABC-1234) ou Mercosul (ABC1D23)"
    )
    private String placa;

    private String renavam;

    private String uf;

    private Boolean forceRefresh; // Se true, ignora o cache e força chamada na API externa
}
