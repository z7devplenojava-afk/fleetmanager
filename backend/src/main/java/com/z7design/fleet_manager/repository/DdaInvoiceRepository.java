package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DdaInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DdaInvoiceRepository extends JpaRepository<DdaInvoice, UUID> {

    List<DdaInvoice> findByCompanyIdOrderByDueDateAsc(UUID companyId);

    List<DdaInvoice> findByCompanyIdAndStatusOrderByDueDateAsc(UUID companyId, String status);

    Optional<DdaInvoice> findByBarcodeAndCompanyId(String barcode, UUID companyId);

    List<DdaInvoice> findByIssuerCnpjAndAmountAndDueDate(String issuerCnpj, BigDecimal amount, LocalDate dueDate);
}
