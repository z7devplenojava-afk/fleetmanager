package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskDeviceEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface KioskDeviceEventRepository extends JpaRepository<KioskDeviceEvent, UUID> {

    List<KioskDeviceEvent> findByDeviceIdOrderByOccurredAtDesc(UUID deviceId);

    Page<KioskDeviceEvent> findByDeviceIdOrderByOccurredAtDesc(UUID deviceId, Pageable pageable);

    Page<KioskDeviceEvent> findByDeviceIdAndEventTypeOrderByOccurredAtDesc(UUID deviceId, String eventType, Pageable pageable);

    void deleteByOccurredAtBefore(LocalDateTime threshold);
}

