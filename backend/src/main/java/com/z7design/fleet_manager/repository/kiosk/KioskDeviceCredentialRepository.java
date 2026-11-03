package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskDeviceCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskDeviceCredentialRepository extends JpaRepository<KioskDeviceCredential, UUID> {

    Optional<KioskDeviceCredential> findByDeviceId(UUID deviceId);

    Optional<KioskDeviceCredential> findByTokenHash(String tokenHash);

    Optional<KioskDeviceCredential> findByTokenHashAndStatus(String tokenHash, String status);

    void deleteByDeviceId(UUID deviceId);
}

