package com.z7design.fleet_manager.scheduler;

import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.repository.kiosk.KioskDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class KioskOfflineDetectionJob {

    private final KioskDeviceRepository deviceRepository;

    /**
     * Verifica a cada 60 segundos se algum totem perdeu a comunicação (heartbeat > 90s).
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    @Transactional
    public void detectOfflineKiosks() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(90);
        List<KioskDevice> staleDevices = deviceRepository.findStaleDevices(threshold);

        if (!staleDevices.isEmpty()) {
            for (KioskDevice device : staleDevices) {
                device.setStatus("OFFLINE");
                log.info("⚠️ Totem {} ({}) marcado como OFFLINE por ausência de heartbeat", device.getName(), device.getDeviceCode());
            }
            deviceRepository.saveAll(staleDevices);
        }
    }
}
