package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {
    boolean existsByLicenseNumber(String licenseNumber);
    Optional<Driver> findByLicenseNumber(String licenseNumber);
    Optional<Driver> findByCpf(String cpf);
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM drivers WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
    Optional<Driver> findByCleanCpfGlobal(@org.springframework.data.repository.query.Param("cpf") String cpf);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM drivers WHERE company_id = :companyId AND REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cpf LIMIT 1", nativeQuery = true)
    Optional<Driver> findByCleanCpfAndCompanyId(@org.springframework.data.repository.query.Param("cpf") String cpf, @org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
