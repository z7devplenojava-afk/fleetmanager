package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    /**
     * Retorna somente veículos NÃO excluídos (soft delete) — usada por todas as
     * listagens. Consultas por ID explícitas continuam encontrando o registro
     * para permitir edição/detalhe/reativação futura.
     */
    @Override
    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL")
    List<Vehicle> findAll();

    Optional<Vehicle> findByPlate(String plate);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByFuelType(Vehicle.FuelType fuelType);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND (v.plate LIKE %:searchTerm% OR v.fleetNumber LIKE %:searchTerm% OR v.model LIKE %:searchTerm% OR v.brand LIKE %:searchTerm%)")
    List<Vehicle> findBySearchTerm(@Param("searchTerm") String searchTerm);

    boolean existsByPlate(String plate);

    List<Vehicle> findByVehicleType(Vehicle.VehicleType vehicleType);

    /** Conta apenas veículos ativos (não excluídos) — para dashboards */
    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.deletedAt IS NULL")
    long countActive();

    /** Soft delete — marca a data de exclusão sem remover a linha */
    @Query("UPDATE Vehicle v SET v.deletedAt = CURRENT_TIMESTAMP WHERE v.id = :id AND v.deletedAt IS NULL")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int softDelete(@Param("id") UUID id);

    /** Soft delete em lote — retorna quantos veículos foram marcados como excluídos */
    @Query("UPDATE Vehicle v SET v.deletedAt = CURRENT_TIMESTAMP WHERE v.id IN :ids AND v.deletedAt IS NULL")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int softDeleteAll(@Param("ids") java.util.Collection<UUID> ids);

    /** Restaura um veículo excluído por engano */
    @Query("UPDATE Vehicle v SET v.deletedAt = NULL WHERE v.id = :id")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int restore(@Param("id") UUID id);
}
