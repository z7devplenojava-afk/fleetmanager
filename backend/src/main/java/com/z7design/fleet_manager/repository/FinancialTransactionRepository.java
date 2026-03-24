package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
    
    // Buscar por unidade
    List<FinancialTransaction> findByUnitId(UUID unitId);
    
    // Buscar por unidade e tipo
    List<FinancialTransaction> findByUnitIdAndType(UUID unitId, String type);
    
    // Buscar por unidade e status
    List<FinancialTransaction> findByUnitIdAndStatus(UUID unitId, String status);
    
    // Buscar por unidade e categoria
    List<FinancialTransaction> findByUnitIdAndCategory(UUID unitId, String category);
    
    // Buscar por unidade e data
    List<FinancialTransaction> findByUnitIdAndDate(UUID unitId, LocalDate date);
    
    // Buscar por unidade e perÃ­odo
    List<FinancialTransaction> findByUnitIdAndDateBetween(UUID unitId, LocalDate startDate, LocalDate endDate);
    
    // Buscar por mÃºltiplas unidades
    List<FinancialTransaction> findByUnitIdIn(List<UUID> unitIds);
    
    // Buscar por mÃºltiplas unidades e tipo
    List<FinancialTransaction> findByUnitIdInAndType(List<UUID> unitIds, String type);
    
    // Buscar por mÃºltiplas unidades e perÃ­odo
    List<FinancialTransaction> findByUnitIdInAndDateBetween(List<UUID> unitIds, LocalDate startDate, LocalDate endDate);
    
    // Calcular total por unidade e tipo
    @Query("SELECT SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.unit.id = :unitId AND ft.type = :type")
    Double sumAmountByUnitAndType(@Param("unitId") UUID unitId, @Param("type") String type);
    
    // Calcular total por unidade e perÃ­odo
    @Query("SELECT SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.unit.id = :unitId AND ft.date BETWEEN :startDate AND :endDate")
    Double sumAmountByUnitAndPeriod(@Param("unitId") UUID unitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Calcular total por mÃºltiplas unidades e perÃ­odo
    @Query("SELECT SUM(ft.amount) FROM FinancialTransaction ft WHERE ft.unit.id IN :unitIds AND ft.date BETWEEN :startDate AND :endDate")
    Double sumAmountByUnitsAndPeriod(@Param("unitIds") List<UUID> unitIds, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ft FROM FinancialTransaction ft JOIN FETCH ft.unit WHERE ft.id = :id")
    FinancialTransaction findByIdWithUnit(@Param("id") UUID id);
    
    // Buscar todas as transaÃ§Ãµes com fornecedor carregado
    @Query("SELECT ft FROM FinancialTransaction ft LEFT JOIN FETCH ft.supplier LEFT JOIN FETCH ft.unit")
    List<FinancialTransaction> findAllWithSupplier();
    
    // Buscar transaÃ§Ãµes por unidade com fornecedor carregado
    @Query("SELECT ft FROM FinancialTransaction ft LEFT JOIN FETCH ft.supplier LEFT JOIN FETCH ft.unit WHERE ft.unit.id = :unitId")
    List<FinancialTransaction> findByUnitIdWithSupplier(@Param("unitId") UUID unitId);
} 
