package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {
    boolean existsByLicenseNumber(String licenseNumber);
    Optional<Driver> findByLicenseNumber(String licenseNumber);
    Optional<Driver> findByCpf(String cpf);

    @Query(value = "SELECT * FROM drivers WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
    Optional<Driver> findByCleanCpfGlobal(@Param("cpf") String cpf);

    Optional<Driver> findByUserId(UUID userId);

    @Query(value = "SELECT * FROM drivers WHERE user_id = :userId LIMIT 1", nativeQuery = true)
    Optional<Driver> findByUserIdGlobal(@Param("userId") UUID userId);

    List<Driver> findByNameContainingIgnoreCase(String name);

    List<Driver> findByNameIgnoreCase(String name);

    @Query(value = "SELECT * FROM drivers WHERE company_id = :companyId AND REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
    Optional<Driver> findByCleanCpfAndCompanyId(@Param("cpf") String cpf, @Param("companyId") UUID companyId);

    @Query("SELECT d FROM Driver d WHERE d.cnhExpiration IS NOT NULL AND (:companyId IS NULL OR d.companyId = :companyId)")
    List<Driver> findWithCnhExpirationByCompany(@Param("companyId") UUID companyId);
}
