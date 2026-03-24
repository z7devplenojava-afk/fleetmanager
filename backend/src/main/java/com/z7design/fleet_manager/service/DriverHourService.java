package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DriverHourCalculationMemory;
import com.z7design.fleet_manager.model.DriverWorkHour;
import com.z7design.fleet_manager.repository.DriverHourCalculationMemoryRepository;
import com.z7design.fleet_manager.repository.DriverWorkHourRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverHourService {

    private final DriverWorkHourRepository driverWorkHourRepository;
    private final DriverHourCalculationMemoryRepository calculationMemoryRepository;

    private static final LocalTime NIGHT_START = LocalTime.of(22, 0);
    private static final LocalTime NIGHT_END = LocalTime.of(5, 0);

    public java.util.List<DriverWorkHour> findByPeriod(java.time.LocalDate start, java.time.LocalDate end) {
        return driverWorkHourRepository.findByReferenceDateBetween(start, end);
    }

    public DriverWorkHour getJornada(java.util.UUID id) {
        return driverWorkHourRepository.findById(id).orElseThrow(() -> new RuntimeException("Jornada não encontrada"));
    }

    @Transactional
    public DriverWorkHour saveJornada(DriverWorkHour workHour) {
        calculateHours(workHour);
        DriverWorkHour saved = driverWorkHourRepository.save(workHour);
        saveCalculationMemory(saved);
        return saved;
    }

    private void calculateHours(DriverWorkHour workHour) {
        if (workHour.getStartTime() == null || workHour.getEndTime() == null) {
            return;
        }

        LocalDateTime start = workHour.getStartTime();
        LocalDateTime end = workHour.getEndTime();

        // 1. Total Minutes
        long totalMinutes = Duration.between(start, end).toMinutes();
        workHour.setTotalMinutes((int) totalMinutes);

        // 2. Night Minutes
        int nightMinutes = calculateNightMinutes(start, end);
        workHour.setNightMinutes(nightMinutes);

        // TODO: Implement Wait Time subtraction and actual Lei 13.103 Overtime rules
        // For now, simplicity: Overtime = Total - 8h (480 min)
        int normalMinutes = 480;
        workHour.setOvertimeMinutes(Math.max(0, (int) totalMinutes - normalMinutes));
    }

    private int calculateNightMinutes(LocalDateTime start, LocalDateTime end) {
        int nightMinutes = 0;
        LocalDateTime current = start;

        // Simples iteração minuto a minuto para precisão em viradas de dia
        // Otimização possível, mas para jornadas de um dia isso é OK
        while (current.isBefore(end)) {
            LocalTime time = current.toLocalTime();
            if (isNightTime(time)) {
                nightMinutes++;
            }
            current = current.plusMinutes(1);
        }

        return nightMinutes;
    }

    private boolean isNightTime(LocalTime time) {
        return time.isAfter(NIGHT_START.minusSeconds(1)) || time.isBefore(NIGHT_END.plusSeconds(1));
    }

    private void saveCalculationMemory(DriverWorkHour saved) {
        StringBuilder log = new StringBuilder();
        log.append("Calculation for Jornada ID: ").append(saved.getId()).append("\n");
        log.append("Start: ").append(saved.getStartTime()).append("\n");
        log.append("End: ").append(saved.getEndTime()).append("\n");
        log.append("Total Minutes: ").append(saved.getTotalMinutes()).append("\n");
        log.append("Night Minutes: ").append(saved.getNightMinutes()).append("\n");
        log.append("Overtime Minutes: ").append(saved.getOvertimeMinutes()).append("\n");

        DriverHourCalculationMemory memory = DriverHourCalculationMemory.builder()
                .driverWorkHour(saved)
                .calculationLog(log.toString())
                .appliedRules("Lei 13.103 - Standard 8h jornada, Night Shift 22:00-05:00")
                .build();

        calculationMemoryRepository.save(memory);
    }

    public com.z7design.fleet_manager.model.DriverHourCalculationMemory getCalculationMemory(
            java.util.UUID workHourId) {
        return calculationMemoryRepository.findByDriverWorkHourId(workHourId)
                .orElse(com.z7design.fleet_manager.model.DriverHourCalculationMemory.builder()
                        .calculationLog("Memória não encontrada para este registro.")
                        .appliedRules("-")
                        .build());
    }
}
