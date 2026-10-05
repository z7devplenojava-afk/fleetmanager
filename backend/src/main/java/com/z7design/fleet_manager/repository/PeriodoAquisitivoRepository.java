package com.z7design.fleet_manager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoStatus;

@Repository
public interface PeriodoAquisitivoRepository extends JpaRepository<PeriodoAquisitivo, UUID> {

    List<PeriodoAquisitivo> findByEmployeeIdOrderByDataInicioDesc(UUID employeeId);

    @Query("SELECT p FROM PeriodoAquisitivo p LEFT JOIN FETCH p.employee " +
           "WHERE p.employee.id = :employeeId AND p.status = :status")
    List<PeriodoAquisitivo> findByEmployeeIdAndStatus(
            @Param("employeeId") UUID employeeId,
            @Param("status") PeriodoAquisitivoStatus status);

    /**
     * PA vigente do colaborador: o unico EM_ANDAMENTO, ou, na ausencia,
     * o CONCESSIVO mais recente (ultimo PA que ainda pode ser concedido).
     */
    @Query("SELECT p FROM PeriodoAquisitivo p LEFT JOIN FETCH p.employee " +
           "WHERE p.employee.id = :employeeId " +
           "ORDER BY " +
           "  CASE WHEN p.status = 'EM_ANDAMENTO' THEN 0 " +
           "       WHEN p.status = 'CONCESSIVO' THEN 1 " +
           "       WHEN p.status = 'QUITADO' THEN 2 " +
           "       ELSE 3 END, p.dataInicio DESC")
    List<PeriodoAquisitivo> findVigentesByEmployeeId(@Param("employeeId") UUID employeeId);

    Optional<PeriodoAquisitivo> findByEmployeeIdAndDataInicio(UUID employeeId, LocalDate dataInicio);

    @Query("SELECT p FROM PeriodoAquisitivo p LEFT JOIN FETCH p.employee " +
           "WHERE p.status IN (:statuses) AND p.limiteConcessivo <= :limite")
    List<PeriodoAquisitivo> findByStatusInAndLimiteConcessivoBefore(
            @Param("statuses") List<PeriodoAquisitivoStatus> statuses,
            @Param("limite") LocalDate limite);

    @Query("SELECT p FROM PeriodoAquisitivo p LEFT JOIN FETCH p.employee " +
           "WHERE p.status IN (:statuses) AND p.limiteConcessivo BETWEEN :inicio AND :fim")
    List<PeriodoAquisitivo> findByStatusInAndLimiteConcessivoBetween(
            @Param("statuses") List<PeriodoAquisitivoStatus> statuses,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);

    boolean existsByEmployeeIdAndDataInicio(UUID employeeId, LocalDate dataInicio);
}
