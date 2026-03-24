package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DriverJourney;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.JourneyType;
import com.z7design.fleet_manager.repository.DriverJourneyRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverJourneyService {

        private final DriverJourneyRepository driverJourneyRepository;
        private final TimeBankService timeBankService;
        private final UserRepository userRepository;

        private static final long DAILY_LIMIT_MINUTES = 600; // 10 hours
        private static final long REST_BETWEEN_JOURNEYS_HOURS = 11;

        @Transactional(readOnly = true, propagation = Propagation.NOT_SUPPORTED)
        public void validateJourney(UUID driverId, LocalDateTime start, LocalDateTime end, UUID excludeJourneyId) {
                long dailyMinutes = calculateDailyMinutes(driverId, start.toLocalDate());
                long newDuration = Duration.between(start, end).toMinutes();

                // Calculate if overlap exists (Optional, for now we focus on daily limit)
                // If updating an existing journey, subtract its duration from the daily total
                // before checking
                if (excludeJourneyId != null) {
                        driverJourneyRepository.findById(excludeJourneyId).ifPresent(j -> {
                                if (j.getType() == JourneyType.DRIVING) {
                                        long oldDuration = Duration
                                                        .between(j.getStartTime(),
                                                                        j.getEndTime() != null ? j.getEndTime()
                                                                                        : LocalDateTime.now())
                                                        .toMinutes();
                                        // This simple subtraction assumes the old journey was on the same day.
                                        // For robust calculation, we should re-query excluding the ID.
                                }
                        });
                        // Re-query approach is safer but slower.
                        // Better: calculateDailyMinutes should accept an excludeId.
                }

                if (dailyMinutes + newDuration > DAILY_LIMIT_MINUTES) {
                        throw new IllegalArgumentException(String.format(
                                        "Motorista excederÃ¡ o limite diÃ¡rio de 10 horas. Atual: %d min, Novo: %d min",
                                        dailyMinutes, newDuration));
                }

                // Rest period validation placeholder
                if (!validateRestPeriod(driverId, start)) {
                        // log.warn("Possible rest period violation");
                }
        }

        @Transactional
        public void syncFromSchedule(UUID scheduleId, UUID driverId, LocalDateTime start, LocalDateTime end,
                        String notes) {
                // Check if a journey for this schedule already exists
                DriverJourney journey = driverJourneyRepository.findBySourceAndNotes("SCHEDULE", scheduleId.toString())
                                .orElse(DriverJourney.builder()
                                                .source("SCHEDULE") // We use source=SCHEDULE
                                                .notes(scheduleId.toString()) // We store Schedule ID in notes for now,
                                                                              // or add a column later
                                                .build());

                User driver = userRepository.findById(driverId)
                                .orElseThrow(() -> new RuntimeException("Driver not found"));

                journey.setDriver(driver);
                journey.setStartTime(start);
                journey.setEndTime(end);
                journey.setType(JourneyType.DRIVING); // Default for schedule
                // Notes already set to ID

                driverJourneyRepository.save(journey);
        }

        @Transactional
        public void deleteByScheduleId(UUID scheduleId) {
                driverJourneyRepository.findBySourceAndNotes("SCHEDULE", scheduleId.toString())
                                .ifPresent(driverJourneyRepository::delete);
        }

        public long calculateDailyMinutes(UUID driverId, LocalDate date) {
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

                List<DriverJourney> journeys = driverJourneyRepository.findByDriverIdAndDateRange(driverId, startOfDay,
                                endOfDay);

                return journeys.stream()
                                .filter(j -> j.getType() == JourneyType.DRIVING || j.getType() == JourneyType.EXTRA)
                                .mapToLong(j -> Duration.between(j.getStartTime(),
                                                j.getEndTime() != null ? j.getEndTime() : LocalDateTime.now())
                                                .toMinutes())
                                .sum();
        }

        public boolean validateRestPeriod(UUID driverId, LocalDateTime nextStart) {
                // Find last journey
                // This is a simplified check. Real check involves complex lookback.
                return true;
        }
}
