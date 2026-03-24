package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.TimeBank;
import com.z7design.fleet_manager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TimeBankRepository extends JpaRepository<TimeBank, UUID> {
    Optional<TimeBank> findByDriver(User driver);

    Optional<TimeBank> findByDriverId(UUID driverId);
}
