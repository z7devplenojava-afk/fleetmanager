package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
// import com.z7design.fleet_manager.model.enums.EPICategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de EPIs
 */
@Repository
public interface PersonalProtectiveEquipmentRepository extends JpaRepository<PersonalProtectiveEquipment, UUID> {

    /**
     * Busca EPIs por categoria
     */
    // List<PersonalProtectiveEquipment> findByCategory(EPICategory category);

    /**
     * Busca EPIs ativos
     */
    List<PersonalProtectiveEquipment> findByIsActiveTrue();

    /**
     * Busca EPIs por categoria e status ativo
     */
    // List<PersonalProtectiveEquipment> findByCategoryAndIsActiveTrue(EPICategory category);

    /**
     * Busca EPIs com estoque baixo
     */
    @Query("SELECT e FROM PersonalProtectiveEquipment e WHERE e.currentStock <= e.minimumStock AND e.isActive = true")
    List<PersonalProtectiveEquipment> findWithLowStock();

    /**
     * Busca EPIs com CA vencido ou prÃ³ximo do vencimento
     */
    @Query("SELECT e FROM PersonalProtectiveEquipment e WHERE e.caValidity <= :date AND e.isActive = true")
    List<PersonalProtectiveEquipment> findWithExpiredOrExpiringCA(@Param("date") LocalDate date);

    /**
     * Busca EPIs por nome (case insensitive)
     */
    @Query("SELECT e FROM PersonalProtectiveEquipment e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<PersonalProtectiveEquipment> findByNameContainingIgnoreCase(@Param("name") String name);

    /**
     * Busca EPIs por fabricante
     */
    List<PersonalProtectiveEquipment> findByManufacturerContainingIgnoreCase(String manufacturer);

    /**
     * Verifica se existe EPI com o mesmo nome
     */
    boolean existsByName(String name);

    /**
     * Verifica se existe EPI com o mesmo nome excluindo um ID especÃ­fico
     */
    boolean existsByNameAndIdNot(String name, UUID id);

    /**
     * Busca EPIs por nÃºmero do CA
     */
    List<PersonalProtectiveEquipment> findByCaNumber(String caNumber);
}

