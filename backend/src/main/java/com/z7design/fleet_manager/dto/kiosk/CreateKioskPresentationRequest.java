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
public class CreateKioskPresentationRequest {
    @NotBlank(message = "O nome da apresentação é obrigatório")
    private String name;
    private String description;
    @Builder.Default
    private Integer idleTimeoutSeconds = 60;
}
