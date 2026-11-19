package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FiscalCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FiscalCertificateRepository extends JpaRepository<FiscalCertificate, UUID> {

    List<FiscalCertificate> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    Optional<FiscalCertificate> findByCompanyIdAndActiveTrue(UUID companyId);

    Optional<FiscalCertificate> findByIdAndCompanyId(UUID id, UUID companyId);

    @Modifying(clearAutomatically = true)
    @Query("update FiscalCertificate c set c.active = false where c.companyId = :companyId and c.active = true")
    void deactivateAll(@Param("companyId") UUID companyId);
}
