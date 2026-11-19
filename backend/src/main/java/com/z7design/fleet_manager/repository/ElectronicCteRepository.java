package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ElectronicCte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ElectronicCteRepository extends JpaRepository<ElectronicCte, UUID> {

    List<ElectronicCte> findByCompanyIdOrderByEmissionDateDesc(UUID companyId);

    Optional<ElectronicCte> findByFiscalDocumentId(UUID fiscalDocumentId);

    @Query(value = "select max(cast(number as integer)) from electronic_ctes where company_id = :companyId and series = :series", nativeQuery = true)
    Integer findMaxNumber(@Param("companyId") UUID companyId, @Param("series") String series);
}
