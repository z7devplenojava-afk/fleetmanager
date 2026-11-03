package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.RentalInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentalInvoiceRepository extends JpaRepository<RentalInvoice, UUID> {

    List<RentalInvoice> findAllByOrderByIssueDateDescCreatedAtDesc();

    List<RentalInvoice> findByClientIdOrderByIssueDateDescCreatedAtDesc(UUID clientId);

    List<RentalInvoice> findByContractIdOrderByIssueDateDescCreatedAtDesc(UUID contractId);

    @Query(value = "select coalesce(max(cast(number as integer)), 0) from rental_invoices where number ~ '^[0-9]+$'", nativeQuery = true)
    Integer findMaxNumericNumber();
}
