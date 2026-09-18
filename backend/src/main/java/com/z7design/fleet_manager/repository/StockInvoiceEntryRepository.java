package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StockInvoiceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockInvoiceEntryRepository extends JpaRepository<StockInvoiceEntry, UUID> {

    List<StockInvoiceEntry> findByCompanyIdOrderByEntryDateDesc(UUID companyId);

    List<StockInvoiceEntry> findByRequisitionId(UUID requisitionId);

    Optional<StockInvoiceEntry> findByIdAndCompanyId(UUID id, UUID companyId);
}
