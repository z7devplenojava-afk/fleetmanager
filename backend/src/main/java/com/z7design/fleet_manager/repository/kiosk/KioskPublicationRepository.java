package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPublication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskPublicationRepository extends JpaRepository<KioskPublication, UUID> {

    List<KioskPublication> findByDeviceIdOrderByCreatedAtDesc(UUID deviceId);

    Page<KioskPublication> findByDeviceIdOrderByCreatedAtDesc(UUID deviceId, Pageable pageable);

    Optional<KioskPublication> findFirstByDeviceIdAndStatusOrderByCreatedAtDesc(UUID deviceId, String status);

    List<KioskPublication> findByDeviceIdAndStatus(UUID deviceId, String status);
}

