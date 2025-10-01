package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Visit;
import br.com.fleetmanager.model.enums.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitRepository extends JpaRepository<Visit, UUID> {
    
    // Buscar visitas por supervisor
    List<Visit> findBySupervisorIdOrderByVisitDateDesc(UUID supervisorId);
    
    // Buscar visitas por supervisor em um período
    @Query("SELECT v FROM Visit v WHERE v.supervisor.id = :supervisorId AND v.visitDate BETWEEN :startDate AND :endDate ORDER BY v.visitDate ASC")
    List<Visit> findBySupervisorIdAndDateRange(@Param("supervisorId") UUID supervisorId, 
                                               @Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);
    
    // Buscar visitas por setor
    List<Visit> findByUnitIdOrderByVisitDateDesc(UUID unitId);
    
    // Buscar visitas por mês/ano
    @Query("SELECT v FROM Visit v WHERE YEAR(v.visitDate) = :year AND MONTH(v.visitDate) = :month ORDER BY v.visitDate ASC")
    List<Visit> findByYearAndMonth(@Param("year") int year, @Param("month") int month);
    
    // Buscar visitas por supervisor, mês e ano
    @Query("SELECT v FROM Visit v WHERE v.supervisor.id = :supervisorId AND YEAR(v.visitDate) = :year AND MONTH(v.visitDate) = :month ORDER BY v.visitDate ASC")
    List<Visit> findBySupervisorIdAndYearAndMonth(@Param("supervisorId") UUID supervisorId, 
                                                  @Param("year") int year, 
                                                  @Param("month") int month);
    
    // Verificar se já existe visita para um supervisor/setor/data
    Optional<Visit> findBySupervisorIdAndUnitIdAndVisitDate(UUID supervisorId, UUID unitId, LocalDate visitDate);
    
    // Estatísticas por supervisor e mês
    @Query("SELECT COUNT(v) FROM Visit v WHERE v.supervisor.id = :supervisorId AND YEAR(v.visitDate) = :year AND MONTH(v.visitDate) = :month")
    Long countBySupervisorIdAndYearAndMonth(@Param("supervisorId") UUID supervisorId, 
                                            @Param("year") int year, 
                                            @Param("month") int month);
    
    // Estatísticas por status
    @Query("SELECT COUNT(v) FROM Visit v WHERE v.supervisor.id = :supervisorId AND v.status = :status AND YEAR(v.visitDate) = :year AND MONTH(v.visitDate) = :month")
    Long countBySupervisorIdAndStatusAndYearAndMonth(@Param("supervisorId") UUID supervisorId, 
                                                     @Param("status") VisitStatus status,
                                                     @Param("year") int year, 
                                                     @Param("month") int month);
    
    // Buscar visitas pendentes
    @Query("SELECT v FROM Visit v WHERE v.status = 'PENDING' AND v.visitDate <= CURRENT_DATE ORDER BY v.visitDate ASC")
    List<Visit> findPendingVisits();
    
    // Buscar visitas de hoje por supervisor
    @Query("SELECT v FROM Visit v WHERE v.supervisor.id = :supervisorId AND v.visitDate = CURRENT_DATE")
    List<Visit> findTodaysVisitsBySupervisor(@Param("supervisorId") UUID supervisorId);
}
