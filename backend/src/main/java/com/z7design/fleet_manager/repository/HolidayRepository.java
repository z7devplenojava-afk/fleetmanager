package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {

    Optional<Holiday> findByDateAndName(LocalDate date, String name);

    List<Holiday> findByDate(LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE h.date >= :startDate AND h.date <= :endDate ORDER BY h.date ASC")
    List<Holiday> findByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Holiday> findByType(Holiday.HolidayType type);

    @Query("SELECT h FROM Holiday h WHERE EXTRACT(YEAR FROM h.date) = :year ORDER BY h.date ASC")
    List<Holiday> findByYear(@Param("year") int year);

    @Query("SELECT h FROM Holiday h WHERE h.date = :date AND (h.type = 'NATIONAL' OR h.isOptional = false)")
    List<Holiday> findNationalAndMandatoryByDate(@Param("date") LocalDate date);

    @Query("SELECT h FROM Holiday h WHERE h.date = :date " +
           "AND (h.type = 'NATIONAL' OR (h.type = 'STATE' AND h.stateCode = :stateCode) " +
           "OR (h.type = 'MUNICIPAL' AND h.cityName = :cityName))")
    List<Holiday> findApplicableHolidays(
            @Param("date") LocalDate date,
            @Param("stateCode") String stateCode,
            @Param("cityName") String cityName);

    boolean existsByDateAndName(LocalDate date, String name);
}






