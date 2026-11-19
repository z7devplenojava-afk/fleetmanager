package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ServiceInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceInvoiceRepository extends JpaRepository<ServiceInvoice, UUID> {

    List<ServiceInvoice> findByCompanyIdOrderByEmissionDateDesc(UUID companyId);

    List<ServiceInvoice> findByCompanyIdAndStatusOrderByEmissionDateAsc(UUID companyId, String status);

    Optional<ServiceInvoice> findByFiscalDocumentId(UUID fiscalDocumentId);

    @Query(value = "select max(cast(number as integer)) from service_invoices where company_id = :companyId and series = :series", nativeQuery = true)
    Integer findMaxNumber(@Param("companyId") UUID companyId, @Param("series") String series);

    @Query("select max(i.dpsNumber) from ServiceInvoice i where i.companyId = :companyId and i.series = :series")
    Long findMaxDpsNumber(@Param("companyId") UUID companyId, @Param("series") String series);

    Optional<ServiceInvoice> findByIdAndCompanyId(UUID id, UUID companyId);
}
