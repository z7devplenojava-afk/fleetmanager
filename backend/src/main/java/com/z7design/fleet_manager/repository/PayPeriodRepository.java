package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PayPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayPeriodRepository extends JpaRepository<PayPeriod, UUID> {

    List<PayPeriod> findByType(PayPeriod.PeriodType type);

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.referenceYear = :year AND pp.referenceMonth = :month ORDER BY pp.startDate ASC")
    List<PayPeriod> findByReferenceMonthAndYear(@Param("year") int year, @Param("month") int month);

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.referenceYear = :year ORDER BY pp.startDate ASC")
    List<PayPeriod> findByYear(@Param("year") int year);

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.startDate <= :date AND pp.endDate >= :date")
    List<PayPeriod> findPeriodsContainingDate(@Param("date") LocalDate date);

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.startDate >= :startDate AND pp.endDate <= :endDate ORDER BY pp.startDate ASC")
    List<PayPeriod> findPeriodsInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.isClosed = false ORDER BY pp.startDate DESC")
    List<PayPeriod> findOpenPeriods();

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.isClosed = true ORDER BY pp.endDate DESC")
    List<PayPeriod> findClosedPeriods();

    @Query("SELECT pp FROM PayPeriod pp WHERE pp.type = 'MONTHLY' AND pp.referenceYear = :year AND pp.referenceMonth = :month")
    Optional<PayPeriod> findMonthlyPeriod(@Param("year") int year, @Param("month") int month);
}






