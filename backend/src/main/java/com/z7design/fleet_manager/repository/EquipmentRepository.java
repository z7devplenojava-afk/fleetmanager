// src/main/java/com.z7design.fleet_manager/repository/EquipmentRepository.java
package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Equipment;
import com.z7design.fleet_manager.model.enums.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, UUID> {
    Optional<Equipment> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<Equipment> findByStatus(EquipmentStatus status);
    long countByStatus(EquipmentStatus status);
    List<Equipment> findByCurrentUserId(UUID currentUserId);
    List<Equipment> findByValidityDateBefore(LocalDate date);
    long countByValidityDateBefore(LocalDate date);
    long countByValidityDateBetween(LocalDate start, LocalDate end);
    List<Equipment> findByWeaponRegistrationValidityBefore(LocalDate date);
    List<Equipment> findByIsDangerous(Boolean isDangerous);
    List<Equipment> findByIsDangerousTrue();
    long countByIsDangerousTrue();
    List<Equipment> findByBatch(String batch);
    List<Equipment> findByModel(String model);
}


