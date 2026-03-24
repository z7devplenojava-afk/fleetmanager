package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.RouteExecution;
import com.z7design.fleet_manager.model.RouteExecutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RouteExecutionRepository extends JpaRepository<RouteExecution, UUID> {

    /** Execuções de um turno */
    List<RouteExecution> findByDriverShiftIdOrderByExecutionOrder(UUID driverShiftId);

    /** Execuções de uma rota */
    List<RouteExecution> findByRouteId(UUID routeId);

    /** Execuções de um motorista */
    List<RouteExecution> findByDriverId(UUID driverId);

    /** Execuções por status */
    List<RouteExecution> findByStatus(RouteExecutionStatus status);

    /** Execuções de realocação */
    List<RouteExecution> findByReallocationTrue();

    /** Média de duração real de uma rota (para melhorar estimativas futuras) */
    @Query("SELECT AVG(re.actualDurationMinutes) FROM RouteExecution re " +
           "WHERE re.route.id = :routeId AND re.status = 'COMPLETED' " +
           "AND re.actualDurationMinutes IS NOT NULL")
    Double findAverageActualDuration(@Param("routeId") UUID routeId);

    /** Conta execuções ativas em um turno */
    @Query("SELECT COUNT(re) FROM RouteExecution re " +
           "WHERE re.driverShift.id = :shiftId " +
           "AND re.status IN ('SCHEDULED', 'IN_PROGRESS')")
    long countActiveExecutions(@Param("shiftId") UUID shiftId);

    /** Conta execuções por status e data do turno */
    @Query("SELECT COUNT(re) FROM RouteExecution re " +
           "WHERE re.status = :status " +
           "AND re.driverShift.shiftDate = :date")
    long countByStatusAndShiftDate(@Param("status") RouteExecutionStatus status,
                                   @Param("date") LocalDate date);
}
