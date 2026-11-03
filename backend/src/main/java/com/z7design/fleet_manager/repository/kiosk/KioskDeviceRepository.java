package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskDeviceRepository extends JpaRepository<KioskDevice, UUID> {

    List<KioskDevice> findByCompanyId(UUID companyId);

    Page<KioskDevice> findByCompanyId(UUID companyId, Pageable pageable);

    List<KioskDevice> findByCompanyIdAndClientId(UUID companyId, UUID clientId);

    Optional<KioskDevice> findByDeviceCode(String deviceCode);

    List<KioskDevice> findByStatus(String status);

    @Query("SELECT d FROM KioskDevice d WHERE d.status = 'ONLINE' AND (d.lastHeartbeatAt IS NULL OR d.lastHeartbeatAt < :threshold)")
    List<KioskDevice> findStaleDevices(@Param("threshold") LocalDateTime threshold);

    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndStatus(UUID companyId, String status);
}

