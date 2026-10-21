package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.tenant.TenantContext;
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

    /**
     * Retorna todos os veículos brutos do banco de dados (ignorando soft delete e filtros de tenant).
     * Usado para sincronização, importação de planilhas e evitar violação de unicidade de placa.
     */
    @Query(value = "SELECT * FROM vehicles", nativeQuery = true)
    List<Vehicle> findAllRawIncludingDeletedAndTenants();

    @Query(value = "SELECT * FROM vehicles WHERE UPPER(REPLACE(REPLACE(plate, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(:plate, '-', ''), ' ', '')) " +
            "AND (CAST(:companyId AS uuid) IS NULL OR company_id = CAST(:companyId AS uuid)) LIMIT 1", nativeQuery = true)
    Optional<Vehicle> findByPlateRawScoped(@Param("plate") String plate, @Param("companyId") UUID companyId);

    default Optional<Vehicle> findByPlateRaw(String plate) {
        return findByPlateRawScoped(plate, TenantContext.get());
    }

    Optional<Vehicle> findByPlate(String plate);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.companyId = :companyId")
    List<Vehicle> findByCompanyId(@Param("companyId") UUID companyId);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.companyId = :companyId AND UPPER(REPLACE(REPLACE(v.plate, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(:plate, '-', ''), ' ', ''))")
    Optional<Vehicle> findByPlateAndCompanyId(@Param("plate") String plate, @Param("companyId") UUID companyId);

    /** Veículos alocados em uma garagem (nova referência garage_id). */
    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.garageId = :garageId ORDER BY v.plate")
    List<Vehicle> findByGarageId(@Param("garageId") UUID garageId);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.status = :status AND v.companyId = :companyId")
    List<Vehicle> findByStatusAndCompanyId(@Param("status") Vehicle.VehicleStatus status, @Param("companyId") UUID companyId);

    List<Vehicle> findByFuelType(Vehicle.FuelType fuelType);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.fuelType = :fuelType AND v.companyId = :companyId")
    List<Vehicle> findByFuelTypeAndCompanyId(@Param("fuelType") Vehicle.FuelType fuelType, @Param("companyId") UUID companyId);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND (v.plate LIKE %:searchTerm% OR v.fleetNumber LIKE %:searchTerm% OR v.model LIKE %:searchTerm% OR v.brand LIKE %:searchTerm%)")
    List<Vehicle> findBySearchTerm(@Param("searchTerm") String searchTerm);

    @Query("SELECT v FROM Vehicle v WHERE v.deletedAt IS NULL AND v.companyId = :companyId AND (v.plate LIKE %:searchTerm% OR v.fleetNumber LIKE %:searchTerm% OR v.model LIKE %:searchTerm% OR v.brand LIKE %:searchTerm%)")
    List<Vehicle> findBySearchTermAndCompanyId(@Param("searchTerm") String searchTerm, @Param("companyId") UUID companyId);

    boolean existsByPlate(String plate);

    List<Vehicle> findByVehicleType(Vehicle.VehicleType vehicleType);

    /** Conta apenas veículos ativos (não excluídos) — para dashboards */
    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.deletedAt IS NULL AND v.companyId = :companyId")
    long countActiveByCompanyId(@Param("companyId") UUID companyId);

    /** Soft delete — marca a data de exclusão sem remover a linha */
    @Query("UPDATE Vehicle v SET v.deletedAt = CURRENT_TIMESTAMP WHERE v.id = :id AND v.deletedAt IS NULL " +
            "AND (:companyId IS NULL OR v.companyId = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int softDeleteScoped(@Param("id") UUID id, @Param("companyId") UUID companyId);

    default int softDelete(UUID id) {
        return softDeleteScoped(id, TenantContext.get());
    }

    /** Soft delete em lote — retorna quantos veículos foram marcados como excluídos */
    @Query("UPDATE Vehicle v SET v.deletedAt = CURRENT_TIMESTAMP WHERE v.id IN :ids AND v.deletedAt IS NULL " +
            "AND (:companyId IS NULL OR v.companyId = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int softDeleteAllScoped(@Param("ids") java.util.Collection<UUID> ids, @Param("companyId") UUID companyId);

    default int softDeleteAll(java.util.Collection<UUID> ids) {
        return softDeleteAllScoped(ids, TenantContext.get());
    }

    /** Restaura um veículo excluído por engano */
    @Query("UPDATE Vehicle v SET v.deletedAt = NULL WHERE v.id = :id " +
            "AND (:companyId IS NULL OR v.companyId = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int restoreScoped(@Param("id") UUID id, @Param("companyId") UUID companyId);

    default int restore(UUID id) {
        return restoreScoped(id, TenantContext.get());
    }

    /** Desvincula veículos associados a postos de trabalho que serão excluídos */
    @Query("UPDATE Vehicle v SET v.workPostId = NULL, v.workPostEntity = NULL, v.clientName = NULL " +
            "WHERE v.workPostId IN :workPostIds AND (:companyId IS NULL OR v.companyId = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int clearWorkPostAllocationScoped(@Param("workPostIds") java.util.Collection<UUID> workPostIds,
            @Param("companyId") UUID companyId);

    default int clearWorkPostAllocation(java.util.Collection<UUID> workPostIds) {
        return clearWorkPostAllocationScoped(workPostIds, TenantContext.get());
    }

    /** Desvincula veículos com o nome do cliente que será excluído */
    @Query("UPDATE Vehicle v SET v.clientName = NULL WHERE v.clientName = :clientName " +
            "AND (:companyId IS NULL OR v.companyId = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    int clearClientNameAllocationScoped(@Param("clientName") String clientName, @Param("companyId") UUID companyId);

    default int clearClientNameAllocation(String clientName) {
        return clearClientNameAllocationScoped(clientName, TenantContext.get());
    }
}
