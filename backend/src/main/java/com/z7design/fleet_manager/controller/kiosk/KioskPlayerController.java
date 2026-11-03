package com.z7design.fleet_manager.controller.kiosk;

import com.z7design.fleet_manager.dto.kiosk.DeviceHeartbeatRequest;
import com.z7design.fleet_manager.dto.kiosk.DeviceHeartbeatResponse;
import com.z7design.fleet_manager.dto.kiosk.PairDeviceRequest;
import com.z7design.fleet_manager.dto.kiosk.PairDeviceResponse;
import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.security.KioskDeviceAuthentication;
import com.z7design.fleet_manager.service.kiosk.KioskPairingService;
import com.z7design.fleet_manager.service.kiosk.KioskPlayerService;
import com.z7design.fleet_manager.service.kiosk.KioskMediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/player")
@RequiredArgsConstructor
@Tag(name = "Kiosk Player API", description = "Endpoints consumidos diretamente pelos totens executando o runtime do player")
public class KioskPlayerController {

    private final KioskPairingService pairingService;
    private final KioskPlayerService playerService;
    private final KioskMediaService mediaService;
    private final com.z7design.fleet_manager.service.kiosk.KioskPresentationService presentationService;

    @PostMapping("/pair")
    @Operation(summary = "Parear totem com código temporário e receber token de dispositivo")
    public ResponseEntity<PairDeviceResponse> pairDevice(@Valid @RequestBody PairDeviceRequest request) {
        log.info("📡 Requisição de pareamento recebida com PIN");
        return ResponseEntity.ok(pairingService.pair(request));
    }

    @PostMapping("/heartbeat")
    @Operation(summary = "Enviar heartbeat e telemetria do totem conectado")
    public ResponseEntity<DeviceHeartbeatResponse> heartbeat(
            Authentication authentication,
            @RequestBody(required = false) DeviceHeartbeatRequest request) {

        KioskDevice device = getAuthenticatedDevice(authentication);
        return ResponseEntity.ok(playerService.recordHeartbeat(device, request));
    }

    @PostMapping("/events")
    @Operation(summary = "Registrar eventos operacionais ou de interação do totem")
    public ResponseEntity<Void> logEvent(
            Authentication authentication,
            @RequestBody Map<String, Object> eventData) {

        KioskDevice device = getAuthenticatedDevice(authentication);
        String eventType = (String) eventData.getOrDefault("eventType", "unknown_event");
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) eventData.getOrDefault("payload", Map.of());

        playerService.recordEvent(device, eventType, payload);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/media/{id}/content")
    @Operation(summary = "Download de arquivo de mídia para cache offline do totem")
    public ResponseEntity<org.springframework.core.io.Resource> getMediaContent(
            Authentication authentication,
            @PathVariable java.util.UUID id) {
        KioskDevice device = getAuthenticatedDevice(authentication);
        com.z7design.fleet_manager.model.kiosk.KioskMediaAsset asset = mediaService.getMediaAssetEntity(id);

        // Garantir que a mídia pertence à mesma empresa do totem
        if (!asset.getCompanyId().equals(device.getCompanyId())) {
            throw new org.springframework.security.access.AccessDeniedException("Totem não tem permissão para acessar esta mídia.");
        }

        org.springframework.core.io.Resource resource = mediaService.loadFileAsResource(id);
        String contentType = asset.getMimeType() != null ? asset.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + asset.getName() + "\"")
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=604800, immutable")
                .header("ETag", "\"" + asset.getChecksumSha256() + "\"")
                .body(resource);
    }

    @GetMapping("/manifest")
    @Operation(summary = "Obter o manifesto JSON da apresentação ativa ou desejada para este totem")
    public ResponseEntity<Map<String, Object>> getManifest(Authentication authentication) {
        KioskDevice device = getAuthenticatedDevice(authentication);
        return ResponseEntity.ok(presentationService.getManifestForDevice(device));
    }

    private KioskDevice getAuthenticatedDevice(Authentication authentication) {
        if (authentication instanceof KioskDeviceAuthentication deviceAuth) {
            return deviceAuth.getDevice();
        }
        if (authentication != null && authentication.getPrincipal() instanceof KioskDevice device) {
            return device;
        }
        throw new IllegalStateException("Nenhum totem autenticado na sessão atual.");
    }
}
