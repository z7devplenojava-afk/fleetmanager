package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ParteDiaria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ParteDiariaRepository extends JpaRepository<ParteDiaria, UUID> {
    List<ParteDiaria> findByDateBetween(LocalDate start, LocalDate end);
    List<ParteDiaria> findByContractIdAndDateBetween(UUID contractId, LocalDate start, LocalDate end);
    List<ParteDiaria> findByVehiclePlateAndDateBetween(String vehiclePlate, LocalDate start, LocalDate end);

    @Query("SELECT p FROM ParteDiaria p WHERE p.contract.id = :contractId AND p.date >= :start AND p.date <= :end AND p.status IN ('LANÇADA', 'VALIDADA')")
    List<ParteDiaria> findValidPartesForMeasurement(@Param("contractId") UUID contractId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
