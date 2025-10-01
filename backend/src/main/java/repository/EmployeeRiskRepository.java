package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.EmployeeRisk;
// import br.com.fleetmanager.model.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de riscos por funcionário
 */
@Repository
public interface EmployeeRiskRepository extends JpaRepository<EmployeeRisk, UUID> {

    /**
     * Busca riscos por funcionário
     */
    List<EmployeeRisk> findByEmployee(Employee employee);

    /**
     * Busca riscos por ID do funcionário
     */
    List<EmployeeRisk> findByEmployeeId(UUID employeeId);

    /**
     * Busca riscos ativos por funcionário
     */
    List<EmployeeRisk> findByEmployeeAndIsActiveTrue(Employee employee);

    /**
     * Busca riscos por nível
     */
    // List<EmployeeRisk> findByRiskLevel(RiskLevel riskLevel);

    /**
     * Busca riscos por funcionário e nível
     */
    // List<EmployeeRisk> findByEmployeeAndRiskLevel(Employee employee, RiskLevel riskLevel);

    /**
     * Verifica se existe risco para o funcionário e tipo de risco
     */
    boolean existsByEmployeeIdAndRiskTypeId(UUID employeeId, UUID riskTypeId);

    /**
     * Busca riscos por múltiplos funcionários
     */
    @Query("SELECT er FROM EmployeeRisk er WHERE er.employee.id IN :employeeIds AND er.isActive = true")
    List<EmployeeRisk> findByEmployeeIdInAndIsActiveTrue(@Param("employeeIds") List<UUID> employeeIds);
}
