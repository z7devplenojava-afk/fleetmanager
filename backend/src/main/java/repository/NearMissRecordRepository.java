package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.NearMissRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de registros de quase-acidentes
 */
@Repository
public interface NearMissRecordRepository extends JpaRepository<NearMissRecord, UUID> {

    /**
     * Busca quase-acidentes por funcionário
     */
    @Query("SELECT n FROM NearMissRecord n WHERE n.employee.id = :employeeId")
    List<NearMissRecord> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Busca quase-acidentes por período
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
     * Busca quase-acidentes por consequências potenciais
     */
    @Query("SELECT n FROM NearMissRecord n WHERE LOWER(n.potentialConsequences) LIKE LOWER(CONCAT('%', :potentialConsequences, '%'))")
    List<NearMissRecord> findByPotentialConsequencesContainingIgnoreCase(@Param("potentialConsequences") String potentialConsequences);

    /**
     * Conta quase-acidentes por funcionário
     */
    @Query("SELECT COUNT(n) FROM NearMissRecord n WHERE n.employee.id = :employeeId")
    Long countByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Conta quase-acidentes por período
     */
    @Query("SELECT COUNT(n) FROM NearMissRecord n WHERE n.incidentDate BETWEEN :startDate AND :endDate")
    Long countByIncidentDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
