package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.MedicalExam;
import com.z7design.fleet_manager.model.MedicalExamType;
// import com.z7design.fleet_manager.model.enums.MedicalExamResult;
// import com.z7design.fleet_manager.model.enums.MedicalExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de exames mÃ©dicos
 */
@Repository
public interface MedicalExamRepository extends JpaRepository<MedicalExam, UUID> {

    /**
     * Busca exames por funcionÃ¡rio
     */
    List<MedicalExam> findByEmployee(Employee employee);

    /**
     * Busca exames por ID do funcionÃ¡rio
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
     * Busca exames por funcionÃ¡rio e status
     */
    // List<MedicalExam> findByEmployeeAndStatus(Employee employee, MedicalExamStatus status);

    /**
     * Busca exames por funcionÃ¡rio e tipo
     */
    List<MedicalExam> findByEmployeeAndExamType(Employee employee, MedicalExamType examType);

    /**
     * Busca exames por perÃ­odo
     */
    List<MedicalExam> findByExamDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca exames agendados para uma data
     */
    List<MedicalExam> findByScheduledDate(LocalDate scheduledDate);

    /**
     * Busca exames vencidos ou prÃ³ximos do vencimento
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.nextExamDate <= :date AND me.status = 'REALIZADO'")
    List<MedicalExam> findExpiredOrExpiringExams(@Param("date") LocalDate date);

    /**
     * Busca Ãºltimo exame de um tipo para um funcionÃ¡rio
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.examType.id = :examTypeId ORDER BY me.examDate DESC")
    List<MedicalExam> findLatestExamByEmployeeAndType(@Param("employeeId") UUID employeeId, @Param("examTypeId") UUID examTypeId);

    /**
     * Busca exames pendentes por funcionÃ¡rio
     */
    @Query("SELECT me FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.status = 'PENDENTE'")
    List<MedicalExam> findPendingExamsByEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Conta exames por funcionÃ¡rio e status
     */
    // @Query("SELECT COUNT(me) FROM MedicalExam me WHERE me.employee.id = :employeeId AND me.status = :status")
    // Long countByEmployeeAndStatus(@Param("employeeId") UUID employeeId, @Param("status") MedicalExamStatus status);

    /**
     * Busca nomes Ãºnicos de clÃ­nicas
     */
    @Query("SELECT DISTINCT me.clinicName FROM MedicalExam me WHERE me.clinicName IS NOT NULL AND me.clinicName != '' ORDER BY me.clinicName")
    List<String> findDistinctClinicNames();
}

