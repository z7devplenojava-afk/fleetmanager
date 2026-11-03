package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskMediaAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KioskMediaAssetRepository extends JpaRepository<KioskMediaAsset, UUID> {

    List<KioskMediaAsset> findByCompanyId(UUID companyId);

    Page<KioskMediaAsset> findByCompanyId(UUID companyId, Pageable pageable);

    Page<KioskMediaAsset> findByCompanyIdAndMediaType(UUID companyId, String mediaType, Pageable pageable);

    Optional<KioskMediaAsset> findByCompanyIdAndChecksumSha256(UUID companyId, String checksumSha256);

    long countByCompanyId(UUID companyId);
}

