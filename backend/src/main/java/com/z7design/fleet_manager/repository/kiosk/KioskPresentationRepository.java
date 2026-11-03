package com.z7design.fleet_manager.repository.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPresentation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KioskPresentationRepository extends JpaRepository<KioskPresentation, UUID> {

    List<KioskPresentation> findByCompanyId(UUID companyId);

    Page<KioskPresentation> findByCompanyId(UUID companyId, Pageable pageable);

    Page<KioskPresentation> findByCompanyIdAndStatus(UUID companyId, String status, Pageable pageable);

    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndStatus(UUID companyId, String status);
}

