package com.z7design.fleet_manager.dto.kiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.kiosk.KioskDeviceEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KioskDeviceEventDTO {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private UUID id;
    private UUID deviceId;
    private String eventType;
    private Map<String, Object> eventPayload;
    private LocalDateTime occurredAt;
    private LocalDateTime receivedAt;

    public static KioskDeviceEventDTO fromEntity(KioskDeviceEvent event) {
        if (event == null) return null;
        return KioskDeviceEventDTO.builder()
                .id(event.getId())
                .deviceId(event.getDeviceId())
                .eventType(event.getEventType())
                .eventPayload(parsePayload(event.getEventPayloadJson()))
                .occurredAt(event.getOccurredAt())
                .receivedAt(event.getReceivedAt())
                .build();
    }

    private static Map<String, Object> parsePayload(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return MAPPER.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of("raw", json);
        }
    }
}
