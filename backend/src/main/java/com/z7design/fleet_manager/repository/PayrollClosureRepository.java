package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PayrollClosure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollClosureRepository extends JpaRepository<PayrollClosure, UUID> {

    Optional<PayrollClosure> findByEmployeeIdAndReferenceMonthAndReferenceYear(
            UUID employeeId, Integer month, Integer year);

    Optional<PayrollClosure> findByEmployeeIdAndPayPeriodId(UUID employeeId, UUID payPeriodId);

    List<PayrollClosure> findByReferenceMonthAndReferenceYearOrderByEmployeeNameAsc(
            Integer month, Integer year);
    
    @Query("SELECT pc FROM PayrollClosure pc WHERE pc.payPeriod.id = :payPeriodId")
    List<PayrollClosure> findByPayPeriodId(@Param("payPeriodId") UUID payPeriodId);

    Page<PayrollClosure> findByEmployeeIdOrderByReferenceYearDescReferenceMonthDesc(
            UUID employeeId, Pageable pageable);

    @Query("SELECT pc FROM PayrollClosure pc WHERE pc.status = :status " +
           "ORDER BY pc.referenceYear DESC, pc.referenceMonth DESC")
    Page<PayrollClosure> findByStatus(
            @Param("status") PayrollClosure.ClosureStatus status,
            Pageable pageable);

    @Query("SELECT pc FROM PayrollClosure pc WHERE pc.referenceMonth = :month " +
           "AND pc.referenceYear = :year AND pc.status = 'DRAFT'")
    List<PayrollClosure> findDraftClosuresByMonthYear(
            @Param("month") Integer month,
            @Param("year") Integer year);
}


