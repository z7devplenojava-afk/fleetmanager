package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.MedicalExam;
import br.com.fleetmanager.model.MedicalExamType;
// import br.com.fleetmanager.model.enums.MedicalExamResult;
// import br.com.fleetmanager.model.enums.MedicalExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de exames médicos
 */
@Repository
public interface MedicalExamRepository extends JpaRepository<MedicalExam, UUID> {

    /**
     * Busca exames por funcionário
     */
    List<MedicalExam> findByEmployee(Employee employee);

    /**
     * Busca exames por ID do funcionário
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.employee.id = :employeeId")
    List<MedicalExam> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca exames por tipo
     */
    List<MedicalExam> findByExamType(MedicalExamType examType);

    /**
     * Busca exames por status
     */
    // List<MedicalExam> findByStatus(MedicalExamStatus status);

    /**
     * Busca exames por resultado
     */
    // List<MedicalExam> findByResult(MedicalExamResult result);

    /**
     * Busca exames por funcionário e status
     */
    // List<MedicalExam> findByEmployeeAndStatus(Employee employee, MedicalExamStatus status);

    /**
     * Busca exames por funcionário e tipo
     */
    List<MedicalExam> findByEmployeeAndExamType(Employee employee, MedicalExamType examType);

    /**
     * Busca exames por período
     */
    List<MedicalExam> findByExamDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca exames agendados para uma data
     */
    List<MedicalExam> findByScheduledDate(LocalDate scheduledDate);

    /**
     * Busca exames vencidos ou próximos do vencimento
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.nextExamDate <= :date AND me.status = 'REALIZADO'")
    List<MedicalExam> findExpiredOrExpiringExams(@Param("date") LocalDate date);

    /**
     * Busca último exame de um tipo para um funcionário
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.examType.id = :examTypeId ORDER BY me.examDate DESC")
    List<MedicalExam> findLatestExamByEmployeeAndType(@Param("employeeId") UUID employeeId, @Param("examTypeId") UUID examTypeId);

    /**
     * Busca exames pendentes por funcionário
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.status = 'PENDENTE'")
    List<MedicalExam> findPendingExamsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta exames por funcionário e status
     */
    // @Query("SELECT COUNT(me) FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.status = :status")
    // Long countByEmployeeAndStatus(@Param("employeeId") UUID employeeId, @Param("status") MedicalExamStatus status);
}
