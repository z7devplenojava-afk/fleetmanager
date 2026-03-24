package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BankHoursTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BankHoursTransactionRepository extends JpaRepository<BankHoursTransaction, UUID> {

    List<BankHoursTransaction> findByBankHoursIdOrderByTransactionDateDescCreatedAtDesc(UUID bankHoursId);

    @Query("SELECT bht FROM BankHoursTransaction bht WHERE bht.bankHours.employee.id = :employeeId ORDER BY bht.transactionDate DESC, bht.createdAt DESC")
    List<BankHoursTransaction> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT bht FROM BankHoursTransaction bht WHERE bht.sourcePayrollClosure.id = :payrollClosureId")
    List<BankHoursTransaction> findBySourcePayrollClosureId(@Param("payrollClosureId") UUID payrollClosureId);

    @Query("SELECT bht FROM BankHoursTransaction bht WHERE bht.transactionDate >= :startDate AND bht.transactionDate <= :endDate ORDER BY bht.transactionDate DESC")
    List<BankHoursTransaction> findByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<BankHoursTransaction> findByTransactionType(BankHoursTransaction.TransactionType type);
}






