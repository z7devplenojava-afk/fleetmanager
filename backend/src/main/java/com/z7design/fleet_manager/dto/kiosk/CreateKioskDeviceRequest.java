package com.z7design.fleet_manager.dto.kiosk;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateKioskDeviceRequest {

    @NotBlank(message = "O nome do totem é obrigatório")
    private String name;

    private String description;

    /**
     * Opcional: Totem pode ser associado a um cliente específico da empresa
     */
    private UUID clientId;

    @Builder.Default
    private String platform = "ANDROID";

    @Builder.Default
    private Integer resolutionWidth = 1080;

    @Builder.Default
    private Integer resolutionHeight = 1920;

    @Builder.Default
    private String orientation = "PORTRAIT";
}
