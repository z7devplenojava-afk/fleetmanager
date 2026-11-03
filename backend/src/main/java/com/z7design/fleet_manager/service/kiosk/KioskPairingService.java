package com.z7design.fleet_manager.service.kiosk;

import com.z7design.fleet_manager.dto.kiosk.PairDeviceRequest;
import com.z7design.fleet_manager.dto.kiosk.PairDeviceResponse;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.model.kiosk.KioskDeviceEvent;
import com.z7design.fleet_manager.model.kiosk.KioskPairingCode;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceEventRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskPairingCodeRepository;
import com.z7design.fleet_manager.security.KioskDeviceTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskPairingService {

    private final KioskPairingCodeRepository pairingCodeRepository;
    private final KioskDeviceRepository deviceRepository;
    private final KioskDeviceTokenService tokenService;
    private final KioskDeviceEventRepository eventRepository;

    @Transactional
    public PairDeviceResponse pair(PairDeviceRequest request) {
        String cleanPin = request.getPairingCode() != null ? request.getPairingCode().trim().toUpperCase() : "";

        KioskPairingCode pairingCode = pairingCodeRepository.findByPairingCodeAndStatus(cleanPin, "ACTIVE")
                .orElseThrow(() -> new BusinessException("Código de pareamento inválido ou expirado."));

        if (pairingCode.isExpired()) {
            pairingCode.setStatus("EXPIRED");
            pairingCodeRepository.save(pairingCode);
            throw new BusinessException("Código de pareamento expirado. Gere um novo código no painel administrativo.");
        }

        if (pairingCode.getAttemptsCount() >= 5) {
            pairingCode.setStatus("BLOCKED");
            pairingCodeRepository.save(pairingCode);
            throw new BusinessException("Limite de tentativas excedido para este código de pareamento.");
        }

        pairingCode.setAttemptsCount(pairingCode.getAttemptsCount() + 1);

        KioskDevice device = deviceRepository.findById(pairingCode.getDeviceId())
                .orElseThrow(() -> new BusinessException("Totem associado a este código não foi encontrado."));

        if ("REVOKED".equalsIgnoreCase(device.getStatus())) {
            throw new BusinessException("Este totem foi revogado pelo administrador e não pode ser pareado.");
        }

        // Marca código como utilizado
        pairingCode.setStatus("USED");
        pairingCodeRepository.save(pairingCode);

        // Gera token exclusivo do totem
        String deviceToken = tokenService.createCredential(device.getId());

        // Atualiza telemetria do dispositivo
        if (request.getPlatform() != null) {
            device.setPlatform(request.getPlatform().toUpperCase());
        }
        if (request.getPlatformVersion() != null) {
            device.setPlatformVersion(request.getPlatformVersion());
        }
        if (request.getPlayerVersion() != null) {
            device.setPlayerVersion(request.getPlayerVersion());
        }
        if (request.getResolutionWidth() != null) {
            device.setResolutionWidth(request.getResolutionWidth());
        }
        if (request.getResolutionHeight() != null) {
            device.setResolutionHeight(request.getResolutionHeight());
        }

        device.setStatus("ONLINE");
        device.setPairedAt(LocalDateTime.now());
        device.setLastHeartbeatAt(LocalDateTime.now());
        device = deviceRepository.save(device);

        // Registra evento de auditoria
        KioskDeviceEvent event = KioskDeviceEvent.builder()
                .deviceId(device.getId())
                .eventType("device_paired")
                .eventPayloadJson("{\"platform\":\"" + device.getPlatform() + "\",\"playerVersion\":\"" + device.getPlayerVersion() + "\"}")
                .occurredAt(LocalDateTime.now())
                .build();
        eventRepository.save(event);

        log.info("✅ Totem {} ({}) pareado com sucesso com token exclusivo!", device.getName(), device.getDeviceCode());

        return PairDeviceResponse.builder()
                .deviceToken(deviceToken)
                .deviceId(device.getId())
                .deviceCode(device.getDeviceCode())
                .name(device.getName())
                .companyId(device.getCompanyId())
                .companyName(device.getCompany() != null ? device.getCompany().getName() : null)
                .clientId(device.getClientId())
                .clientName(device.getClient() != null ? device.getClient().getName() : null)
                .orientation(device.getOrientation())
                .resolutionWidth(device.getResolutionWidth())
                .resolutionHeight(device.getResolutionHeight())
                .wsTopic("/topic/kiosk/" + device.getId())
                .build();
    }
}
