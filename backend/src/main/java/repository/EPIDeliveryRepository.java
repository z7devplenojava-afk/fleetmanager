package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.EPIDelivery;
import br.com.fleetmanager.model.PersonalProtectiveEquipment;
// import br.com.fleetmanager.model.enums.EPIDeliveryReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repositório para gerenciamento de entregas de EPIs
 */
@Repository
public interface EPIDeliveryRepository extends JpaRepository<EPIDelivery, UUID> {

    /**
     * Busca entregas por funcionário
     */
    List<EPIDelivery> findByEmployee(Employee employee);

    /**
     * Busca entregas por ID do funcionário
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
     * Busca entregas por período
     */
    List<EPIDelivery> findByDeliveryDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas por funcionário e período
     */
    List<EPIDelivery> findByEmployeeAndDeliveryDateBetween(Employee employee, LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas por EPI e período
     */
    List<EPIDelivery> findByEpiAndDeliveryDateBetween(PersonalProtectiveEquipment epi, LocalDate startDate, LocalDate endDate);

    /**
     * Busca entregas não confirmadas pelo funcionário
     */
    List<EPIDelivery> findByReceivedByEmployeeFalse();

    /**
     * Busca entregas por funcionário e EPI
     */
    List<EPIDelivery> findByEmployeeAndEpi(Employee employee, PersonalProtectiveEquipment epi);

    /**
     * Busca última entrega de um EPI para um funcionário
     */
    @Query("SELECT e FROM EPIDelivery e WHERE e.employee.id = :employeeId AND e.epi.id = :epiId ORDER BY e.deliveryDate DESC")
    List<EPIDelivery> findLatestDeliveryByEmployeeAndEpi(@Param("employeeId") UUID employeeId, @Param("epiId") UUID epiId);

    /**
     * Conta entregas por funcionário e período
     */
    @Query("SELECT COUNT(e) FROM EPIDelivery e WHERE e.employee.id = :employeeId AND e.deliveryDate BETWEEN :startDate AND :endDate")
    Long countByEmployeeAndDeliveryDateBetween(@Param("employeeId") UUID employeeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
