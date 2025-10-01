package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.MeasurementBulletin;
import br.com.fleetmanager.model.enums.MeasurementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MeasurementBulletinRepository extends JpaRepository<MeasurementBulletin, UUID> {

    // Buscar por status
    List<MeasurementBulletin> findByStatus(MeasurementStatus status);

    // Buscar por número do contrato
    List<MeasurementBulletin> findByContractNumber(String contractNumber);

    // Buscar por período
    List<MeasurementBulletin> findByPeriodStartBetween(LocalDate startDate, LocalDate endDate);

    // Buscar por cliente
    List<MeasurementBulletin> findByClientId(UUID clientId);

    // Buscar por unidade
    List<MeasurementBulletin> findByUnitId(UUID unitId);

    // Buscar por contrato
    List<MeasurementBulletin> findByContractId(UUID contractId);

    // Busca com filtros múltiplos
    @Query("SELECT mb FROM MeasurementBulletin mb WHERE " +
           "(:status IS NULL OR mb.status = :status) AND " +
           "(:contractNumber IS NULL OR mb.contractNumber LIKE %:contractNumber%) AND " +
           "(:clientId IS NULL OR mb.client.id = :clientId) AND " +
           "(:unitId IS NULL OR mb.unit.id = :unitId) AND " +
           "(:periodStart IS NULL OR mb.periodStart >= :periodStart) AND " +
           "(:periodEnd IS NULL OR mb.periodEnd <= :periodEnd)")
    Page<MeasurementBulletin> findByFilters(
            @Param("status") MeasurementStatus status,
            @Param("contractNumber") String contractNumber,
            @Param("clientId") UUID clientId,
            @Param("unitId") UUID unitId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd,
            Pageable pageable
    );

    // Busca por texto (número NF, elaborado por, medido por)
    @Query("SELECT mb FROM MeasurementBulletin mb WHERE " +
           "mb.nfNumber LIKE %:searchTerm% OR " +
           "mb.elaboratedBy LIKE %:searchTerm% OR " +
           "mb.measuredBy LIKE %:searchTerm% OR " +
           "mb.contractNumber LIKE %:searchTerm%")
    List<MeasurementBulletin> findBySearchTerm(@Param("searchTerm") String searchTerm);

    // Estatísticas por status
    @Query("SELECT mb.status, COUNT(mb), SUM(mb.subtotal) FROM MeasurementBulletin mb GROUP BY mb.status")
    List<Object[]> getStatisticsByStatus();

    // Estatísticas por contrato
    @Query("SELECT mb.contractNumber, COUNT(mb), SUM(mb.subtotal) FROM MeasurementBulletin mb GROUP BY mb.contractNumber")
    List<Object[]> getStatisticsByContract();

    // Valor total por período
    @Query("SELECT SUM(mb.subtotal) FROM MeasurementBulletin mb WHERE " +
           "mb.periodStart >= :startDate AND mb.periodEnd <= :endDate")
    Double getTotalValueByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Valor total por status
    @Query("SELECT SUM(mb.subtotal) FROM MeasurementBulletin mb WHERE mb.status = :status")
    Double getTotalValueByStatus(@Param("status") MeasurementStatus status);

    // Buscar apenas dados básicos dos boletins (sem entidades relacionadas problemáticas)
    @Query("SELECT mb FROM MeasurementBulletin mb " +
           "LEFT JOIN FETCH mb.client " +
           "LEFT JOIN FETCH mb.contract " +
           "LEFT JOIN FETCH mb.unit")
    List<MeasurementBulletin> findAllBasicData();
    
    // Método alternativo mais simples para evitar problemas de lazy loading
    @Query("SELECT mb FROM MeasurementBulletin mb")
    List<MeasurementBulletin> findAllSimple();
}