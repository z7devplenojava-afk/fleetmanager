package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPresentationVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskPresentationVersionRepository extends JpaRepository<KioskPresentationVersion, UUID> {

    List<KioskPresentationVersion> findByPresentationIdOrderByVersionNumberDesc(UUID presentationId);

    Optional<KioskPresentationVersion> findByPresentationIdAndVersionNumber(UUID presentationId, Integer versionNumber);

    @Query("SELECT MAX(v.versionNumber) FROM KioskPresentationVersion v WHERE v.presentationId = :presentationId")
    Optional<Integer> findMaxVersionNumber(@Param("presentationId") UUID presentationId);
}

