package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BoardingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardingRecordRepository extends JpaRepository<BoardingRecord, UUID> {
    List<BoardingRecord> findByTripId(UUID tripId);

    List<BoardingRecord> findByPassengerId(UUID passengerId);
}
