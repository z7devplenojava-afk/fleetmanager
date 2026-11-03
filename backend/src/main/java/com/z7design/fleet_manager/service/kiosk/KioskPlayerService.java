package com.z7design.fleet_manager.service.kiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.kiosk.DeviceHeartbeatRequest;
import com.z7design.fleet_manager.dto.kiosk.DeviceHeartbeatResponse;
import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.model.kiosk.KioskDeviceEvent;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceEventRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskPlayerService {

    private final KioskDeviceRepository deviceRepository;
    private final KioskDeviceEventRepository eventRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public DeviceHeartbeatResponse recordHeartbeat(KioskDevice device, DeviceHeartbeatRequest request) {
        device.setLastHeartbeatAt(LocalDateTime.now());
        device.setStatus("ONLINE");

        if (request != null) {
            if (request.getPlayerVersion() != null && !request.getPlayerVersion().isBlank()) {
                device.setPlayerVersion(request.getPlayerVersion());
            }
            if (request.getActiveVersionId() != null) {
                device.setActivePresentationVersionId(request.getActiveVersionId());
            }
        }

        device = deviceRepository.save(device);

        // Verifica se há atualização pendente para este totem
        boolean syncNeeded = false;
        UUID desiredVersionId = device.getDesiredPresentationVersionId();
        if (desiredVersionId != null && !desiredVersionId.equals(device.getActivePresentationVersionId())) {
            syncNeeded = true;
        }

        return DeviceHeartbeatResponse.builder()
                .status("ONLINE")
                .desiredVersionId(desiredVersionId)
                .syncNeeded(syncNeeded)
                .serverTime(LocalDateTime.now())
                .build();
    }

    @Transactional
    public void recordEvent(KioskDevice device, String eventType, Map<String, Object> payload) {
        String payloadJson = "{}";
        if (payload != null && !payload.isEmpty()) {
            try {
                payloadJson = objectMapper.writeValueAsString(payload);
            } catch (Exception e) {
                log.warn("Erro ao serializar payload de evento do totem {}: {}", device.getId(), e.getMessage());
            }
        }

        KioskDeviceEvent event = KioskDeviceEvent.builder()
                .deviceId(device.getId())
                .eventType(eventType)
                .eventPayloadJson(payloadJson)
                .occurredAt(LocalDateTime.now())
                .build();

        eventRepository.save(event);
    }
}
