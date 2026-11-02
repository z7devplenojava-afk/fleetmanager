package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, UUID> {
    List<Passenger> findByCompanyId(UUID companyId);
    List<Passenger> findByRouteId(UUID routeId);
    List<Passenger> findByReturnRouteId(UUID returnRouteId);
    List<Passenger> findByActiveTrueAndCompanyId(UUID companyId);
    List<Passenger> findByClientId(UUID clientId);
    List<Passenger> findByClientIdAndActiveTrue(UUID clientId);
    java.util.Optional<Passenger> findByRegistration(String registration);
    java.util.Optional<Passenger> findByCpf(String cpf);
    java.util.Optional<Passenger> findByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM passengers WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = :cleanCpf LIMIT 1", nativeQuery = true)
    java.util.Optional<Passenger> findByCleanCpfNative(@org.springframework.data.repository.query.Param("cleanCpf") String cleanCpf);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM passengers WHERE LOWER(TRIM(registration)) = LOWER(TRIM(:reg)) LIMIT 1", nativeQuery = true)
    java.util.Optional<Passenger> findByRegistrationIgnoreCase(@org.springframework.data.repository.query.Param("reg") String reg);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM passengers WHERE user_id = :userId LIMIT 1", nativeQuery = true)
    java.util.Optional<Passenger> findByUserIdNative(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
