package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPairingCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskPairingCodeRepository extends JpaRepository<KioskPairingCode, UUID> {

    Optional<KioskPairingCode> findByPairingCode(String pairingCode);

    Optional<KioskPairingCode> findByPairingCodeAndStatus(String pairingCode, String status);

    List<KioskPairingCode> findByDeviceIdAndStatus(UUID deviceId, String status);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}

