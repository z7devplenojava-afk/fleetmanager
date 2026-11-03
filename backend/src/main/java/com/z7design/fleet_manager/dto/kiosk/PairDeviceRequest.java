package com.z7design.fleet_manager.dto.kiosk;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PairDeviceRequest {

    @NotBlank(message = "O código de pareamento é obrigatório")
    private String pairingCode;

    private String platform;

    private String platformVersion;

    private String playerVersion;

    private Integer resolutionWidth;

    private Integer resolutionHeight;
}

