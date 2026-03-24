package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.NearMissRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de registros de quase-acidentes
 */
@Repository
public interface NearMissRecordRepository extends JpaRepository<NearMissRecord, UUID> {

    /**
     * Busca quase-acidentes por funcionÃ¡rio
     */
    @Query("SELECT n FROM NearMissRecord n WHERE n.employee.id = :employeeId")
    List<NearMissRecord> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca quase-acidentes por perÃ­odo
     */
    List<NearMissRecord> findByIncidentDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca quase-acidentes por data
     */
    List<NearMissRecord> findByIncidentDate(LocalDate incidentDate);

    /**
     * Busca quase-acidentes por local
     */
    List<NearMissRecord> findByLocationContainingIgnoreCase(String location);

    /**
     * Busca quase-acidentes por consequÃªncias potenciais
     */
    @Query("SELECT n FROM NearMissRecord n WHERE LOWER(n.potentialConsequences) LIKE LOWER(CONCAT('%', :potentialConsequences, '%'))")
    List<NearMissRecord> findByPotentialConsequencesContainingIgnoreCase(@Param("potentialConsequences") String potentialConsequences);

    /**
     * Conta quase-acidentes por funcionÃ¡rio
     */
    @Query("SELECT COUNT(n) FROM NearMissRecord n WHERE n.employee.id = :employeeId")
    Long countByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Conta quase-acidentes por perÃ­odo
     */
    @Query("SELECT COUNT(n) FROM NearMissRecord n WHERE n.incidentDate BETWEEN :startDate AND :endDate")
    Long countByIncidentDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

