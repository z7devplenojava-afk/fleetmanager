package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.MedicalCertificate;
import com.z7design.fleet_manager.model.enums.MedicalCertificateStatus;
import com.z7design.fleet_manager.model.enums.MedicalCertificateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicalCertificateRepository extends JpaRepository<MedicalCertificate, UUID> {

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e LEFT JOIN FETCH e.position LEFT JOIN FETCH e.workPost LEFT JOIN FETCH e.company ORDER BY mc.startDate DESC")
    List<MedicalCertificate> findAllWithDetails();

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e LEFT JOIN FETCH e.position LEFT JOIN FETCH e.workPost LEFT JOIN FETCH e.company WHERE mc.employee.id = :employeeId ORDER BY mc.startDate DESC")
    List<MedicalCertificate> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e WHERE mc.status = :status ORDER BY mc.startDate DESC")
    List<MedicalCertificate> findByStatus(@Param("status") MedicalCertificateStatus status);

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e WHERE mc.type = :type ORDER BY mc.startDate DESC")
    List<MedicalCertificate> findByType(@Param("type") MedicalCertificateType type);

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e WHERE mc.startDate <= :date AND mc.endDate >= :date AND mc.status = 'APROVADO'")
    List<MedicalCertificate> findActiveOnDate(@Param("date") LocalDate date);

    @Query("SELECT mc FROM MedicalCertificate mc LEFT JOIN FETCH mc.employee e WHERE mc.startDate BETWEEN :startDate AND :endDate OR mc.endDate BETWEEN :startDate AND :endDate ORDER BY mc.startDate DESC")
    List<MedicalCertificate> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
