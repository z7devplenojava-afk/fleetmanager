package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.SSTTraining;
import br.com.fleetmanager.model.TrainingParticipation;
// import br.com.fleetmanager.model.enums.TrainingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de participação em treinamentos
 */
@Repository
public interface TrainingParticipationRepository extends JpaRepository<TrainingParticipation, UUID> {

    /**
     * Busca participações por funcionário
     */
    List<TrainingParticipation> findByEmployee(Employee employee);

    /**
     * Busca participações por ID do funcionário
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId")
    List<TrainingParticipation> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca participações por treinamento
     */
    List<TrainingParticipation> findByTraining(SSTTraining training);

    /**
     * Busca participações por status
     */
    // List<TrainingParticipation> findByStatus(TrainingStatus status);

    /**
     * Busca participações por funcionário e status
     */
    // List<TrainingParticipation> findByEmployeeAndStatus(Employee employee, TrainingStatus status);

    /**
     * Busca participações por funcionário e treinamento
     */
    List<TrainingParticipation> findByEmployeeAndTraining(Employee employee, SSTTraining training);

    /**
     * Busca participações por período
     */
    List<TrainingParticipation> findByParticipationDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca participações por data de participação
     */
    List<TrainingParticipation> findByParticipationDate(LocalDate participationDate);

    /**
     * Busca participações vencidas ou próximas do vencimento
     * TODO: Implementar query PostgreSQL correta para cálculo de data de vencimento
     */
    // @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.training.validityMonths IS NOT NULL AND tp.completionDate IS NOT NULL AND tp.completionDate + INTERVAL tp.training.validityMonths MONTH <= :date AND tp.status = 'CONCLUIDO'")
    // List<TrainingParticipation> findExpiredOrExpiringTrainings(@Param("date") LocalDate date);

    /**
     * Busca última participação em um treinamento para um funcionário
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.training.id = :trainingId ORDER BY tp.completionDate DESC")
    List<TrainingParticipation> findLatestParticipationByEmployeeAndTraining(@Param("employeeId") UUID employeeId, @Param("trainingId") UUID trainingId);

    /**
     * Busca participações pendentes por funcionário
     */
    @Query("SELECT tp FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.status IN ('AGENDADO', 'EM_ANDAMENTO')")
    List<TrainingParticipation> findPendingParticipationsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta participações por funcionário e status
     */
    // @Query("SELECT COUNT(tp) FROM TrainingParticipation tp WHERE tp.employee.id = :employeeId AND tp.status = :status")
    // Long countByEmployeeAndStatus(@Param("employeeId") UUID employeeId, @Param("status") TrainingStatus status);

    /**
     * Busca participações por instrutor
     */
    List<TrainingParticipation> findByInstructorNameContainingIgnoreCase(String instructorName);
}
