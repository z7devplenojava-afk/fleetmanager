package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.EmployeeRisk;
// import com.z7design.fleet_manager.model.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de riscos por funcionÃ¡rio
 */
@Repository
public interface EmployeeRiskRepository extends JpaRepository<EmployeeRisk, UUID> {

    /**
     * Busca riscos por funcionÃ¡rio
     */
    List<EmployeeRisk> findByEmployee(Employee employee);

    /**
     * Busca riscos por ID do funcionÃ¡rio
     */
    List<EmployeeRisk> findByEmployeeId(UUID employeeId);

    /**
     * Busca riscos ativos por funcionÃ¡rio
     */
    List<EmployeeRisk> findByEmployeeAndIsActiveTrue(Employee employee);

    /**
     * Busca riscos por nÃ­vel
     */
    // List<EmployeeRisk> findByRiskLevel(RiskLevel riskLevel);

    /**
     * Busca riscos por funcionÃ¡rio e nÃ­vel
     */
    // List<EmployeeRisk> findByEmployeeAndRiskLevel(Employee employee, RiskLevel riskLevel);

    /**
     * Verifica se existe risco para o funcionÃ¡rio e tipo de risco
     */
    boolean existsByEmployeeIdAndRiskTypeId(UUID employeeId, UUID riskTypeId);

    /**
     * Busca riscos por mÃºltiplos funcionÃ¡rios
     */
    @Query("SELECT er FROM EmployeeRisk er WHERE er.employee.id IN :employeeIds AND er.isActive = true")
    List<EmployeeRisk> findByEmployeeIdInAndIsActiveTrue(@Param("employeeIds") List<UUID> employeeIds);
}

