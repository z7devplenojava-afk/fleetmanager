package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.DailyLogBookEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyLogBookEntryRepository extends JpaRepository<DailyLogBookEntry, UUID> {

    List<DailyLogBookEntry> findByBookIdOrderBySequentialNumberAsc(UUID bookId);

    Optional<DailyLogBookEntry> findByBookIdAndSequentialNumber(UUID bookId, Integer sequentialNumber);

    Optional<DailyLogBookEntry> findByDailyLogId(UUID dailyLogId);
}
