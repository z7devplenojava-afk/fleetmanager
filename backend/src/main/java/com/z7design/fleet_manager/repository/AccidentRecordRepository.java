package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.AccidentRecord;
import com.z7design.fleet_manager.model.Employee;
// import com.z7design.fleet_manager.model.enums.AccidentStatus;
// import com.z7design.fleet_manager.model.enums.AccidentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de registros de acidentes
 */
@Repository
public interface AccidentRecordRepository extends JpaRepository<AccidentRecord, UUID> {

    /**
     * Busca acidentes por funcionÃ¡rio
     */
    List<AccidentRecord> findByEmployee(Employee employee);

    /**
     * Busca acidentes por ID do funcionÃ¡rio
     */
    @Query("SELECT ar FROM AccidentRecord ar WHERE ar.employee.id = :employeeId")
    List<AccidentRecord> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca acidentes por tipo
     */
    // List<AccidentRecord> findByAccidentType(AccidentType accidentType);

    /**
     * Busca acidentes por status
     */
    // List<AccidentRecord> findByStatus(AccidentStatus status);

    /**
     * Busca acidentes por perÃ­odo
     */
    List<AccidentRecord> findByAccidentDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca acidentes por funcionÃ¡rio e perÃ­odo
     */
    List<AccidentRecord> findByEmployeeAndAccidentDateBetween(Employee employee, LocalDate startDate, LocalDate endDate);

    /**
     * Busca acidentes por local
     */
    List<AccidentRecord> findByLocationContainingIgnoreCase(String location);

    /**
     * Busca acidentes com afastamento
     */
    @Query("SELECT ar FROM AccidentRecord ar WHERE ar.accidentType IN ('COM_AFASTAMENTO', 'MORTAL')")
    List<AccidentRecord> findAccidentsWithTimeOff();

    /**
     * Busca acidentes sem afastamento
     */
    @Query("SELECT ar FROM AccidentRecord ar WHERE ar.accidentType = 'SEM_AFASTAMENTO'")
    List<AccidentRecord> findAccidentsWithoutTimeOff();

    /**
     * Busca acidentes por nÃºmero da CAT
     */
    List<AccidentRecord> findByCatNumber(String catNumber);

    /**
     * Conta acidentes por funcionÃ¡rio e perÃ­odo
     */
    @Query("SELECT COUNT(ar) FROM AccidentRecord ar WHERE ar.employee.id = :employeeId AND ar.accidentDate BETWEEN :startDate AND :endDate")
    Long countByEmployeeAndAccidentDateBetween(@Param("employeeId") UUID employeeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Conta acidentes por tipo e perÃ­odo
     */
    // @Query("SELECT COUNT(ar) FROM AccidentRecord ar WHERE ar.accidentType = :accidentType AND ar.accidentDate BETWEEN :startDate AND :endDate")
    // Long countByAccidentTypeAndAccidentDateBetween(@Param("accidentType") AccidentType accidentType, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Busca acidentes por status e perÃ­odo
     */
    // List<AccidentRecord> findByStatusAndAccidentDateBetween(AccidentStatus status, LocalDate startDate, LocalDate endDate);
}

