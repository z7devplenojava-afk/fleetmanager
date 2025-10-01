package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Equipment;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    
    List<Equipment> findByCurrentUserId(UUID currentUserId);
    
    List<Equipment> findByIsDangerousTrue();
    
    List<Equipment> findByValidityDateBefore(LocalDate date);
    
    List<Equipment> findByValidityDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Equipment> findByWeaponRegistrationValidityBefore(LocalDate date);
    
    List<Equipment> findByProtectionLevel(String protectionLevel);
    
    List<Equipment> findByBatch(String batch);
    
    List<Equipment> findByModel(String model);
    
    @Query("SELECT e FROM Equipment e WHERE e.validityDate < CURRENT_DATE")
    List<Equipment> findExpiredEquipments();
    
    @Query("SELECT e FROM Equipment e WHERE e.validityDate BETWEEN CURRENT_DATE AND :alertDate")
    List<Equipment> findEquipmentsExpiringSoon(@Param("alertDate") LocalDate alertDate);
    
    @Query("SELECT e FROM Equipment e WHERE e.weaponRegistrationValidity < CURRENT_DATE")
    List<Equipment> findExpiredWeaponRegistrations();
    
    @Query("SELECT e FROM Equipment e WHERE e.weaponRegistrationValidity BETWEEN CURRENT_DATE AND :alertDate")
    List<Equipment> findWeaponRegistrationsExpiringSoon(@Param("alertDate") LocalDate alertDate);
    
    // Contadores
    long countByStatus(EquipmentStatus status);
    
    long countByIsDangerousTrue();
    
    long countByValidityDateBefore(LocalDate date);
    
    long countByValidityDateBetween(LocalDate startDate, LocalDate endDate);
    
    long countByWeaponRegistrationValidityBefore(LocalDate date);
    
    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.currentUserId IS NOT NULL")
    long countAssignedEquipments();
    
    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.currentUserId IS NULL")
    long countUnassignedEquipments();
}