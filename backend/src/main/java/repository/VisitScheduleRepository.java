package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.VisitSchedule;
import br.com.fleetmanager.model.enums.VisitScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VisitScheduleRepository extends JpaRepository<VisitSchedule, UUID> {
    
    List<VisitSchedule> findBySupervisorAndScheduleDateBetween(
        Employee supervisor, LocalDate startDate, LocalDate endDate);
    
    List<VisitSchedule> findByScheduleDateAndStatus(
        LocalDate scheduleDate, VisitScheduleStatus status);
    
    List<VisitSchedule> findBySupervisorIdAndScheduleDateBetween(
        UUID supervisorId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT vs FROM VisitSchedule vs " +
           "WHERE vs.client.id = :clientId " +
           "AND vs.scheduleDate BETWEEN :startDate AND :endDate")
    List<VisitSchedule> findByClientAndDateRange(
        @Param("clientId") UUID clientId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
    
    @Query("SELECT vs FROM VisitSchedule vs " +
           "WHERE vs.supervisor.id = :supervisorId " +
           "AND vs.scheduleDate = :scheduleDate " +
           "AND vs.status != 'CANCELLED'")
    List<VisitSchedule> findActiveBySupervisorAndDate(
        @Param("supervisorId") UUID supervisorId,
        @Param("scheduleDate") LocalDate scheduleDate);
    
    @Query("SELECT COUNT(vs) FROM VisitSchedule vs " +
           "WHERE vs.supervisor.id = :supervisorId " +
           "AND vs.scheduleDate BETWEEN :startDate AND :endDate " +
           "AND vs.status = 'COMPLETED'")
    Long countCompletedBySuperviserAndDateRange(
        @Param("supervisorId") UUID supervisorId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
