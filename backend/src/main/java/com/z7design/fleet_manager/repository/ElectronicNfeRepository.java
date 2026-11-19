package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ElectronicNfe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ElectronicNfeRepository extends JpaRepository<ElectronicNfe, UUID> {

    List<ElectronicNfe> findByCompanyIdOrderByEmissionDateDesc(UUID companyId);

    Optional<ElectronicNfe> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<ElectronicNfe> findByFiscalDocumentId(UUID fiscalDocumentId);

    Optional<ElectronicNfe> findByAccessKey(String accessKey);

    @Query(value = "select max(cast(number as integer)) from electronic_nfes "
            + "where company_id = :companyId and series = :series", nativeQuery = true)
    Integer findMaxNumber(@Param("companyId") UUID companyId, @Param("series") String series);
}
