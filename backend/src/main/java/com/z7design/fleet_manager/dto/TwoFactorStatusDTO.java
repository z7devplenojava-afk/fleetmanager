package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorStatusDTO {
    private boolean enabled;
    private boolean firstAccess;
    private String whatsappNumber;
    private String message;
}


