package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.PayrollItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayrollItemRepository extends JpaRepository<PayrollItem, UUID> {

    List<PayrollItem> findByPayrollId(UUID payrollId);

    List<PayrollItem> findByEmployeeId(UUID employeeId);

    List<PayrollItem> findByPayrollClosureId(UUID payrollClosureId);

    @Query("SELECT pi FROM PayrollItem pi WHERE pi.payrollClosure.id = :payrollClosureId AND pi.type = :type")
    List<PayrollItem> findByPayrollClosureIdAndType(@Param("payrollClosureId") UUID payrollClosureId, 
                                                     @Param("type") PayrollItem.ItemType type);

    @Query("SELECT pi FROM PayrollItem pi WHERE pi.payrollClosure.id = :payrollClosureId AND pi.category = :category")
    List<PayrollItem> findByPayrollClosureIdAndCategory(@Param("payrollClosureId") UUID payrollClosureId, 
                                                         @Param("category") PayrollItem.ItemCategory category);

    @Query("SELECT pi FROM PayrollItem pi WHERE pi.employee.id = :employeeId ORDER BY pi.createdAt DESC")
    List<PayrollItem> findByEmployeeIdOrderByCreatedAtDesc(@Param("employeeId") UUID employeeId);

    void deleteByPayrollClosureId(UUID payrollClosureId);
}






