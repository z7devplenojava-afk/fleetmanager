package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.repository.DailyLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyLogService {

    private final DailyLogRepository repository;

    public List<DailyLog> findAll() {
        return repository.findAll();
    }

    public List<DailyLog> findByDateRange(LocalDate start, LocalDate end) {
        return repository.findByDateBetween(start, end);
    }

    public DailyLog findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Daily Log not found with id: " + id));
    }

    @Transactional
    public DailyLog save(DailyLog dailyLog) {
        return repository.save(dailyLog);
    }

    @Transactional
    public DailyLog update(UUID id, DailyLog dailyLog) {
        DailyLog existing = findById(id);

        existing.setDate(dailyLog.getDate());
        existing.setVehicle(dailyLog.getVehicle());
        existing.setClient(dailyLog.getClient());
        existing.setRoute(dailyLog.getRoute());
        existing.setShift(dailyLog.getShift());
        existing.setInitialKm(dailyLog.getInitialKm());
        existing.setFinalKm(dailyLog.getFinalKm());
        existing.setDiscountedKm(dailyLog.getDiscountedKm());
        existing.setAllowance(dailyLog.getAllowance());
        existing.setNotes(dailyLog.getNotes());

        return repository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
