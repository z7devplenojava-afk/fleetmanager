package com.z7design.fleet_manager.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientSnapshotDTO {
    private String vehicleId;
    private String vehiclePlate;
    private String cameraLabel; // "Câmera Frontal", "Câmera Interna"
    private String imageUrl;
    private LocalDateTime timestamp;
    private String status; // ONLINE, OFFLINE, LOADING
    private Integer batteryLevel; // Simulação de telemetria
    private String lastPosition; // Endereço aproximado
}
