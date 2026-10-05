package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.EPIDelivery;
import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
// import com.z7design.fleet_manager.model.enums.EPIDeliveryReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * RepositÃ³rio para gerenciamento de entregas de EPIs
 */
@Repository
public interface EPIDeliveryRepository extends JpaRepository<EPIDelivery, UUID> {

    /**
     * Busca entregas por funcionÃ¡rio
     */
    List<EPIDelivery> findByEmployee(Employee employee);

    /**
     * Busca entregas por ID do funcionÃ¡rio
     */
    List<EPIDelivery> findByEmployeeId(UUID employeeId);

    /**
     * Busca entregas por EPI
     */
    List<EPIDelivery> findByEpi(PersonalProtectiveEquipment epi);

    /**
     * Busca entregas por motivo
     */
    // List<EPIDelivery> findByDeliveryReason(EPIDeliveryReason deliveryReason);

    /**
     * Busca entregas por perÃ­odo
     */
    List<EPIDelivery> findByDeliveryDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas por funcionÃ¡rio e perÃ­odo
     */
    List<EPIDelivery> findByEmployeeAndDeliveryDateBetween(Employee employee, LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas por EPI e perÃ­odo
     */
    List<EPIDelivery> findByEpiAndDeliveryDateBetween(PersonalProtectiveEquipment epi, LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas nÃ£o confirmadas pelo funcionÃ¡rio
     */
    List<EPIDelivery> findByReceivedByEmployeeFalse();

    /**
     * Busca entregas por funcionÃ¡rio e EPI
     */
    List<EPIDelivery> findByEmployeeAndEpi(Employee employee, PersonalProtectiveEquipment epi);

    /**
     * Busca Ãºltima entrega de um EPI para um funcionÃ¡rio
     */
    @Query("SELECT e FROM EPIDelivery e WHERE e.employee.id = :employeeId AND e.epi.id = :epiId ORDER BY e.deliveryDate DESC")
    List<EPIDelivery> findLatestDeliveryByEmployeeAndEpi(@Param("employeeId") UUID employeeId, @Param("epiId") UUID epiId);

    /**
     * Busca entregas por status
     */
    List<EPIDelivery> findByStatus(String status);

    /**
     * Conta entregas por funcionário e período
     */
    @Query("SELECT COUNT(e) FROM EPIDelivery e WHERE e.employee.id = :employeeId AND e.deliveryDate BETWEEN :startDate AND :endDate")
    Long countByEmployeeAndDeliveryDateBetween(@Param("employeeId") UUID employeeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

