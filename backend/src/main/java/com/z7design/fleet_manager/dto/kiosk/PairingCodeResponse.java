package com.z7design.fleet_manager.dto.kiosk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PairingCodeResponse {
    private String pairingCode;
    private LocalDateTime expiresAt;
    private UUID deviceId;
    private String deviceCode;
    private String deviceName;
    private String qrCodeDataUrl;
}

