package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.SSTTraining;
import com.z7design.fleet_manager.model.TrainingParticipation;
// import com.z7design.fleet_manager.model.enums.TrainingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de participaÃ§Ã£o em treinamentos
 */
@Repository
public interface TrainingParticipationRepository extends JpaRepository<TrainingParticipation, UUID> {

    /**
     * Busca participaÃ§Ãµes por funcionÃ¡rio
     */
    List<TrainingParticipation> findByEmployee(Employee employee);

    /**
     * Busca participaÃ§Ãµes por ID do funcionÃ¡rio
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId")
    List<TrainingParticipation> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca participaÃ§Ãµes por treinamento
     */
    List<TrainingParticipation> findByTraining(SSTTraining training);

    /**
     * Busca participaÃ§Ãµes por status
     */
    // List<TrainingParticipation> findByStatus(TrainingStatus status);

    /**
     * Busca participaÃ§Ãµes por funcionÃ¡rio e status
     */
    // List<TrainingParticipation> findByEmployeeAndStatus(Employee employee, TrainingStatus status);

    /**
     * Busca participaÃ§Ãµes por funcionÃ¡rio e treinamento
     */
    List<TrainingParticipation> findByEmployeeAndTraining(Employee employee, SSTTraining training);

    /**
     * Busca participaÃ§Ãµes por perÃ­odo
     */
    List<TrainingParticipation> findByParticipationDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca participaÃ§Ãµes por data de participaÃ§Ã£o
     */
    List<TrainingParticipation> findByParticipationDate(LocalDate participationDate);

    /**
     * Busca participaÃ§Ãµes vencidas ou prÃ³ximas do vencimento
     * TODO: Implementar query PostgreSQL correta para cÃ¡lculo de data de vencimento
     */
    // @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.training.validityMonths IS NOT NULL AND tp.completionDate IS NOT NULL AND tp.completionDate + INTERVAL tp.training.validityMonths MONTH <= :date AND tp.status = 'CONCLUIDO'")
    // List<TrainingParticipation> findExpiredOrExpiringTrainings(@Param("date") LocalDate date);

    /**
     * Busca Ãºltima participaÃ§Ã£o em um treinamento para um funcionÃ¡rio
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.training.id = :trainingId ORDER BY tp.completionDate DESC")
    List<TrainingParticipation> findLatestParticipationByEmployeeAndTraining(@Param("employeeId") UUID employeeId, @Param("trainingId") UUID trainingId);

    /**
     * Busca participaÃ§Ãµes pendentes por funcionÃ¡rio
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.status IN ('AGENDADO', 'EM_ANDAMENTO')")
    List<TrainingParticipation> findPendingParticipationsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta participaÃ§Ãµes por funcionÃ¡rio e status
     */
    // @Query("SELECT COUNT(tp) FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.status = :status")
    // Long countByEmployeeAndStatus(@Param("employeeId") UUID employeeId, @Param("status") TrainingStatus status);

    /**
     * Busca participaÃ§Ãµes por instrutor
     */
    List<TrainingParticipation> findByInstructorNameContainingIgnoreCase(String instructorName);
}

