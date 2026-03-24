package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BankHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankHoursRepository extends JpaRepository<BankHours, UUID> {

    Optional<BankHours> findByEmployeeIdAndContractId(UUID employeeId, UUID contractId);

    List<BankHours> findByEmployeeId(UUID employeeId);

    List<BankHours> findByContractId(UUID contractId);

    @Query("SELECT bh FROM BankHours bh WHERE bh.expirationDate IS NOT NULL AND bh.expirationDate <= :date AND bh.balanceHours > 0")
    List<BankHours> findExpiringBalances(@Param("date") LocalDate date);

    @Query("SELECT bh FROM BankHours bh WHERE bh.balanceHours != 0 ORDER BY bh.lastUpdatedAt DESC")
    List<BankHours> findNonZeroBalances();
}






