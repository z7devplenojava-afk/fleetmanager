package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MeasurementContractPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementContractPriceRepository extends JpaRepository<MeasurementContractPrice, UUID> {
    List<MeasurementContractPrice> findByContractId(UUID contractId);

    @Query("SELECT p FROM MeasurementContractPrice p WHERE p.contract.id = :contractId AND p.startValidity <= :date AND (p.endValidity IS NULL OR p.endValidity >= :date)")
    List<MeasurementContractPrice> findActivePricesForDate(@Param("contractId") UUID contractId, @Param("date") LocalDate date);
}
