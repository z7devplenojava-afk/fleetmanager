package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.OpacityTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface OpacityTestRepository extends JpaRepository<OpacityTest, UUID> {

    List<OpacityTest> findByVehicleIdOrderByTestDateDesc(UUID vehicleId);

    List<OpacityTest> findByTestDateBetweenOrderByTestDateAsc(LocalDate start, LocalDate end);

    List<OpacityTest> findByVehicleIdAndTestDateBetween(UUID vehicleId, LocalDate start, LocalDate end);

    List<OpacityTest> findByResult(String result);
}
